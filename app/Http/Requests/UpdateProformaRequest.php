<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProformaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'in:received,reviewed,accepted,rejected'],
            'notes' => ['nullable', 'string'],
            'items' => ['sometimes', 'array'],
            'items.*.itemName' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unitPrice' => ['required_with:items', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'max:8'],
        ];
    }
}
