<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class LoginUserController extends Controller
{
    //
    public function login(Request $request)
    {
        try {
            $validate = $request->validate([
                "no_hp" => "required|string|max:15",
                "password" => "required|string|min:8"
            ]);

            $user = User::where('no_hp', $validate['no_hp'])->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Nomor Hp not found'
                ], 401);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'Password does not match'
                ], 401);
            }

            if(!in_array($user->role_id, [3, 4, 5])) {
                return response()->json([
                    'message' => 'Akses tidak diizinkan'
                ], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => $user,
                'is_default_password' => Hash::check('password', $user->password),
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json($e->errors(), 422);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Check if user is authenticated
            if (!$request->user()) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Revoke the token that was used to authenticate the current request
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logout successful'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred during logout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        // 1) Validasi input (token WAJIB)
        $request->validate([
            'token'    => 'required|string',
            'no_hp'    => 'required|string',
            'password' => 'required|string|min:8|confirmed|different:password_default', // optional rule
        ]);

        // 2) Normalisasi HP
        $normalizedPhone = $this->normalizePhone($request->input('no_hp'));

        // 3) Cari user
        $user = User::where('no_hp', $normalizedPhone)->first();
        if (!$user) {
            throw ValidationException::withMessages([
                'no_hp' => ['Nomor HP tidak ditemukan.'],
            ]);
        }

        // 4) Broker default Laravel pakai EMAIL
        if (!$user->email) {
            throw ValidationException::withMessages([
                'no_hp' => ['Akun belum memiliki email. Hubungi admin.'],
            ]);
        }

        // 5) Verifikasi token & set password baru
        $status = Password::reset(
            [
                'email'                 => $user->email,
                'token'                 => $request->token,                         // ← WAJIB
                'password'              => $request->password,
                'password_confirmation' => $request->password_confirmation,
            ],
            function ($user) use ($request) {
                $user->forceFill([
                    'password'       => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Invalidate semua token login lama (Sanctum)
                if (method_exists($user, 'tokens')) {
                    $user->tokens()->delete();
                }
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'status'  => 'ok',
                'message' => 'Password berhasil direset. Silakan login.',
            ]);
        }

        // kalau gagal (token invalid/expired)
        throw ValidationException::withMessages([
            'token' => [trans($status)],
        ]);
    }

    /**
     * Contoh normalisasi nomor HP sederhana:
     * - Hanya ambil digit
     * - Ubah prefix 62/0 sesuai standar yang kamu simpan di DB
     */
    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone ?? '');

        // contoh standar: simpan dengan prefix "0"
        if (str_starts_with($digits, '62')) {
            $digits = '0' . substr($digits, 2);
        } elseif (!str_starts_with($digits, '0') && strlen($digits) > 0) {
            // fallback: kalau tidak 62 dan tidak 0, paksa 0 depan
            $digits = '0' . $digits;
        }

        return $digits;
    }

}
