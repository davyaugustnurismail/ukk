<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Instruktur;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * This middleware robustly checks user roles across different models (Admin, Instruktur, User)
     * by inspecting the authenticated user's model type. It works for both web sessions and API tokens.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles The roles to check for.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Get the currently authenticated user. This works for any guard (web, api, sanctum).
        $authenticatedUser = Auth::user();

        // If no user is authenticated at all, deny access.
        if (!$authenticatedUser) {
            abort(403, 'AKSES DITOLAK. ANDA TIDAK TERAUTENTIKASI.');
        }

        // --- Role Check for Admin ---
        // Check if the authenticated user is an instance of the Admin model and 'admin' role is required.
        if ($authenticatedUser instanceof Admin && in_array('admin', $roles)) {
            return $next($request);
        }

        // --- Role Check for Instruktur ---
        // Check if the user is an instance of the Instruktur model and 'instruktur' role is required.
        if ($authenticatedUser instanceof Instruktur && in_array('instruktur', $roles)) {
            return $next($request);
        }

        // --- Role Check for Web User (Peserta) ---
        // Check if the user is an instance of the User model.
        if ($authenticatedUser instanceof User) {
            // Ensure the hasAnyRole method exists before calling it.
            if (method_exists($authenticatedUser, 'hasAnyRole') && $authenticatedUser->hasAnyRole($roles)) {
                return $next($request);
            }
        }

        // If none of the conditions above are met, the user does not have the required role.
        abort(403, 'ANDA TIDAK MEMILIKI AKSES UNTUK TINDAKAN INI.');
    }
}
