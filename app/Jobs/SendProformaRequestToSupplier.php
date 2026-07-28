<?php

namespace App\Jobs;

use App\Models\ProformaRequestSupplier;
use App\Services\TelegramService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendProformaRequestToSupplier implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $requestSupplierId,
        public string $message,
    ) {}

    public function handle(TelegramService $telegram): void
    {
        $rs = ProformaRequestSupplier::with('supplier')->find($this->requestSupplierId);

        if (! $rs || ! $rs->supplier) {
            return;
        }

        $telegram->sendNotification(
            $rs->supplier->telegram_chat_id,
            $this->message,
            $rs->supplier->legal_name,
            (string) $rs->supplier->id,
        );

        $rs->update([
            'status' => 'notified',
            'notified_at' => now(),
        ]);
    }
}
