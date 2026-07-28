<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreManualProformaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requestId' => ['required', 'integer', 'exists:proforma_requests,id'],
            'supplierId' => ['required', 'integer', 'exists:suppliers,id'],
            'message' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx'],
            'items' => ['nullable', 'array'],
            'items.*.itemName' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unitPrice' => ['required_with:items', 'numeric', 'min:0'],
        ];
    }
}
