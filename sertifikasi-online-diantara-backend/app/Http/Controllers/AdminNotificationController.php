<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notifications = AdminNotification::where('admin_id', $user->id)
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

        $notification = AdminNotification::where('admin_id', $user->id)->where('id', $id)->first();
        if (!$notification) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json(['message' => 'Marked as read']);
    }
}
