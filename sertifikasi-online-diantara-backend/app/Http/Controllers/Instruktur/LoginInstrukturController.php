<?php

namespace App\Http\Controllers\Instruktur;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Instruktur;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginInstrukturController extends Controller
{
    public function logininstruktur(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|string|min:6'
            ]);

            $instruktur = Instruktur::where('email', $request->email)->with(['merchant'])->first();
            
            if (!$instruktur) {
                return response()->json([
                    'message' => 'Email not found'
                ], 401);
            }

            if (!Hash::check($request->password, $instruktur->password)) {
                return response()->json([
                    'message' => 'Password does not match'
                ], 401);
            }

            $token = $instruktur->createToken('auth_token')->plainTextToken;
            
            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'instruktur' => $instruktur
            ], 200);
            
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred during login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Check if user is authenticated
            if (!$request->user()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Delete the current access token
            $request->user()->tokens()->delete();

            return response()->json([
                'message' => 'Logout berhasil'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout gagal',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
