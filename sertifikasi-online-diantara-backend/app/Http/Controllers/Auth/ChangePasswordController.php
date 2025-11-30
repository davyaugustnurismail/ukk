<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ChangePasswordController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'password' => 'required|string|min:8|confirmed',
            'current_password' => 'nullable|string',
        ]);

        $usingDefault = Hash::check('password', $user->password);

        if (!$usingDefault) {
            if (!$request->filled('current_password') ||
                !Hash::check($request->input('current_password'), $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Password saat ini salah.'],
                ]);
            }
        }

        if ($request->password === 'password') {
            throw ValidationException::withMessages([
                'password' => ['Password baru tidak boleh "password".'],
            ]);
        }

        $user->forceFill([
            'password'       => Hash::make($request->password),
            'remember_token' => Str::random(60),
        ])->save();

        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete(); // Sanctum: logout semua sesi
        }

        return response()->json(['status' => 'ok', 'message' => 'Password berhasil diperbarui.']);
    }
}
