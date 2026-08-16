<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Customer::with('creator');

        // Filtering by search term (full_name, commercial_name, phone, area)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('commercial_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('customer_area', 'like', "%{$search}%");
            });
        }

        // Filtering by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filtering by classification
        if ($request->filled('classification')) {
            $query->where('classification', $request->input('classification'));
        }

        // Get per page items limit
        $perPage = intval($request->input('per_page', 10));
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        // Paginate results, sorting by newest first
        $customers = $query->orderBy('created_at', 'desc')
                           ->paginate($perPage)
                           ->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'status', 'classification', 'per_page']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'commercial_name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'location_address' => 'nullable|string|max:255',
            'is_main_street' => 'nullable|boolean',
            'is_side_street' => 'nullable|boolean',
            'inside_residential_complex' => 'nullable|boolean',
            'inside_residential_area' => 'nullable|boolean',
            'nearest_landmark' => 'nullable|string|max:255',
            'customer_area' => 'nullable|string|max:255',
            'estimated_area' => 'nullable|string|in:10_30,30_80,80_plus',
            'trust_items' => 'nullable|array',
            'trust_code' => 'nullable|string|max:255',
            'sign_type' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'refrigerator_photo' => 'nullable|image|max:4096', // Max 4MB
            'status' => 'required|string|in:active,inactive',
            'classification' => 'required|string|in:A,B,C',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['is_main_street'] = $request->boolean('is_main_street');
        $validated['is_side_street'] = $request->boolean('is_side_street');
        $validated['inside_residential_complex'] = $request->boolean('inside_residential_complex');
        $validated['inside_residential_area'] = $request->boolean('inside_residential_area');

        if ($request->hasFile('refrigerator_photo')) {
            $path = $request->file('refrigerator_photo')->store('refrigerators', 'public');
            $validated['refrigerator_photo'] = '/storage/' . $path;
        }

        Customer::create($validated);

        return redirect()->route('customers.index')->with('success', 'تم إضافة العميل بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer): Response
    {
        $customer->load('creator');
        
        return Inertia::render('Customers/Show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'commercial_name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'location_address' => 'nullable|string|max:255',
            'is_main_street' => 'nullable|boolean',
            'is_side_street' => 'nullable|boolean',
            'inside_residential_complex' => 'nullable|boolean',
            'inside_residential_area' => 'nullable|boolean',
            'nearest_landmark' => 'nullable|string|max:255',
            'customer_area' => 'nullable|string|max:255',
            'estimated_area' => 'nullable|string|in:10_30,30_80,80_plus',
            'trust_items' => 'nullable|array',
            'trust_code' => 'nullable|string|max:255',
            'sign_type' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'refrigerator_photo' => 'nullable|image|max:4096', // Max 4MB
            'status' => 'required|string|in:active,inactive',
            'classification' => 'required|string|in:A,B,C',
        ]);

        $validated['is_main_street'] = $request->boolean('is_main_street');
        $validated['is_side_street'] = $request->boolean('is_side_street');
        $validated['inside_residential_complex'] = $request->boolean('inside_residential_complex');
        $validated['inside_residential_area'] = $request->boolean('inside_residential_area');

        if ($request->hasFile('refrigerator_photo')) {
            // Delete old photo if exists
            if ($customer->refrigerator_photo) {
                $oldPath = str_replace('/storage/', '', $customer->refrigerator_photo);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('refrigerator_photo')->store('refrigerators', 'public');
            $validated['refrigerator_photo'] = '/storage/' . $path;
        }

        $customer->update($validated);

        return redirect()->route('customers.index')->with('success', 'تم تحديث بيانات العميل بنجاح');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        if ($customer->refrigerator_photo) {
            $oldPath = str_replace('/storage/', '', $customer->refrigerator_photo);
            Storage::disk('public')->delete($oldPath);
        }

        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'تم حذف العميل بنجاح');
    }
}
