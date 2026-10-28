<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * User Login
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginInput = trim($request->input('login'));
        $password = $request->input('password');

        // Allow login by email or name/username
        $user = User::where('email', $loginInput)
            ->orWhere('name', $loginInput)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid email/username or password.'],
            ]);
        }

        if (isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is deactivated. Please contact the administrator.',
            ], 403);
        }

        // Clean up old tokens for this user
        $user->tokens()->delete();

        // Create new Sanctum bearer token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'admin',
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * User Logout
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Current Logged In User
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'admin',
            ],
        ]);
    }

    /**
     * Change Password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in again.',
            ], 401);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully!',
        ]);
    }

    /**
     * Update Profile (Name & Email)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile details updated successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'admin',
            ],
        ]);
    }

    /**
     * Get All Users (Admin only)
     */
    public function getUsers(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Admin can manage users.',
            ], 403);
        }

        $users = User::select('id', 'name', 'email', 'role', 'is_active', 'created_at')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Update User by Admin (e.g. Reset Cashier password)
     */
    public function updateUserByAdmin(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Admin can update other users.',
            ], 403);
        }

        $targetUser = User::findOrFail($id);

        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $targetUser->id,
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string|in:admin,cashier',
        ]);

        if ($request->filled('name')) {
            $targetUser->name = $request->name;
        }
        if ($request->filled('email')) {
            $targetUser->email = $request->email;
        }
        if ($request->filled('password')) {
            $targetUser->password = Hash::make($request->password);
        }
        if ($request->filled('role')) {
            $targetUser->role = $request->role;
        }

        $targetUser->save();

        return response()->json([
            'success' => true,
            'message' => "User {$targetUser->name} updated successfully.",
            'data' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role' => $targetUser->role,
            ],
        ]);
    }
}
