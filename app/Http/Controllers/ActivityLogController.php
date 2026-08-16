<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the activity logs.
     */
    public function index(Request $request): Response
    {
        // Enforce admin authorization check
        if (auth()->user()->role !== 'admin') {
            abort(403, 'غير مصرح لك بالوصول لهذه الصفحة.');
        }

        $query = ActivityLog::with('user')->orderBy('created_at', 'desc');

        // Apply Search Filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('subject_name', 'like', "%{$search}%");
            });
        }

        // Apply Action Filter
        if ($request->filled('action') && $request->input('action') !== 'all') {
            $query->where('action', $request->input('action'));
        }

        // Apply User Filter
        if ($request->filled('user_id') && $request->input('user_id') !== 'all') {
            $query->where('user_id', $request->input('user_id'));
        }

        // Pagination Limit (10, 25, 50, 100)
        $perPage = $request->integer('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        $logs = $query->paginate($perPage)->withQueryString();

        // Get list of all users to populate search filter
        $users = User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'filters' => $request->only(['search', 'action', 'user_id', 'per_page']),
        ]);
    }
}
