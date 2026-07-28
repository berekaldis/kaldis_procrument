<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProformaRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.itemName' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
            'items.*.unit' => ['nullable', 'string', 'max:32'],
            'supplierIds' => ['required', 'array', 'min:1'],
            'supplierIds.*' => ['integer', 'exists:suppliers,id'],
        ];
    }
}
