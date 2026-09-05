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
            'paymentType' => ['nullable', 'string', 'in:cash,credit'],
            'creditPeriod' => ['nullable', 'integer', 'in:30,60,90'],
            'status' => ['sometimes', 'in:draft,sent,closed,cancelled,partial,completed'],
        ];
    }
}
