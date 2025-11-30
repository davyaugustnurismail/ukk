<?php

namespace App\Http\Controllers;

use App\Models\InstrukturNotification;
use Illuminate\Http\Request;

class InstrukturNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Instruktur users authenticate via sanctum and have a guard that returns an Instruktur model
        // The $user here should represent an instruktur when calling instruktur endpoints.
        $notifications = InstrukturNotification::where('instruktur_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $notifications]);
    }

    public function markRead(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notification = InstrukturNotification::where('instruktur_id', $user->id)->where('id', $id)->first();
        if (!$notification) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json(['message' => 'Marked as read']);
    }
}
