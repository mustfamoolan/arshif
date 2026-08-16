<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the users (Admin only).
     */
    public function index(): Response
    {
        $users = User::orderBy('created_at', 'desc')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'role' => ['required', 'string', Rule::in(['admin', 'employee'])],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
            'password' => ['required', 'string', 'min:6'],
        ], [
            'username.unique' => 'اسم المستخدم هذا مستعمل بالفعل.',
            'name.required' => 'يرجى إدخال اسم المستخدم الكامل.',
            'password.required' => 'يرجى إدخال كلمة المرور.',
            'password.min' => 'كلمة المرور يجب أن لا تقل عن 6 أحرف.',
        ]);

        User::create([
            'name' => $validated['name'],
            'username' => strtolower(trim($validated['username'])),
            'role' => $validated['role'],
            'status' => $validated['status'],
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', 'تم إنشاء المستخدم بنجاح.');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'role' => ['required', 'string', Rule::in(['admin', 'employee'])],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
            'password' => ['nullable', 'string', 'min:6'],
        ], [
            'username.unique' => 'اسم المستخدم هذا مستعمل بالفعل.',
        ]);

        $data = [
            'name' => $validated['name'],
            'username' => strtolower(trim($validated['username'])),
            'role' => $validated['role'],
            'status' => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->back()->with('success', 'تم تحديث بيانات المستخدم بنجاح.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deleting self
        if (auth()->id() === $user->id) {
            return redirect()->back()->with('error', 'لا يمكنك حذف حسابك الحالي.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'تم حذف المستخدم بنجاح.');
    }
}
