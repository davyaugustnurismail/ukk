<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserApiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if(!$user) {
            return response()->json([
                'message' => 'User not authenticated',
                'error' => 'Unauthorized'
            ], 401);
        }
        // Return full admin list and let frontend handle search/sort/pagination
        $query = Admin::with('role')
            ->where('merchant_id', $user->merchant_id);

        $items = $query->get();

        $perPage = max(5, (int)$request->input('perPage', 10));
        $total = $items->count();
        $totalPages = $perPage > 0 ? (int) ceil($total / $perPage) : 1;

        // Format response
        $result = $items->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'role_id' => $item->role_id,
                'role_name' => $item->role->name ?? null,
                'merchant_id' => $item->merchant_id,
            ];
        });

        return response()->json([
            'success' => true,
            'total' => $total,
            'total_pages' => $totalPages,
            'per_page' => $perPage,
            'message' => 'Admin list fetched successfully.',
            'data' => $result,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        try {
            // require merchant_id and validate email uniqueness scoped to that merchant
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('admins', 'email')->where(function ($q) use ($request) {
                        return $q->where('merchant_id', $request->merchant_id);
                    }),
                ],
                'password' => 'required|string|min:8',
                'merchant_id' => 'required|integer'
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Validation failed', 'error' => $e->getMessage()], 422);
        }

        $merchant = Merchant::find($request->merchant_id);
        if (!$merchant) {
            $merchant = Merchant::create([
                'id' => $request->merchant_id,
                'name' => 'Merchant ' . $request->merchant_id,
            ]);
        }
        

        $admin = Admin::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => '1',
            'merchant_id' => $merchant->id,
        ]);

        return response()->json([
            'message' => 'Admin created successfully',
            'admin' => $admin,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Admin $admin)
    {
        //
        return response()->json($admin);
    }
    
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Admin $admin)
    {
        //
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    ],
                'password' => 'nullable|string|min:8',
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Validation failed', 'error' => $e->getMessage()], 422);
        }
        // Ensure email is unique within the same merchant
        if (Admin::where('email', $request->email)->where('merchant_id', $admin->merchant_id)->where('id', '!=', $admin->id)->exists()) {
            return response()->json(['message' => 'Email already exists'], 422);
        }
        $admin->name = $request->name;
        $admin->email = $request->email;
        if ($request->has('password')) {
            $admin->password = Hash::make($request->password);
        }

        $admin->save();
        return response()->json([
            'message' => 'Admin updated successfully',
            'admin' => $admin,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Admin $admin)
    {
        //
        $admin->delete();
        return response()->json([
            'message' => 'Admin deleted successfully',
        ], 200);
    }
}
