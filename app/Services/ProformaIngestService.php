<?php

namespace App\Services;

use App\Models\Proforma;
use App\Models\ProformaRequest;
use App\Models\ProformaRequestSupplier;
use App\Models\Supplier;

class ProformaIngestService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
    ) {}

    /**
     * Record a proforma received from a supplier — via the Telegram webhook,
     * manual entry, or the demo "simulate" tool. Centralizes the request
     * status/pivot transitions so all three inbound paths stay consistent.
     */
    public function receive(
        ProformaRequest $pr,
        Supplier $supplier,
        array $attributes,
        string $actor,
    ): Proforma {
        $proforma = Proforma::create(array_merge([
            'request_id' => $pr->id,
            'supplier_id' => $supplier->id,
            'status' => 'received',
            'received_at' => now(),
        ], $attributes));

        ProformaRequestSupplier::where('request_id', $pr->id)
            ->where('supplier_id', $supplier->id)
            ->update(['status' => 'responded']);

        $this->syncRequestStatus($pr);

        $this->notifications->create(
            null,
            'Proforma received',
            sprintf('New proforma from "%s" for "%s".', $supplier->legal_name, $pr->title),
            'info',
            '/proformas',
        );

        $via = $attributes['received_via'] ?? 'unknown';
        $this->audit->log(
            $actor,
            'proforma',
            (string) $proforma->id,
            'received_via_'.$via,
            sprintf('Proforma from "%s" received via %s for request %s', $supplier->legal_name, $via, $pr->reference_no),
        );

        return $proforma;
    }

    /**
     * A request only moves to received/partially_received once it has been
     * sent; draft/closed/cancelled requests are left alone.
     */
    private function syncRequestStatus(ProformaRequest $pr): void
    {
        if (! in_array($pr->status, ['sent', 'partially_received'], true)) {
            return;
        }

        $invited = ProformaRequestSupplier::where('request_id', $pr->id)->count();
        $responded = ProformaRequestSupplier::where('request_id', $pr->id)->where('status', 'responded')->count();

        if ($invited > 0 && $responded >= $invited) {
            $pr->update(['status' => 'received']);
        } elseif ($responded > 0) {
            $pr->update(['status' => 'partially_received']);
        }
    }
}
