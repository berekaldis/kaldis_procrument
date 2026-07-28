<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Accepts camelCase field names to match the React frontend convention
 * (legalName, tradeName, etc.). The controller is responsible for
 * converting them to snake_case before persisting.
 */
class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'legalName' => ['required', 'string', 'max:255'],
            'tradeName' => ['nullable', 'string', 'max:255'],
            'tradeLicenseNo' => ['nullable', 'string', 'max:255'],
            'tin' => ['nullable', 'string', 'max:255'],
            'vatNo' => ['nullable', 'string', 'max:255'],
            'categoryTags' => ['nullable', 'string', 'max:255'],
            'contactName' => ['nullable', 'string', 'max:255'],
            'contactPhone' => ['nullable', 'string', 'max:64'],
            'contactEmail' => ['nullable', 'email', 'max:255'],
            'telegramChatId' => ['nullable', 'string', 'max:64'],
            'telegramUsername' => ['nullable', 'string', 'max:64'],
            'paymentTerms' => ['nullable', 'string', 'max:255'],
            'bankDetails' => ['nullable', 'string'],
            'verificationStatus' => ['nullable', 'in:unverified,documents_received,verified'],
            'notes' => ['nullable', 'string'],
            'active' => ['boolean'],
        ];
    }
}
