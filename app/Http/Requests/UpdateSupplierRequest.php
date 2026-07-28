<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends StoreSupplierRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['legalName'] = ['sometimes', 'string', 'max:255'];

        return $rules;
    }
}
