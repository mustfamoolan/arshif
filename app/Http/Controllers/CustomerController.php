<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\TrustType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    // قائمة أقضية البصرة الـ 14 المعتمدة
    protected $districts = [
        'قضاء مركز البصرة',
        'قضاء الزبير',
        'قضاء أبي الخصيب',
        'قضاء شط العرب',
        'قضاء القرنة',
        'قضاء الهارثة',
        'قضاء الفاو',
        'قضاء المدينة',
        'قضاء الدير',
        'قضاء الصادق',
        'قضاء سفوان',
        'قضاء أم قصر',
        'قضاء عز الدين سليم',
        'قضاء النشوة'
    ];

    /**
     * Export customers to Excel (CSV with UTF-8 BOM).
     */
    public function exportExcel(Request $request)
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

        // Filtering by district
        if ($request->filled('district')) {
            $query->where('district', $request->input('district'));
        }

        $customers = $query->orderBy('created_at', 'desc')->get();
        $trustTypes = TrustType::orderBy('name')->get();

        // Generate HTML Excel response
        $filename = "customers_" . date('Y-m-d_H-i') . ".xls";
        
        $headers = [
            "Content-type" => "application/vnd.ms-excel; charset=UTF-8",
            "Content-Disposition" => "attachment; filename={$filename}",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use($customers, $trustTypes) {
            $output = fopen('php://output', 'w');
            
            // Start HTML Excel file template with Right-to-Left sheet setup
            $html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-type" content="text/html;charset=utf-8" />
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>العملاء</x:Name>
    <x:WorksheetOptions>
     <x:DisplayRightToLeft/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
    table { border-collapse: collapse; }
    th { background-color: #0ea5e9; color: white; font-weight: bold; border: 1px solid #cbd5e1; text-align: center; padding: 8px 12px; font-family: Tahoma, Arial, sans-serif; font-size: 11pt; }
    td { border: 1px solid #cbd5e1; text-align: right; vertical-align: middle; padding: 6px 12px; font-family: Tahoma, Arial, sans-serif; font-size: 10pt; white-space: nowrap; }
    .text { mso-number-format:"\@"; }
    .center { text-align: center; }
</style>
</head>
<body dir="rtl">
<table>
    <thead>
        <tr>
            <th>الاسم التجاري</th>
            <th>الاسم الثلاثي</th>
            <th>رقم الهاتف</th>
            <th>القضاء</th>
            <th>المنطقة</th>
            <th>أقرب نقطة دالة</th>
            <th>العنوان بالتفصيل</th>
            <th>المساحة التقديرية</th>
            <th>نوع اللافتة</th>
            <th>التصنيف</th>
            <th>الحالة</th>';

            foreach ($trustTypes as $type) {
                $html .= '<th>أمانة: ' . htmlspecialchars($type->name) . '</th>';
            }

            $html .= '<th>إحداثيات الموقع</th>
            <th>الموظف المسجل</th>
            <th>تاريخ التسجيل</th>
        </tr>
    </thead>
    <tbody>';

            fwrite($output, $html);

            foreach ($customers as $c) {
                // Formatting estimated area
                $estArea = '';
                if ($c->estimated_area === '10_30') $estArea = 'من 10 إلى 30 متر';
                elseif ($c->estimated_area === '30_80') $estArea = 'من 30 إلى 80 متر';
                elseif ($c->estimated_area === '80_plus') $estArea = 'من 80 متر فأكثر';

                // Formatting status
                $statusText = $c->status === 'active' ? 'متعامل' : 'غير متعامل';

                // Map customer trust items
                $trustItemsMap = [];
                if ($c->trust_items) {
                    foreach ($c->trust_items as $item) {
                        $name = is_array($item) ? ($item['name'] ?? '') : ($item->name ?? '');
                        $code = is_array($item) ? ($item['code'] ?? '') : ($item->code ?? '');
                        $trustItemsMap[$name] = $code;
                    }
                }

                $rowHtml = '<tr>
                    <td>' . htmlspecialchars($c->commercial_name) . '</td>
                    <td>' . htmlspecialchars($c->full_name) . '</td>
                    <td class="text center">' . htmlspecialchars($c->phone ?? '') . '</td>
                    <td class="center">' . htmlspecialchars($c->district ?? '') . '</td>
                    <td>' . htmlspecialchars($c->customer_area ?? '') . '</td>
                    <td>' . htmlspecialchars($c->nearest_landmark ?? '') . '</td>
                    <td>' . htmlspecialchars($c->location_address ?? '') . '</td>
                    <td class="center">' . htmlspecialchars($estArea) . '</td>
                    <td class="center">' . htmlspecialchars($c->sign_type ?? '') . '</td>
                    <td class="center">Class ' . htmlspecialchars($c->classification) . '</td>
                    <td class="center">' . htmlspecialchars($statusText) . '</td>';

                foreach ($trustTypes as $type) {
                    if (isset($trustItemsMap[$type->name])) {
                        $codeVal = $trustItemsMap[$type->name];
                        $rowHtml .= '<td class="text center">' . htmlspecialchars($codeVal ?: '-') . '</td>';
                    } else {
                        $rowHtml .= '<td class="center">-</td>';
                    }
                }

                $coords = ($c->latitude && $c->longitude) ? "{$c->latitude}, {$c->longitude}" : '';
                $rowHtml .= '<td class="center">' . htmlspecialchars($coords) . '</td>
                    <td>' . htmlspecialchars($c->creator ? $c->creator->name : 'مجهول') . '</td>
                    <td class="center">' . htmlspecialchars($c->created_at->format('Y-m-d H:i')) . '</td>
                </tr>';

                fwrite($output, $rowHtml);
            }

            $footer = '</tbody>
</table>
</body>
</html>';
            fwrite($output, $footer);
            fclose($output);
        };

        return response()->stream($callback, 200, $headers);
    }

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

        // Filtering by district (القضاء)
        if ($request->filled('district')) {
            $query->where('district', $request->input('district'));
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
            'filters' => $request->only(['search', 'status', 'classification', 'district', 'per_page']),
            'trust_types' => TrustType::orderBy('name')->get(),
            'districtsList' => $this->districts,
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
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'location_address' => 'required|string|max:500',
            'is_main_street' => 'boolean',
            'is_side_street' => 'boolean',
            'inside_residential_complex' => 'boolean',
            'inside_residential_area' => 'boolean',
            'nearest_landmark' => 'required|string|max:255',
            'customer_area' => 'required|string|max:255',
            'district' => 'required|string|in:' . implode(',', $this->districts),
            'estimated_area' => 'required|string|in:10_30,30_80,80_plus',
            'trust_items' => 'required|array|min:1',
            'trust_items.*.name' => 'required|string|max:255',
            'trust_items.*.code' => 'required|string|max:255',
            'sign_type' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'refrigerator_photo' => 'required|array|min:1', // Required array of photos
            'refrigerator_photo.*' => 'image|max:4096',     // Max 4MB per photo
            'status' => 'required|string|in:active,inactive',
            'classification' => 'required|string|in:A,B,C',
        ], [
            'full_name.required' => 'حقل الاسم الثلاثي مطلوب.',
            'commercial_name.required' => 'حقل الاسم التجاري مطلوب.',
            'latitude.required' => 'إحداثي خط العرض مطلوب.',
            'longitude.required' => 'إحداثي خط الطول مطلوب.',
            'location_address.required' => 'حقل العنوان التفصيلي مطلوب.',
            'nearest_landmark.required' => 'حقل أقرب نقطة دالة مطلوب.',
            'customer_area.required' => 'حقل المنطقة مطلوب.',
            'district.required' => 'حقل القضاء مطلوب وهو إجباري.',
            'district.in' => 'القضاء المحدد غير صالح.',
            'estimated_area.required' => 'حقل المساحة التقديرية مطلوب.',
            'trust_items.required' => 'يجب اختيار أمانة واحدة على الأقل وتحديد كود لها.',
            'trust_items.min' => 'يجب اختيار أمانة واحدة على الأقل وتحديد كود لها.',
            'trust_items.*.code.required' => 'حقل كود الأمانة مطلوب لكل أمانة محددة.',
            'sign_type.required' => 'حقل نوع اللافتة مطلوب.',
            'phone.required' => 'حقل رقم هاتف العميل مطلوب.',
            'refrigerator_photo.required' => 'يجب رفع صورة واحدة على الأقل لبراد العميل لتسجيله.',
            'refrigerator_photo.array' => 'صورة البراد يجب أن تكون مصفوفة.',
            'refrigerator_photo.*.image' => 'كل ملف مرفوع يجب أن يكون صورة.',
            'refrigerator_photo.*.max' => 'حجم كل صورة يجب ألا يتجاوز 4 ميجابايت.',
        ]);

        // التحقق من تحديد خيار واحد على الأقل لخصائص موقع المحل
        if (!$request->boolean('is_main_street') && 
            !$request->boolean('is_side_street') && 
            !$request->boolean('inside_residential_complex') && 
            !$request->boolean('inside_residential_area')) {
            return redirect()->back()->withErrors([
                'street_types' => 'يجب اختيار خيار واحد على الأقل من خصائص موقع المحل.'
            ])->withInput();
        }

        $validated['created_by'] = auth()->id();
        $validated['is_main_street'] = $request->boolean('is_main_street');
        $validated['is_side_street'] = $request->boolean('is_side_street');
        $validated['inside_residential_complex'] = $request->boolean('inside_residential_complex');
        $validated['inside_residential_area'] = $request->boolean('inside_residential_area');

        if ($request->hasFile('refrigerator_photo')) {
            $photos = [];
            foreach ($request->file('refrigerator_photo') as $file) {
                $path = $file->store('refrigerators', 'public');
                $photos[] = '/storage/' . $path;
            }
            $validated['refrigerator_photo'] = $photos;
        }

        Customer::create($validated);

        return redirect()->route('customers.index')->with('success', 'تم إضافة العميل بنجاح.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer): Response
    {
        $customer->load('creator');
        
        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'trust_types' => TrustType::orderBy('name')->get(),
            'districtsList' => $this->districts,
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
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'location_address' => 'required|string|max:500',
            'is_main_street' => 'boolean',
            'is_side_street' => 'boolean',
            'inside_residential_complex' => 'boolean',
            'inside_residential_area' => 'boolean',
            'nearest_landmark' => 'required|string|max:255',
            'customer_area' => 'required|string|max:255',
            'district' => 'required|string|in:' . implode(',', $this->districts),
            'estimated_area' => 'required|string|in:10_30,30_80,80_plus',
            'trust_items' => 'required|array|min:1',
            'trust_items.*.name' => 'required|string|max:255',
            'trust_items.*.code' => 'required|string|max:255',
            'sign_type' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'refrigerator_photo' => 'nullable|array', // Nullable array on update
            'refrigerator_photo.*' => 'image|max:4096',
            'status' => 'required|string|in:active,inactive',
            'classification' => 'required|string|in:A,B,C',
        ], [
            'full_name.required' => 'حقل الاسم الثلاثي مطلوب.',
            'commercial_name.required' => 'حقل الاسم التجاري مطلوب.',
            'latitude.required' => 'إحداثي خط العرض مطلوب.',
            'longitude.required' => 'إحداثي خط الطول مطلوب.',
            'location_address.required' => 'حقل العنوان التفصيلي مطلوب.',
            'nearest_landmark.required' => 'حقل أقرب نقطة دالة مطلوب.',
            'customer_area.required' => 'حقل المنطقة مطلوب.',
            'district.required' => 'حقل القضاء مطلوب وهو إجباري.',
            'district.in' => 'القضاء المحدد غير صالح.',
            'estimated_area.required' => 'حقل المساحة التقديرية مطلوب.',
            'trust_items.required' => 'يجب اختيار أمانة واحدة على الأقل وتحديد كود لها.',
            'trust_items.min' => 'يجب اختيار أمانة واحدة على الأقل وتحديد كود لها.',
            'trust_items.*.code.required' => 'حقل كود الأمانة مطلوب لكل أمانة محددة.',
            'sign_type.required' => 'حقل نوع اللافتة مطلوب.',
            'phone.required' => 'حقل رقم هاتف العميل مطلوب.',
            'refrigerator_photo.array' => 'صورة البراد يجب أن تكون مصفوفة.',
            'refrigerator_photo.*.image' => 'كل ملف مرفوع يجب أن يكون صورة.',
            'refrigerator_photo.*.max' => 'حجم كل صورة يجب ألا يتجاوز 4 ميجابايت.',
        ]);

        // التحقق من تحديد خيار واحد على الأقل لخصائص موقع المحل
        if (!$request->boolean('is_main_street') && 
            !$request->boolean('is_side_street') && 
            !$request->boolean('inside_residential_complex') && 
            !$request->boolean('inside_residential_area')) {
            return redirect()->back()->withErrors([
                'street_types' => 'يجب اختيار خيار واحد على الأقل من خصائص موقع المحل.'
            ])->withInput();
        }

        $validated['is_main_street'] = $request->boolean('is_main_street');
        $validated['is_side_street'] = $request->boolean('is_side_street');
        $validated['inside_residential_complex'] = $request->boolean('inside_residential_complex');
        $validated['inside_residential_area'] = $request->boolean('inside_residential_area');

        if ($request->hasFile('refrigerator_photo')) {
            // Delete old photos if exist
            if (!empty($customer->refrigerator_photo)) {
                foreach ($customer->refrigerator_photo as $photo) {
                    $oldPath = str_replace('/storage/', '', $photo);
                    Storage::disk('public')->delete($oldPath);
                }
            }
            $photos = [];
            foreach ($request->file('refrigerator_photo') as $file) {
                $path = $file->store('refrigerators', 'public');
                $photos[] = '/storage/' . $path;
            }
            $validated['refrigerator_photo'] = $photos;
        }

        $customer->update($validated);

        return redirect()->route('customers.index')->with('success', 'تم تحديث بيانات العميل بنجاح.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        if (!empty($customer->refrigerator_photo)) {
            foreach ($customer->refrigerator_photo as $photo) {
                $oldPath = str_replace('/storage/', '', $photo);
                Storage::disk('public')->delete($oldPath);
            }
        }

        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'تم حذف العميل بنجاح.');
    }
}
