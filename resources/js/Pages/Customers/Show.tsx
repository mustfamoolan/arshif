import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowRight,
    MapPin,
    Phone,
    User,
    ExternalLink,
    Store,
    Clock,
    ShieldAlert,
    FileText,
    Pencil,
    Trash2,
    Download,
    AlertTriangle,
    ImagePlus,
    Loader2,
    CheckCircle2,
    XCircle,
    Tag,
} from 'lucide-react';

interface TrustItem {
    name: string;
    code: string;
}

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
    district: string | null;
    estimated_area: string | null;
    trust_items: TrustItem[] | null;
    sign_type: string | null;
    phone: string | null;
    refrigerator_photo: string | null;
    status: 'active' | 'inactive';
    classification: 'A' | 'B' | 'C';
    created_at: string;
    creator?: { name: string };
}

interface TrustTypeMaster {
    id: number;
    name: string;
}

interface Props {
    customer: Customer;
    trust_types: TrustTypeMaster[];
    districtsList: string[];
}

export default function Show({ customer, trust_types, districtsList }: Props) {
    // ─── Map ───────────────────────────────────────────────────
    useEffect(() => {
        if (!customer.latitude || !customer.longitude) return;
        const timer = setTimeout(() => {
            const L = (window as any).L;
            if (!L) return;
            const lat = parseFloat(customer.latitude as any);
            const lng = parseFloat(customer.longitude as any);
            const mapContainer = document.getElementById('show-customer-map');
            if (!mapContainer) return;
            const parent = mapContainer.parentNode;
            if (parent) {
                const newDiv = document.createElement('div');
                newDiv.id = 'show-customer-map';
                newDiv.className = 'w-full h-[220px] rounded-lg border border-border overflow-hidden shadow-inner';
                parent.replaceChild(newDiv, mapContainer);
            }
            const map = L.map('show-customer-map', { center: [lat, lng], zoom: 15, zoomControl: true, scrollWheelZoom: false });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
            L.marker([lat, lng]).addTo(map).bindPopup(`<b>${customer.commercial_name}</b><br/>${customer.nearest_landmark || ''}`).openPopup();
            setTimeout(() => map.invalidateSize(), 100);
        }, 150);
        return () => clearTimeout(timer);
    }, [customer]);

    // ─── Edit Dialog ───────────────────────────────────────────
    const [editOpen, setEditOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(customer.refrigerator_photo);
    const fileRef = useRef<HTMLInputElement>(null);

    const editForm = useForm({
        _method: 'PUT',
        full_name: customer.full_name,
        commercial_name: customer.commercial_name,
        phone: customer.phone || '',
        customer_area: customer.customer_area || '',
        district: customer.district || '',
        nearest_landmark: customer.nearest_landmark || '',
        location_address: customer.location_address || '',
        latitude: customer.latitude?.toString() || '',
        longitude: customer.longitude?.toString() || '',
        is_main_street: customer.is_main_street,
        is_side_street: customer.is_side_street,
        inside_residential_complex: customer.inside_residential_complex,
        inside_residential_area: customer.inside_residential_area,
        estimated_area: customer.estimated_area || '',
        sign_type: customer.sign_type || '',
        trust_items: customer.trust_items || [] as TrustItem[],
        status: customer.status,
        classification: customer.classification,
        refrigerator_photo: null as File | null,
    });

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // التحقق من تحديد خيار واحد على الأقل لخصائص موقع المحل
        if (!editForm.data.is_main_street && 
            !editForm.data.is_side_street && 
            !editForm.data.inside_residential_complex && 
            !editForm.data.inside_residential_area) {
            alert('يجب اختيار خيار واحد على الأقل من خصائص موقع المحل.');
            return;
        }

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('full_name', editForm.data.full_name);
        formData.append('commercial_name', editForm.data.commercial_name);
        formData.append('phone', editForm.data.phone);
        formData.append('customer_area', editForm.data.customer_area);
        formData.append('district', editForm.data.district);
        formData.append('nearest_landmark', editForm.data.nearest_landmark);
        formData.append('location_address', editForm.data.location_address);
        formData.append('latitude', editForm.data.latitude);
        formData.append('longitude', editForm.data.longitude);
        formData.append('is_main_street', editForm.data.is_main_street ? '1' : '0');
        formData.append('is_side_street', editForm.data.is_side_street ? '1' : '0');
        formData.append('inside_residential_complex', editForm.data.inside_residential_complex ? '1' : '0');
        formData.append('inside_residential_area', editForm.data.inside_residential_area ? '1' : '0');
        formData.append('estimated_area', editForm.data.estimated_area);
        formData.append('sign_type', editForm.data.sign_type);
        
        // Append trust items as array of objects in FormData
        editForm.data.trust_items.forEach((item, idx) => {
            formData.append(`trust_items[${idx}][name]`, item.name);
            formData.append(`trust_items[${idx}][code]`, item.code);
        });

        formData.append('status', editForm.data.status);
        formData.append('classification', editForm.data.classification);
        if (editForm.data.refrigerator_photo) {
            formData.append('refrigerator_photo', editForm.data.refrigerator_photo);
        }

        router.post(route('customers.update', customer.id), formData, {
            onSuccess: () => setEditOpen(false),
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        editForm.setData('refrigerator_photo', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    // ─── Delete Dialog ─────────────────────────────────────────
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('customers.destroy', customer.id), {
            onFinish: () => setDeleting(false),
        });
    };

    // ─── Download image ────────────────────────────────────────
    const handleDownloadImage = () => {
        if (!customer.refrigerator_photo) return;
        const link = document.createElement('a');
        link.href = customer.refrigerator_photo;
        link.download = `براد-${customer.commercial_name}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AuthenticatedLayout header="تفاصيل العميل">
            <Head title={`تفاصيل العميل - ${customer.commercial_name}`} />

            <div className="space-y-5 max-w-5xl mx-auto pb-12" dir="rtl">

                {/* ── Header Row ── */}
                <div className="flex flex-row items-start justify-between gap-3 pb-4 border-b border-border">
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <Badge variant="outline" className="border-primary/20 text-primary text-[10px] font-bold">ملف العميل</Badge>
                            {customer.status === 'active' ? (
                                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    متعامل
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="text-[10px] font-bold gap-1">
                                    <XCircle className="size-3" /> غير متعامل
                                </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] font-bold">Class {customer.classification}</Badge>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">{customer.commercial_name}</h1>
                        <p className="text-xs text-muted-foreground">{customer.full_name}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <Link href={route('customers.index')}>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                                <ArrowRight className="size-3.5" />
                                <span className="hidden sm:inline">رجوع</span>
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => setEditOpen(true)}
                        >
                            <Pencil className="size-3.5" />
                            <span className="hidden sm:inline">تعديل</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline">حذف</span>
                        </Button>
                    </div>
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-right">

                    {/* Left 2 Cols */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Identity & Contact */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Store className="size-4 text-primary" />
                                    بيانات الهوية والاتصال
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">الاسم التجاري</span>
                                        <span className="text-sm font-semibold text-foreground">{customer.commercial_name}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">الاسم الثلاثي</span>
                                        <span className="text-sm font-semibold text-foreground">{customer.full_name}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">رقم الهاتف</span>
                                        <span className="text-sm font-semibold font-mono flex items-center gap-1.5 text-foreground">
                                            <Phone className="size-3.5 text-muted-foreground" />
                                            {customer.phone || 'غير مسجل'}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">القضاء والمنطقة</span>
                                        <span className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                                            <MapPin className="size-3.5 text-muted-foreground" />
                                            {customer.district ? `${customer.district} - ` : ''}{customer.customer_area || 'غير محددة'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <MapPin className="size-4 text-primary" />
                                    تفاصيل الموقع
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">أقرب نقطة دالة</span>
                                        <p className="text-sm font-semibold text-foreground">{customer.nearest_landmark || 'غير مسجلة'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">خصائص الموقع</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {customer.is_main_street && <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">شارع رئيسي</Badge>}
                                            {customer.is_side_street && <Badge variant="outline" className="text-[10px] font-bold">شارع فرعي</Badge>}
                                            {customer.inside_residential_complex && <Badge variant="outline" className="text-[10px] font-bold">مجمع سكني</Badge>}
                                            {customer.inside_residential_area && <Badge variant="outline" className="text-[10px] font-bold">حي سكني</Badge>}
                                            {!customer.is_main_street && !customer.is_side_street && !customer.inside_residential_complex && !customer.inside_residential_area && (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground">وصف العنوان بالتفصيل</span>
                                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                                        {customer.location_address || 'لا يوجد وصف تفصيلي'}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[11px] text-muted-foreground block">الخريطة الجغرافية</span>
                                    {customer.latitude && customer.longitude ? (
                                        <div className="space-y-2">
                                            <div id="show-customer-map" className="w-full h-[220px] rounded-lg border border-border overflow-hidden shadow-inner" />
                                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                                <span className="font-mono">{customer.latitude} , {customer.longitude}</span>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <ExternalLink className="size-3.5" />
                                                    خرائط جوجل
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                                            الموقع الجغرافي غير متوفر
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Col */}
                    <div className="space-y-5">

                        {/* Trust Items with Individual Codes */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <ShieldAlert className="size-4 text-primary" />
                                    الأمانات والتجهيز
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground block">المساحة التقديرية</span>
                                    <p className="text-sm font-semibold text-foreground">
                                        {customer.estimated_area === '10_30' && 'من 10 إلى 30 متر'}
                                        {customer.estimated_area === '30_80' && 'من 30 إلى 80 متر'}
                                        {customer.estimated_area === '80_plus' && 'من 80 متر فأكثر'}
                                        {!customer.estimated_area && 'غير محددة'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground block">نوع اللافتة الإعلانية</span>
                                    <p className="text-sm font-semibold text-foreground">{customer.sign_type || 'لا يوجد'}</p>
                                </div>
                                <Separator />
                                
                                <div className="space-y-3">
                                    <span className="text-[11px] text-muted-foreground block font-bold">الأمانات المستلمة وأكوادها الفردية:</span>
                                    {customer.trust_items && customer.trust_items.length > 0 ? (
                                        <div className="space-y-2">
                                            {customer.trust_items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 border border-border rounded-lg bg-muted/30">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                        <Tag className="size-3.5 text-primary" />
                                                        <span>{item.name}</span>
                                                    </div>
                                                    <span className="font-mono text-xs font-bold text-foreground bg-background border border-border px-2 py-0.5 rounded">
                                                        {item.code || 'بلا كود'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">لا يوجد أمانات مسجلة</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Refrigerator Photo */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                        <FileText className="size-4 text-primary" />
                                        صورة البراد
                                    </CardTitle>
                                    {customer.refrigerator_photo && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 gap-1 text-[11px] text-primary hover:text-primary/80"
                                            onClick={handleDownloadImage}
                                        >
                                            <Download className="size-3.5" />
                                            تحميل
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {customer.refrigerator_photo ? (
                                    <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-muted/20">
                                        <img
                                            src={customer.refrigerator_photo}
                                            alt="صورة براد العميل"
                                            className="w-full h-auto object-cover max-h-56 hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                            onClick={() => window.open(customer.refrigerator_photo!, '_blank')}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-xs py-10 border border-dashed border-border rounded-lg text-center">
                                        لا توجد صورة مرفقة للبراد
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Meta */}
                        <Card className="bg-muted/10 border-dashed">
                            <CardContent className="pt-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1"><User className="size-3.5" /> الموظف:</span>
                                    <span className="font-semibold text-foreground">@{customer.creator?.name || 'مجهول'}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="size-3.5" /> التسجيل:</span>
                                    <span className="font-semibold text-foreground font-mono">
                                        {new Date(customer.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════
                Edit Dialog
            ════════════════════════════════════════ */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-right">
                            <Pencil className="h-5 w-5 text-primary" />
                            تعديل بيانات العميل
                        </DialogTitle>
                        <DialogDescription className="text-xs text-right">
                            قم بتعديل البيانات ثم اضغط حفظ التعديلات. جميع الحقول المعلمة بـ * هي إلزامية.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2" encType="multipart/form-data">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">الاسم الثلاثي *</Label>
                                <Input value={editForm.data.full_name} onChange={e => editForm.setData('full_name', e.target.value)} required />
                                {editForm.errors.full_name && <p className="text-xs text-destructive">{editForm.errors.full_name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">الاسم التجاري *</Label>
                                <Input value={editForm.data.commercial_name} onChange={e => editForm.setData('commercial_name', e.target.value)} required />
                                {editForm.errors.commercial_name && <p className="text-xs text-destructive">{editForm.errors.commercial_name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">رقم الهاتف *</Label>
                                <Input value={editForm.data.phone} onChange={e => editForm.setData('phone', e.target.value)} dir="ltr" required />
                                {editForm.errors.phone && <p className="text-xs text-destructive">{editForm.errors.phone}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">المنطقة *</Label>
                                <Input value={editForm.data.customer_area} onChange={e => editForm.setData('customer_area', e.target.value)} required />
                                {editForm.errors.customer_area && <p className="text-xs text-destructive">{editForm.errors.customer_area}</p>}
                            </div>
                            <div className="space-y-1.5 col-span-1 md:col-span-2">
                                <Label className="text-xs font-semibold">القضاء (البصرة) *</Label>
                                <Select
                                    value={editForm.data.district}
                                    onValueChange={(val) => editForm.setData('district', val)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر القضاء" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {districtsList.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editForm.errors.district && <p className="text-xs text-destructive">{editForm.errors.district}</p>}
                            </div>
                            <div className="space-y-1.5 col-span-1 md:col-span-2">
                                <Label className="text-xs font-semibold">أقرب نقطة دالة *</Label>
                                <Input value={editForm.data.nearest_landmark} onChange={e => editForm.setData('nearest_landmark', e.target.value)} required />
                                {editForm.errors.nearest_landmark && <p className="text-xs text-destructive">{editForm.errors.nearest_landmark}</p>}
                            </div>
                            <div className="space-y-1.5 col-span-1 md:col-span-2">
                                <Label className="text-xs font-semibold">وصف العنوان بالتفصيل *</Label>
                                <Textarea value={editForm.data.location_address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => editForm.setData('location_address', e.target.value)} rows={2} required />
                                {editForm.errors.location_address && <p className="text-xs text-destructive">{editForm.errors.location_address}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">خط العرض (Latitude) *</Label>
                                <Input value={editForm.data.latitude} onChange={e => editForm.setData('latitude', e.target.value)} dir="ltr" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">خط الطول (Longitude) *</Label>
                                <Input value={editForm.data.longitude} onChange={e => editForm.setData('longitude', e.target.value)} dir="ltr" required />
                            </div>
                            {(editForm.errors.latitude || editForm.errors.longitude) && (
                                <p className="text-xs text-destructive col-span-1 md:col-span-2">الإحداثيات حقول إجبارية.</p>
                            )}
                        </div>

                        <Separator />

                        {/* Checkboxes */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold block">خصائص موقع المحل (اختر واحد على الأقل) *</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                                {[
                                    { id: 'edit_main', label: 'شارع رئيسي', key: 'is_main_street' as const },
                                    { id: 'edit_side', label: 'شارع فرعي', key: 'is_side_street' as const },
                                    { id: 'edit_complex', label: 'مجمع سكني', key: 'inside_residential_complex' as const },
                                    { id: 'edit_area', label: 'حي سكني', key: 'inside_residential_area' as const },
                                ].map(({ id, label, key }) => (
                                    <div key={id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={id}
                                            checked={editForm.data[key] as boolean}
                                            onCheckedChange={checked => editForm.setData(key, !!checked)}
                                        />
                                        <Label htmlFor={id} className="text-xs font-semibold cursor-pointer">{label}</Label>
                                    </div>
                                ))}
                            </div>
                            {(editForm.errors as any).street_types && <p className="text-xs text-destructive">{(editForm.errors as any).street_types}</p>}
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">حالة التعامل *</Label>
                                <Select value={editForm.data.status} onValueChange={v => editForm.setData('status', v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">متعامل</SelectItem>
                                        <SelectItem value="inactive">غير متعامل</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editForm.errors.status && <p className="text-xs text-destructive">{editForm.errors.status}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">التصنيف *</Label>
                                <Select value={editForm.data.classification} onValueChange={v => editForm.setData('classification', v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">Class A</SelectItem>
                                        <SelectItem value="B">Class B</SelectItem>
                                        <SelectItem value="C">Class C</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editForm.errors.classification && <p className="text-xs text-destructive">{editForm.errors.classification}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">المساحة التقديرية *</Label>
                                <Select value={editForm.data.estimated_area} onValueChange={v => editForm.setData('estimated_area', v)}>
                                    <SelectTrigger><SelectValue placeholder="اختر المساحة" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10_30">من 10 إلى 30 متر</SelectItem>
                                        <SelectItem value="30_80">من 30 إلى 80 متر</SelectItem>
                                        <SelectItem value="80_plus">من 80 متر فأكثر</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editForm.errors.estimated_area && <p className="text-xs text-destructive">{editForm.errors.estimated_area}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">نوع اللافتة *</Label>
                                <Input value={editForm.data.sign_type} onChange={e => editForm.setData('sign_type', e.target.value)} required />
                                {editForm.errors.sign_type && <p className="text-xs text-destructive">{editForm.errors.sign_type}</p>}
                            </div>

                            {/* Dynamic Trust Items List on Edit */}
                            <div className="space-y-3 col-span-1 md:col-span-2 text-right">
                                <Label className="text-xs font-semibold block mb-1">الأمانات المستلمة وترميزها (اختر واحدة على الأقل وسجل كودها) *</Label>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border border-border rounded-md">
                                    {trust_types.map((type) => {
                                        const isChecked = editForm.data.trust_items.some(item => item.name === type.name);
                                        const selectedItem = editForm.data.trust_items.find(item => item.name === type.name);

                                        return (
                                            <div key={type.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border border-border rounded bg-muted/10">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`item_edit_${type.id}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => {
                                                            let newItems = [...editForm.data.trust_items];
                                                            if (checked) {
                                                                newItems.push({ name: type.name, code: '' });
                                                            } else {
                                                                newItems = newItems.filter(item => item.name !== type.name);
                                                            }
                                                            editForm.setData('trust_items', newItems);
                                                        }}
                                                    />
                                                    <Label htmlFor={`item_edit_${type.id}`} className="text-xs font-semibold cursor-pointer">{type.name}</Label>
                                                </div>
                                                {isChecked && (
                                                    <div className="w-full sm:w-48">
                                                        <Input
                                                            placeholder="كود الأمانة..."
                                                            value={selectedItem?.code || ''}
                                                            onChange={(e) => {
                                                                const newItems = editForm.data.trust_items.map(item => {
                                                                    if (item.name === type.name) {
                                                                        return { ...item, code: e.target.value };
                                                                    }
                                                                    return item;
                                                                });
                                                                editForm.setData('trust_items', newItems);
                                                            }}
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {editForm.errors.trust_items && <p className="text-xs text-destructive">{editForm.errors.trust_items}</p>}
                                {Object.keys(editForm.errors).some(k => k.startsWith('trust_items.')) && (
                                    <p className="text-xs text-destructive">يعبأ الكود إجبارياً لكل أمانة يتم تحديدها.</p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Photo Upload */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">صورة البراد</Label>
                            <div
                                className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                onClick={() => fileRef.current?.click()}
                            >
                                {photoPreview ? (
                                    <div className="space-y-2">
                                        <img src={photoPreview} alt="معاينة الصورة" className="max-h-36 mx-auto rounded-md object-cover" />
                                        <p className="text-xs text-muted-foreground">اضغط لتغيير الصورة</p>
                                    </div>
                                ) : (
                                    <div className="py-4 space-y-2">
                                        <ImagePlus className="size-8 mx-auto text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">اضغط لرفع صورة البراد</p>
                                    </div>
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            {editForm.errors.refrigerator_photo && <p className="text-xs text-destructive">{editForm.errors.refrigerator_photo}</p>}
                        </div>

                        <DialogFooter className="flex gap-2 pt-2" dir="rtl">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="text-xs h-9">
                                إلغاء
                            </Button>
                            <Button type="submit" className="text-xs h-9 gap-1.5" disabled={editForm.processing}>
                                {editForm.processing ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                حفظ التعديلات
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════
                Delete Confirm Dialog
            ════════════════════════════════════════ */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                            <AlertTriangle className="size-5" />
                            تأكيد حذف العميل
                        </DialogTitle>
                        <DialogDescription className="text-xs text-right leading-relaxed mt-2">
                            أنت على وشك حذف بيانات العميل{' '}
                            <strong className="text-foreground">"{customer.commercial_name}"</strong>{' '}
                            نهائياً من النظام. هذا الإجراء لا يمكن التراجع عنه وسيُحذف معه سجل العميل وصورة البراد.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2 text-right">
                        <p className="text-xs font-semibold text-destructive flex items-start gap-2">
                            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                            لا يمكن استعادة البيانات بعد الحذف. تأكد من قرارك قبل المتابعة.
                        </p>
                    </div>

                    <DialogFooter className="flex gap-2 pt-2" dir="rtl">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} className="text-xs h-9 flex-1">
                            إلغاء — تراجع
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-xs h-9 gap-1.5 flex-1"
                        >
                            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            نعم، احذف العميل
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
