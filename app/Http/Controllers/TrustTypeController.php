<?php

namespace App\Http\Controllers;

use App\Models\TrustType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrustTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $trustTypes = TrustType::orderBy('created_at', 'desc')->get();

        return Inertia::render('TrustTypes/Index', [
            'trustTypes' => $trustTypes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:trust_types,name',
        ], [
            'name.required' => 'حقل الاسم مطلوب.',
            'name.unique' => 'هذه الأمانة مسجلة بالفعل.',
        ]);

        TrustType::create($validated);

        return redirect()->back()->with('success', 'تم إضافة نوع الأمانة بنجاح.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TrustType $trustType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:trust_types,name,' . $trustType->id,
        ], [
            'name.required' => 'حقل الاسم مطلوب.',
            'name.unique' => 'هذه الأمانة مسجلة بالفعل.',
        ]);

        $trustType->update($validated);

        return redirect()->back()->with('success', 'تم تعديل نوع الأمانة بنجاح.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TrustType $trustType)
    {
        $trustType->delete();

        return redirect()->back()->with('success', 'تم حذف نوع الأمانة بنجاح.');
    }
}
