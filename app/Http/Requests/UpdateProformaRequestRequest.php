<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProformaRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:draft,sent,closed,cancelled,partial,completed'],
        ];
    }
}
