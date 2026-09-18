<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AuthController extends Controller
{
    /**
     * Register လုပ်ပြီး token ပြန်ပေး
     *
     * @param  Request  $request
     * @return void
     */
    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();
        $photoPath = null;

        try {
            return DB::transaction(function () use ($request, $validated, &$photoPath) {
                if ($request->hasFile('photo')) {
                    $photoPath = $request->file('photo')->store('profile-photos', 'public');

                    if (! is_string($photoPath) || $photoPath === '') {
                        throw new \RuntimeException('The profile photo could not be stored.');
                    }
                }

                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'address' => $validated['address'] ?? null,
                    'photo' => $photoPath,
                ]);
                $token = $user->createToken('api-token')->plainTextToken;

                return response()->json([
                    'message' => 'User registered successfully',
                    'user' => UserResource::make($user),
                    'token' => $token,
                ], 201);
            });
        } catch (Throwable $exception) {
            if ($photoPath !== null) {
                Storage::disk('public')->delete($photoPath);
            }

            throw $exception;
        }
    }

    /**
     * Login လုပ်ပြီး token ပြန်ပေး
     *
     * @return void
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email and password',
            ], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     *  auth:sanctum ကနေ လက်ရှိ login ဝင်ထားတဲ့ User ကို ပြန်ပေးတာပါ။
     *
     * @return void
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Login user ၇ဲ့ tokenကိုဖျက်ပြီးlogout လုပ်
     *
     * @return void
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Change the authenticated user's password and revoke all sessions.
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();

        if (! $user || ! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ], 422);
        }

        if (Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Choose a password different from your current password.',
                'errors' => [
                    'password' => [
                        'Choose a password different from your current password.',
                    ],
                ],
            ], 422);
        }

        try {
            DB::transaction(function () use ($user, $validated): void {
                $user->forceFill([
                    'password' => Hash::make($validated['password']),
                ])->save();

                $user->tokens()->delete();
            });
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Password change failed. Please try again.',
            ], 500);
        }

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}
