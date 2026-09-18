<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'unique:users,email,'.$this->route('user')->id,
            ],
            'address' => ['sometimes', 'nullable', 'string'],
            'photo' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpeg,png,webp',
                'max:2048',
            ],
            'remove_photo' => ['sometimes', 'boolean'],
            'password' => ['prohibited'],
            'role' => ['prohibited'],
        ];
    }

    /**
     * Ensure the request does not ask for replacement and removal together.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->hasFile('photo') && $this->boolean('remove_photo')) {
                $validator->errors()->add(
                    'photo',
                    'Choose either a replacement photo or photo removal.',
                );
            }
        });
    }
}
