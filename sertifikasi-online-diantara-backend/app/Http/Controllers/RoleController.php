<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:roles,name',
        ]);

        $role = \App\Models\Role::create([
            'name' => $request->name,
        ]);

        return response([
            'message' => 'Role created successfully.',
            'data' => $role
        ], 201);
    }
}
