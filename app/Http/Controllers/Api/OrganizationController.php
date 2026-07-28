<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function show(Request $request): JsonResponse
    {
        $org = Organization::findOrFail($request->user()->organization_id);

        return response()->json($this->serialize($org));
    }

    public function update(Request $request): JsonResponse
    {
        $org = Organization::findOrFail($request->user()->organization_id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'tin' => ['sometimes', 'nullable', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'approvalThreshold' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $org->update([
            'name' => $data['name'] ?? $org->name,
            'tin' => $data['tin'] ?? $org->tin,
            'address' => $data['address'] ?? $org->address,
            'currency' => $data['currency'] ?? $org->currency,
            'approval_threshold' => $data['approvalThreshold'] ?? $org->approval_threshold,
        ]);

        $this->audit->log($request->user()->name, 'organization', (string) $org->id, 'update', 'Updated organization profile.');

        return response()->json($this->serialize($org->fresh()));
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $org = Organization::findOrFail($request->user()->organization_id);

        $request->validate([
            'logo' => ['required', 'file', 'max:2048', 'mimes:jpg,jpeg,png,webp,svg'],
        ]);

        $file = $request->file('logo');
        $stored = 'org-'.$org->id.'-'.Str::random(8).'.'.$file->getClientOriginalExtension();
        $file->move(public_path('org-logos'), $stored);

        $org->update(['logo_path' => 'org-logos/'.$stored]);

        $this->audit->log($request->user()->name, 'organization', (string) $org->id, 'logo_update', 'Updated organization logo.');

        return response()->json($this->serialize($org->fresh()));
    }

    private function serialize(Organization $org): array
    {
        return [
            'id' => $org->id,
            'name' => $org->name,
            'tin' => $org->tin,
            'address' => $org->address,
            'logoPath' => $org->logo_path,
            'currency' => $org->currency,
            'approvalThreshold' => $org->approval_threshold !== null ? (float) $org->approval_threshold : null,
        ];
    }
}
