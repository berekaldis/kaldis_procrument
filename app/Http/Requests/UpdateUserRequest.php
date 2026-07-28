<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'role' => ['sometimes', 'in:admin,purchaser,finance,requester'],
            'active' => ['sometimes', 'boolean'],
            'password' => ['nullable', 'string', 'min:6'],
        ];
    }
}
