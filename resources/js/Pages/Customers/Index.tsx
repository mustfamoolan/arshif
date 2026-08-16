import { useState, useEffect, useRef } from 'react';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    UserPlus,
    Search,
    MapPin,
    Phone,
    SlidersHorizontal,
    Edit3,
    Trash2,
    Eye,
    TrendingUp,
    CheckCircle2,
    XCircle,
    UploadCloud,
    Image as ImageIcon,
} from 'lucide-react';

interface Customer {
    id: number;
    full_name: string;
    commercial_name: string;
    latitude: number | null;
    longitude: number | null;
    location_address: string | null;
    is_main_street: boolean;
    is_side_street: boolean;
    inside_residential_complex: boolean;
    inside_residential_area: boolean;
    nearest_landmark: string | null;
    customer_area: string | null;
    estimated_area: string | null; // '10_30', '30_80', '80_plus'
    trust_items: string[] | null;
    trust_code: string | null;
    sign_type: string | null;
    phone: string | null;
    refrigerator_photo: string | null;
    status: 'active' | 'inactive';
    classification: 'A' | 'B' | 'C';
    created_at: string;
    creator?: { name: string };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        status?: string;
        classification?: string;
        per_page?: string;
    };
}

export default function Index({ customers, filters }: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    
    // Map Picker Modal States
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
    const [mapTargetForm, setMapTargetForm] = useState<'add' | 'edit'>('add');
    const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [classificationFilter, setClassificationFilter] = useState(filters.classification || 'all');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    // Real-time automatic polling: Auto-refresh list every 5 seconds silently
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['customers'],
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Reactive Instant Filters: automatically reloads the list when inputs change
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                route('customers.index'),
                {
                    search: searchTerm || undefined,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    classification: classificationFilter !== 'all' ? classificationFilter : undefined,
                    per_page: perPage !== '10' ? perPage : undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300); // 300ms debounce for search keystrokes

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter, classificationFilter, perPage]);

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setClassificationFilter('all');
        setPerPage('10');
    };

    // Initialize Map Picker with Leaflet library CDNs dynamically
    useEffect(() => {
        if (!isMapPickerOpen) return;

        const timer = setTimeout(() => {
            const L = (window as any).L;
            if (!L) return;

            const form = mapTargetForm === 'add' ? addForm : editForm;
            const initLat = parseFloat(form.data.latitude) || 33.3152;
            const initLng = parseFloat(form.data.longitude) || 44.3661;

            const mapContainer = document.getElementById('map-picker-canvas');
            if (!mapContainer) return;

            // Recreate DOM element to avoid leaflet container already initialized error
            const parent = mapContainer.parentNode;
            if (parent) {
                const newDiv = document.createElement('div');
                newDiv.id = 'map-picker-canvas';
                newDiv.className = 'w-full h-full rounded-lg border border-border';
                parent.replaceChild(newDiv, mapContainer);
            }

            const map = L.map('map-picker-canvas').setView([initLat, initLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            let marker = L.marker([initLat, initLng]).addTo(map);
            setTempCoords({ lat: initLat, lng: initLng });

            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng(e.latlng);
                setTempCoords({ lat, lng });
            });

            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }, 150);

        return () => clearTimeout(timer);
    }, [isMapPickerOpen, mapTargetForm]);

    // Forms Setup
    const addForm = useForm({
        full_name: '',
        commercial_name: '',
        latitude: '',
        longitude: '',
        location_address: '',
        is_main_street: false,
        is_side_street: false,
        inside_residential_complex: false,
        inside_residential_area: false,
        nearest_landmark: '',
        customer_area: '',
        estimated_area: '10_30',
        trust_items: [] as string[],
        trust_code: '',
        sign_type: '',
        phone: '',
        refrigerator_photo: null as File | null,
        status: 'active' as 'active' | 'inactive',
        classification: 'C' as 'A' | 'B' | 'C',
    });

    const editForm = useForm({
        full_name: '',
        commercial_name: '',
        latitude: '',
        longitude: '',
        location_address: '',
        is_main_street: false,
        is_side_street: false,
        inside_residential_complex: false,
        inside_residential_area: false,
        nearest_landmark: '',
        customer_area: '',
        estimated_area: '10_30',
        trust_items: [] as string[],
        trust_code: '',
        sign_type: '',
        phone: '',
        refrigerator_photo: null as File | null,
        status: 'active' as 'active' | 'inactive',
        classification: 'C' as 'A' | 'B' | 'C',
        _method: 'PUT', // For multipart file updates in Laravel
    });

    // Handle Geolocation
    const fetchCurrentLocation = (formType: 'add' | 'edit') => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toString();
                    const lng = position.coords.longitude.toString();
                    if (formType === 'add') {
                        addForm.setData((data) => ({ ...data, latitude: lat, longitude: lng }));
                    } else {
                        editForm.setData((data) => ({ ...data, latitude: lat, longitude: lng }));
                    }
                },
                (error) => {
                    alert('عذراً، فشل الحصول على الموقع الحالي.');
                }
            );
        } else {
            alert('المتصفح لا يدعم تحديد الموقع الجغرافي.');
        }
    };

    const trustOptions = [
        'براد رند',
        'براد ارسي',
        'براد فينو',
        'براد لايون',
        'مجمدة ابو جنه',
        'ستاند',
    ];

    const handleTrustItemsChange = (item: string, isChecked: boolean, formType: 'add' | 'edit') => {
        const form = formType === 'add' ? addForm : editForm;
        const currentItems = [...form.data.trust_items];
        if (isChecked) {
            currentItems.push(item);
        } else {
            const index = currentItems.indexOf(item);
            if (index > -1) currentItems.splice(index, 1);
        }
        form.setData({ ...form.data, trust_items: currentItems });
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route('customers.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
            },
        });
    };

    const handleEditOpen = (c: Customer) => {
        setEditingCustomer(c);
        editForm.setData({
            full_name: c.full_name,
            commercial_name: c.commercial_name,
            latitude: c.latitude?.toString() || '',
            longitude: c.longitude?.toString() || '',
            location_address: c.location_address || '',
            is_main_street: c.is_main_street,
            is_side_street: c.is_side_street,
            inside_residential_complex: c.inside_residential_complex,
            inside_residential_area: c.inside_residential_area,
            nearest_landmark: c.nearest_landmark || '',
            customer_area: c.customer_area || '',
            estimated_area: c.estimated_area || '10_30',
            trust_items: c.trust_items || [],
            trust_code: c.trust_code || '',
            sign_type: c.sign_type || '',
            phone: c.phone || '',
            refrigerator_photo: null,
            status: c.status,
            classification: c.classification,
            _method: 'PUT',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer) return;

        // Laravel requires POST with _method = PUT for multipart data uploads
        editForm.post(route('customers.update', editingCustomer.id), {
            onSuccess: () => {
                setEditingCustomer(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingCustomer) return;
        router.delete(route('customers.destroy', deletingCustomer.id), {
            onSuccess: () => setDeletingCustomer(null),
        });
    };

    return (
        <AuthenticatedLayout header="إدارة العملاء">
            <Head title="العملاء - الهادي للمكالمات التجارية" />

            <div className="space-y-6" dir="rtl">
                {/* Header Actions */}
                <div className="flex flex-row items-center justify-between gap-2">
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                            بيانات عملاء الهادي
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                            إدارة بيانات العملاء، الأمانات، تصنيف العملاء وتتبع إحداثيات المواقع التجارية
                        </p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 text-xs font-bold h-9">
                                <UserPlus className="h-4 w-4" />
                                إضافة عميل جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle className="text-base font-bold flex items-center gap-2 text-right">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                    تسجيل عميل جديد
                                </DialogTitle>
                                <DialogDescription className="text-xs text-right">
                                    قم بتعبئة حقول البيانات الكاملة لتسجيل العميل وحفظ الأمانات.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">اسم العميل الثلاثي</Label>
                                        <Input
                                            value={addForm.data.full_name}
                                            placeholder="أدخل الاسم الثلاثي للعميل"
                                            onChange={(e) => addForm.setData('full_name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Commercial Name */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">الاسم التجاري للعميل</Label>
                                        <Input
                                            value={addForm.data.commercial_name}
                                            placeholder="مثال: أسواق النور"
                                            onChange={(e) => addForm.setData('commercial_name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">رقم هاتف العميل</Label>
                                        <Input
                                            value={addForm.data.phone}
                                            placeholder="مثال: 07701234567"
                                            onChange={(e) => addForm.setData('phone', e.target.value)}
                                            dir="ltr"
                                        />
                                    </div>

                                    {/* Area */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">المنطقة</Label>
                                        <Input
                                            value={addForm.data.customer_area}
                                            placeholder="مثال: الكرادة"
                                            onChange={(e) => addForm.setData('customer_area', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />
                                <p className="text-xs font-bold text-muted-foreground text-right">العنوان وتحديد الموقع</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <Label className="text-xs font-semibold">أقرب نقطة دالة</Label>
                                        <Input
                                            value={addForm.data.nearest_landmark}
                                            placeholder="مثال: قرب صيدلية الهلال"
                                            onChange={(e) => addForm.setData('nearest_landmark', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 col-span-1 md:col-span-2 justify-start">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="main_street_add"
                                                checked={addForm.data.is_main_street}
                                                onCheckedChange={(checked) => addForm.setData('is_main_street', !!checked)}
                                            />
                                            <Label htmlFor="main_street_add" className="text-xs font-semibold cursor-pointer">شارع رئيسي</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="side_street_add"
                                                checked={addForm.data.is_side_street}
                                                onCheckedChange={(checked) => addForm.setData('is_side_street', !!checked)}
                                            />
                                            <Label htmlFor="side_street_add" className="text-xs font-semibold cursor-pointer">شارع فرعي</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="complex_add"
                                                checked={addForm.data.inside_residential_complex}
                                                onCheckedChange={(checked) => addForm.setData('inside_residential_complex', !!checked)}
                                            />
                                            <Label htmlFor="complex_add" className="text-xs font-semibold cursor-pointer">داخل مجمع سكني</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="area_add"
                                                checked={addForm.data.inside_residential_area}
                                                onCheckedChange={(checked) => addForm.setData('inside_residential_area', !!checked)}
                                            />
                                            <Label htmlFor="area_add" className="text-xs font-semibold cursor-pointer">داخل حي سكني</Label>
                                        </div>
                                    </div>

                                    {/* Location selection */}
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">إحداثيات الموقع التجاري (خط الطول والعرض)</Label>
                                            <div className="flex gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] gap-1 border-primary/20 text-primary"
                                                    onClick={() => {
                                                        setMapTargetForm('add');
                                                        setIsMapPickerOpen(true);
                                                    }}
                                                >
                                                    <MapPin className="size-3 text-primary animate-pulse" />
                                                    تحديد من الخريطة
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] gap-1"
                                                    onClick={() => fetchCurrentLocation('add')}
                                                >
                                                    <MapPin className="size-3 text-emerald-500" />
                                                    موقعي الحالي (GPS)
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                value={addForm.data.latitude}
                                                placeholder="خط العرض Latitude"
                                                onChange={(e) => addForm.setData('latitude', e.target.value)}
                                                dir="ltr"
                                            />
                                            <Input
                                                value={addForm.data.longitude}
                                                placeholder="خط الطول Longitude"
                                                onChange={(e) => addForm.setData('longitude', e.target.value)}
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <Label className="text-xs font-semibold">العنوان التفصيلي</Label>
                                        <Input
                                            value={addForm.data.location_address}
                                            placeholder="وصف العنوان كتابياً"
                                            onChange={(e) => addForm.setData('location_address', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />
                                <p className="text-xs font-bold text-muted-foreground text-right">أمانات ومساحة المحل</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    {/* Area space */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">المساحة التقديرية للمحل</Label>
                                        <Select
                                            value={addForm.data.estimated_area}
                                            onValueChange={(val) => addForm.setData('estimated_area', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10_30">من 10 متر إلى 30 متر</SelectItem>
                                                <SelectItem value="30_80">من 30 متر إلى 80 متر</SelectItem>
                                                <SelectItem value="80_plus">من 80 متر إلى ...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Code */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">كود الأمانة</Label>
                                        <Input
                                            value={addForm.data.trust_code}
                                            placeholder="أدخل كود الأمانة"
                                            onChange={(e) => addForm.setData('trust_code', e.target.value)}
                                        />
                                    </div>

                                    {/* Sign Type */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">نوع لافتة العميل</Label>
                                        <Input
                                            value={addForm.data.sign_type}
                                            placeholder="نوع اللافتة الإعلانية"
                                            onChange={(e) => addForm.setData('sign_type', e.target.value)}
                                        />
                                    </div>

                                    {/* Classification & Status */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">تصنيف العميل</Label>
                                            <Select
                                                value={addForm.data.classification}
                                                onValueChange={(val) => addForm.setData('classification', val as 'A' | 'B' | 'C')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A">Class A</SelectItem>
                                                    <SelectItem value="B">Class B</SelectItem>
                                                    <SelectItem value="C">Class C</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">حالة التعامل</Label>
                                            <Select
                                                value={addForm.data.status}
                                                onValueChange={(val) => addForm.setData('status', val as 'active' | 'inactive')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">متعامل</SelectItem>
                                                    <SelectItem value="inactive">غير متعامل</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Refrigerator items list */}
                                    <div className="space-y-1.5 col-span-1 md:col-span-2 text-right">
                                        <Label className="text-xs font-semibold block mb-1">أمانة لدى العميل (اختر ما ينطبق):</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
                                            {trustOptions.map((option) => (
                                                <div key={option} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`item_add_${option}`}
                                                        checked={addForm.data.trust_items.includes(option)}
                                                        onCheckedChange={(checked) => handleTrustItemsChange(option, !!checked, 'add')}
                                                    />
                                                    <Label htmlFor={`item_add_${option}`} className="text-xs cursor-pointer font-medium">{option}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* File upload */}
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <Label className="text-xs font-semibold block">صورة لبراد العميل</Label>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="photo-upload-add"
                                                onChange={(e) => addForm.setData('refrigerator_photo', e.target.files ? e.target.files[0] : null)}
                                            />
                                            <Label
                                                htmlFor="photo-upload-add"
                                                className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors w-full gap-2 text-center"
                                            >
                                                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-xs font-semibold text-foreground">
                                                    {addForm.data.refrigerator_photo ? addForm.data.refrigerator_photo.name : 'اضغط لرفع صورة البراد'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">صيغ الصور فقط (JPG, PNG) بحد أقصى 4 ميجابايت</span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddOpen(false)}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={addForm.processing}
                                        className="font-bold"
                                    >
                                        حفظ العميل
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters card */}
                <Card>
                    <CardContent className="pt-3 pb-3 px-3 md:pt-4 md:pb-4 md:px-6" dir="rtl">
                        <div className="grid grid-cols-2 md:flex md:flex-row items-end gap-2 md:gap-3">
                            {/* Search - full width on mobile */}
                            <div className="col-span-2 space-y-1 flex-1 w-full text-right">
                                <div className="relative">
                                    <Search className="absolute right-2.5 top-2 size-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="بحث عن عميل..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-8 h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-1 w-full md:w-44 text-right">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="حالة التعامل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل الحالات</SelectItem>
                                        <SelectItem value="active">متعامل</SelectItem>
                                        <SelectItem value="inactive">غير متعامل</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Classification Filter */}
                            <div className="space-y-1 w-full md:w-44 text-right">
                                <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل التصنيفات</SelectItem>
                                        <SelectItem value="A">Class A</SelectItem>
                                        <SelectItem value="B">Class B</SelectItem>
                                        <SelectItem value="C">Class C</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(searchTerm || statusFilter !== 'all' || classificationFilter !== 'all') && (
                                <div className="col-span-2 md:col-span-1 flex gap-2 w-full md:w-auto">
                                    <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto h-8 text-xs">
                                        ↺ إعادة ضبط
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Customers Grid */}
                <Card>
                    <CardHeader className="border-b border-border pb-4 text-right">
                        <CardTitle className="text-base font-bold">قائمة العملاء</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            إجمالي العملاء المسجلين: <strong className="text-foreground font-mono">{customers.total}</strong>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                        {customers.data.length === 0 ? (
                            <div className="text-center py-12 text-sm text-muted-foreground">
                                لا يوجد عملاء مسجلين حالياً يطابقون شروط البحث.
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block">
                                    <Table dir="rtl">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">الاسم التجاري</TableHead>
                                                <TableHead className="text-right">الاسم الثلاثي</TableHead>
                                                <TableHead className="text-right">الهاتف</TableHead>
                                                <TableHead className="text-right">المنطقة</TableHead>
                                                <TableHead className="text-right">التصنيف</TableHead>
                                                <TableHead className="text-right">حالة التعامل</TableHead>
                                                <TableHead className="text-right">الأمانات</TableHead>
                                                <TableHead className="text-center">الإجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customers.data.map((c) => (
                                                <TableRow key={c.id}>
                                                    <TableCell className="font-semibold text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-primary">
                                                                {c.commercial_name.substring(0, 1).toUpperCase()}
                                                            </div>
                                                            <span>{c.commercial_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{c.full_name}</TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        {c.phone ? (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="size-3 text-muted-foreground" />
                                                                {c.phone}
                                                            </span>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-xs">{c.customer_area || '-'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="default" className="text-[10px] font-bold">
                                                            Class {c.classification}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {c.status === 'active' ? (
                                                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[11px] gap-1">
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                متعامل
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="text-[11px] gap-1">
                                                                <XCircle className="h-3 w-3" />
                                                                غير متعامل
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                            {c.trust_items && c.trust_items.length > 0 ? (
                                                                c.trust_items.map((item, idx) => (
                                                                    <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0">{item}</Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground">لا يوجد</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Link href={route('customers.show', c.id)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                    title="عرض التفاصيل"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditOpen(c)}
                                                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
                                                                title="تعديل العميل"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeletingCustomer(c)}
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                title="حذف العميل"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile List View */}
                                <div className="block md:hidden divide-y divide-border">
                                    {customers.data.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                                            <div className="flex flex-col text-right">
                                                <span className="text-sm font-bold text-foreground">{c.full_name}</span>
                                                <span className="text-xs text-muted-foreground mt-0.5">{c.commercial_name}</span>
                                            </div>
                                            <Link href={route('customers.show', c.id)}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 text-primary hover:text-primary/80"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Pagination & Rows limit footer */}
                        {customers.total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 text-xs font-semibold text-muted-foreground w-full" dir="rtl">
                                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                                    {/* Rows per page selector */}
                                    <div className="flex items-center gap-2">
                                        <span>صفوف:</span>
                                        <Select
                                            value={perPage}
                                            onValueChange={(val) => setPerPage(val)}
                                        >
                                            <SelectTrigger className="h-8 w-16 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <span>
                                        عرض {(customers.current_page - 1) * customers.per_page + 1} - {Math.min(customers.current_page * customers.per_page, customers.total)} من {customers.total}
                                    </span>
                                </div>

                                {customers.last_page > 1 && (
                                    <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-1.5">
                                        {/* Desktop Pagination */}
                                        <div className="hidden md:flex items-center gap-1">
                                            {customers.links.map((link, idx) => {
                                                if (link.url === null) return null;
                                                return (
                                                    <Button
                                                        key={idx}
                                                        variant={link.active ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-8 min-w-8 text-xs font-bold"
                                                        onClick={() => {
                                                            const urlParams = new URLSearchParams(link.url!.split('?')[1]);
                                                            router.get(
                                                                route('customers.index'),
                                                                {
                                                                    page: urlParams.get('page') || undefined,
                                                                    search: searchTerm || undefined,
                                                                    status: statusFilter !== 'all' ? statusFilter : undefined,
                                                                    classification: classificationFilter !== 'all' ? classificationFilter : undefined,
                                                                    per_page: perPage !== '10' ? perPage : undefined,
                                                                },
                                                                { preserveState: true }
                                                            );
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Mobile Pagination */}
                                        <div className="flex md:hidden items-center justify-between w-full gap-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs font-bold px-3 h-8"
                                                disabled={customers.links[0]?.url === null}
                                                onClick={() => {
                                                    const prevUrl = customers.links[0]?.url;
                                                    if (prevUrl) {
                                                        const urlParams = new URLSearchParams(prevUrl.split('?')[1]);
                                                        router.get(
                                                            route('customers.index'),
                                                            {
                                                                page: urlParams.get('page') || undefined,
                                                                search: searchTerm || undefined,
                                                                status: statusFilter !== 'all' ? statusFilter : undefined,
                                                                classification: classificationFilter !== 'all' ? classificationFilter : undefined,
                                                                per_page: perPage !== '10' ? perPage : undefined,
                                                            },
                                                            { preserveState: true }
                                                        );
                                                    }
                                                }}
                                            >
                                                السابق
                                            </Button>

                                            <span className="text-xs font-medium text-muted-foreground">
                                                صفحة {customers.current_page} من {customers.last_page}
                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs font-bold px-3 h-8"
                                                disabled={customers.links[customers.links.length - 1]?.url === null}
                                                onClick={() => {
                                                    const nextUrl = customers.links[customers.links.length - 1]?.url;
                                                    if (nextUrl) {
                                                        const urlParams = new URLSearchParams(nextUrl.split('?')[1]);
                                                        router.get(
                                                            route('customers.index'),
                                                            {
                                                                page: urlParams.get('page') || undefined,
                                                                search: searchTerm || undefined,
                                                                status: statusFilter !== 'all' ? statusFilter : undefined,
                                                                classification: classificationFilter !== 'all' ? classificationFilter : undefined,
                                                                per_page: perPage !== '10' ? perPage : undefined,
                                                            },
                                                            { preserveState: true }
                                                        );
                                                    }
                                                }}
                                            >
                                                التالي
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>


                {/* Edit Dialog */}
                {editingCustomer && (
                    <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
                        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle className="text-base font-bold flex items-center gap-2 text-right">
                                    <Edit3 className="h-5 w-5 text-amber-600" />
                                    تعديل بيانات العميل: {editingCustomer.commercial_name}
                                </DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">اسم العميل الثلاثي</Label>
                                        <Input
                                            value={editForm.data.full_name}
                                            onChange={(e) => editForm.setData('full_name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Commercial Name */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">الاسم التجاري للعميل</Label>
                                        <Input
                                            value={editForm.data.commercial_name}
                                            onChange={(e) => editForm.setData('commercial_name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">رقم هاتف العميل</Label>
                                        <Input
                                            value={editForm.data.phone}
                                            onChange={(e) => editForm.setData('phone', e.target.value)}
                                            dir="ltr"
                                        />
                                    </div>

                                    {/* Area */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">المنطقة</Label>
                                        <Input
                                            value={editForm.data.customer_area}
                                            onChange={(e) => editForm.setData('customer_area', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />
                                <p className="text-xs font-bold text-muted-foreground text-right">العنوان وتحديد الموقع</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <Label className="text-xs font-semibold">أقرب نقطة دالة</Label>
                                        <Input
                                            value={editForm.data.nearest_landmark}
                                            onChange={(e) => editForm.setData('nearest_landmark', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 col-span-1 md:col-span-2 justify-start">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="main_street_edit"
                                                checked={editForm.data.is_main_street}
                                                onCheckedChange={(checked) => editForm.setData('is_main_street', !!checked)}
                                            />
                                            <Label htmlFor="main_street_edit" className="text-xs font-semibold cursor-pointer">شارع رئيسي</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="side_street_edit"
                                                checked={editForm.data.is_side_street}
                                                onCheckedChange={(checked) => editForm.setData('is_side_street', !!checked)}
                                            />
                                            <Label htmlFor="side_street_edit" className="text-xs font-semibold cursor-pointer">شارع فرعي</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="complex_edit"
                                                checked={editForm.data.inside_residential_complex}
                                                onCheckedChange={(checked) => editForm.setData('inside_residential_complex', !!checked)}
                                            />
                                            <Label htmlFor="complex_edit" className="text-xs font-semibold cursor-pointer">داخل مجمع سكني</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="area_edit"
                                                checked={editForm.data.inside_residential_area}
                                                onCheckedChange={(checked) => editForm.setData('inside_residential_area', !!checked)}
                                            />
                                            <Label htmlFor="area_edit" className="text-xs font-semibold cursor-pointer">داخل حي سكني</Label>
                                        </div>
                                    </div>

                                    {/* Location selection */}
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold">إحداثيات الموقع التجاري (خط الطول والعرض)</Label>
                                            <div className="flex gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] gap-1 border-primary/20 text-primary"
                                                    onClick={() => {
                                                        setMapTargetForm('edit');
                                                        setIsMapPickerOpen(true);
                                                    }}
                                                >
                                                    <MapPin className="size-3 text-primary animate-pulse" />
                                                    تحديد من الخريطة
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] gap-1"
                                                    onClick={() => fetchCurrentLocation('edit')}
                                                >
                                                    <MapPin className="size-3 text-emerald-500" />
                                                    موقعي الحالي (GPS)
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                value={editForm.data.latitude}
                                                onChange={(e) => editForm.setData('latitude', e.target.value)}
                                                dir="ltr"
                                            />
                                            <Input
                                                value={editForm.data.longitude}
                                                onChange={(e) => editForm.setData('longitude', e.target.value)}
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <Label className="text-xs font-semibold">العنوان التفصيلي</Label>
                                        <Input
                                            value={editForm.data.location_address}
                                            onChange={(e) => editForm.setData('location_address', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />
                                <p className="text-xs font-bold text-muted-foreground text-right">الأمانات ومساحة المحل</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">المساحة التقديرية للمحل</Label>
                                        <Select
                                            value={editForm.data.estimated_area}
                                            onValueChange={(val) => editForm.setData('estimated_area', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10_30">من 10 متر إلى 30 متر</SelectItem>
                                                <SelectItem value="30_80">من 30 متر إلى 80 متر</SelectItem>
                                                <SelectItem value="80_plus">من 80 متر إلى ...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">كود الأمانة</Label>
                                        <Input
                                            value={editForm.data.trust_code}
                                            onChange={(e) => editForm.setData('trust_code', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">نوع لافتة العميل</Label>
                                        <Input
                                            value={editForm.data.sign_type}
                                            onChange={(e) => editForm.setData('sign_type', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">تصنيف العميل</Label>
                                            <Select
                                                value={editForm.data.classification}
                                                onValueChange={(val) => editForm.setData('classification', val as 'A' | 'B' | 'C')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A">Class A</SelectItem>
                                                    <SelectItem value="B">Class B</SelectItem>
                                                    <SelectItem value="C">Class C</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">حالة التعامل</Label>
                                            <Select
                                                value={editForm.data.status}
                                                onValueChange={(val) => editForm.setData('status', val as 'active' | 'inactive')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">متعامل</SelectItem>
                                                    <SelectItem value="inactive">غير متعامل</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Refrigerator items list */}
                                    <div className="space-y-1.5 col-span-1 md:col-span-2 text-right">
                                        <Label className="text-xs font-semibold block mb-1">أمانة لدى العميل (اختر ما ينطبق):</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
                                            {trustOptions.map((option) => (
                                                <div key={option} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`item_edit_${option}`}
                                                        checked={editForm.data.trust_items.includes(option)}
                                                        onCheckedChange={(checked) => handleTrustItemsChange(option, !!checked, 'edit')}
                                                    />
                                                    <Label htmlFor={`item_edit_${option}`} className="text-xs cursor-pointer font-medium">{option}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* File upload */}
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <Label className="text-xs font-semibold block">صورة لبراد العميل (تحديث اختيارى)</Label>
                                        {editingCustomer.refrigerator_photo && (
                                            <div className="flex items-center gap-2 py-1">
                                                <ImageIcon className="size-4 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">صورة مسجلة بالفعل</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="photo-upload-edit"
                                                onChange={(e) => editForm.setData('refrigerator_photo', e.target.files ? e.target.files[0] : null)}
                                            />
                                            <Label
                                                htmlFor="photo-upload-edit"
                                                className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors w-full gap-2 text-center"
                                            >
                                                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-xs font-semibold text-foreground">
                                                    {editForm.data.refrigerator_photo ? editForm.data.refrigerator_photo.name : 'اضغط لاختيار صورة بديلة'}
                                                </span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingCustomer(null)}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        تحديث البيانات
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Delete Confirmation Alert Dialog */}
                {deletingCustomer && (
                    <AlertDialog open={!!deletingCustomer} onOpenChange={() => setDeletingCustomer(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-base font-bold text-right">
                                    هل أنت متأكد من حذف هذا العميل؟
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-right">
                                    سيتم حذف العميل <strong className="text-foreground">"{deletingCustomer.commercial_name}"</strong> وسجل أماناته نهائياً من النظام.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel onClick={() => setDeletingCustomer(null)}>
                                    إلغاء
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold">
                                    نعم، احذف العميل
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {/* Map Picker Dialog */}
                <Dialog open={isMapPickerOpen} onOpenChange={setIsMapPickerOpen}>
                    <DialogContent className="max-w-xl text-right" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">تحديد موقع العميل من الخريطة</DialogTitle>
                            <DialogDescription className="text-xs">
                                انقر على الخريطة لتحديد مكان المحل بدقة، ثم اضغط على زر تأكيد.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="relative w-full h-[400px]">
                            <div id="map-picker-canvas" className="w-full h-full rounded-lg border border-border"></div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsMapPickerOpen(false)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (tempCoords) {
                                        const form = mapTargetForm === 'add' ? addForm : editForm;
                                        form.setData({
                                            ...form.data,
                                            latitude: tempCoords.lat.toFixed(8),
                                            longitude: tempCoords.lng.toFixed(8),
                                        });
                                    }
                                    setIsMapPickerOpen(false);
                                }}
                                className="font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                تأكيد الموقع المختار
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthenticatedLayout>
    );
}
