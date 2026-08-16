import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageProps } from '@/types';
import {
    History,
    Search,
    User,
    SlidersHorizontal,
    Eye,
    Clock,
    Monitor,
    Globe,
    AlertCircle,
    ArrowRight,
} from 'lucide-react';

interface LogUser {
    id: number;
    name: string;
    role: 'admin' | 'employee';
}

interface ActivityLog {
    id: number;
    user_id: number | null;
    user: LogUser | null;
    log_type: string;
    action: string;
    subject_id: number | null;
    subject_name: string | null;
    description: string;
    changes: Record<string, { old: any; new: any }> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props extends PageProps {
    logs: {
        data: ActivityLog[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        links: PaginationLink[];
    };
    users: { id: number; name: string }[];
    filters: {
        search?: string;
        action?: string;
        user_id?: string;
        per_page?: string;
    };
}

// Arabic translation for customer fields
const fieldTranslations: Record<string, string> = {
    full_name: 'الاسم الثلاثي للعميل',
    commercial_name: 'الاسم التجاري للمحل',
    latitude: 'خط العرض (Latitude)',
    longitude: 'خط الطول (Longitude)',
    location_address: 'العنوان بالتفصيل',
    is_main_street: 'شارع رئيسي',
    is_side_street: 'شارع فرعي',
    inside_residential_complex: 'داخل مجمع سكني',
    inside_residential_area: 'داخل حي سكني',
    nearest_landmark: 'أقرب نقطة دالة',
    customer_area: 'المنطقة',
    estimated_area: 'المساحة التقديرية للمحل',
    trust_items: 'الأمانات المستلمة',
    trust_code: 'كود الأمانة',
    sign_type: 'نوع اللافتة الإعلانية',
    phone: 'رقم هاتف العميل',
    refrigerator_photo: 'صورة البراد',
    status: 'حالة التعامل',
    classification: 'تصنيف العميل',
};

// Map estimated area database keys to readable Arabic names
const formatEstimatedArea = (val: string) => {
    if (val === '10_30') return 'من 10 متر إلى 30 متر';
    if (val === '30_80') return 'من 30 متر إلى 80 متر';
    if (val === '80_plus') return 'من 80 متر إلى ...';
    return val;
};

// Helper function to render values cleanly in comparison view
const renderValue = (key: string, val: any) => {
    if (val === null || val === undefined || val === '') {
        return <span className="text-muted-foreground italic text-xs">فارغ</span>;
    }
    if (typeof val === 'boolean') {
        return val ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">نعم</Badge>
        ) : (
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-[10px]">لا</Badge>
        );
    }
    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-muted-foreground italic text-xs">لا يوجد</span>;
        return (
            <div className="flex flex-wrap gap-1">
                {val.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0">{item}</Badge>
                ))}
            </div>
        );
    }
    if (key === 'estimated_area') {
        return <span className="font-semibold">{formatEstimatedArea(val)}</span>;
    }
    if (key === 'status') {
        return val === 'active' ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]">متعامل</Badge>
        ) : (
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-[10px]">غير متعامل</Badge>
        );
    }
    return <span className="break-all">{String(val)}</span>;
};

export default function Index({ logs, users, filters }: Props) {
    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [actionFilter, setActionFilter] = useState(filters.action || 'all');
    const [userFilter, setUserFilter] = useState(filters.user_id || 'all');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    // Dialog state for showing changes detail comparison
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    // Debounced automatic routing when filters update
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                route('activity-logs.index'),
                {
                    search: searchTerm || undefined,
                    action: actionFilter !== 'all' ? actionFilter : undefined,
                    user_id: userFilter !== 'all' ? userFilter : undefined,
                    per_page: perPage !== '10' ? perPage : undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, actionFilter, userFilter, perPage]);

    const resetFilters = () => {
        setSearchTerm('');
        setActionFilter('all');
        setUserFilter('all');
        setPerPage('10');
    };

    return (
        <AuthenticatedLayout header="سجل العمليات">
            <Head title="سجل العمليات - الهادي للمكالمات التجارية" />

            <div className="space-y-4" dir="rtl">
                {/* Page Header */}
                <div className="flex flex-row items-center justify-between gap-2">
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <History className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                            سجل العمليات
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                            مراقبة وتتبع العمليات التي يقوم بها المستخدمون في النظام.
                        </p>
                    </div>
                </div>

                {/* Filters card */}
                <Card>
                    <CardContent className="pt-3 pb-3 px-3 md:pt-4 md:pb-4 md:px-6" dir="rtl">
                        <div className="grid grid-cols-2 md:flex md:flex-row items-end gap-2 md:gap-3">
                            {/* Search - full width on mobile */}
                            <div className="col-span-2 flex-1 w-full">
                                <div className="relative">
                                    <Search className="absolute right-2.5 top-2 size-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="بحث عن عملية..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-8 h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* User Filter */}
                            <div className="w-full md:w-52">
                                <Select value={userFilter} onValueChange={setUserFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="المستخدم" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل المستخدمين</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Filter */}
                            <div className="w-full md:w-44">
                                <Select value={actionFilter} onValueChange={setActionFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="نوع العملية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل العمليات</SelectItem>
                                        <SelectItem value="create">إضافة</SelectItem>
                                        <SelectItem value="update">تعديل</SelectItem>
                                        <SelectItem value="delete">حذف</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Reset Filters */}
                            {(searchTerm || actionFilter !== 'all' || userFilter !== 'all') && (
                                <div className="col-span-2 md:col-span-1">
                                    <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto h-8 text-xs">
                                        ↺ إعادة ضبط
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Logs Table */}
                <Card>
                    <CardHeader className="border-b border-border pb-4 text-right">
                        <CardTitle className="text-base font-bold">قائمة الحركات</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            إجمالي العمليات المسجلة: <strong className="text-foreground font-mono">{logs.total}</strong>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                        {logs.data.length === 0 ? (
                            <div className="text-center py-12 text-sm text-muted-foreground">
                                لا توجد عمليات مسجلة تطابق شروط البحث الحالية.
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block">
                                    <Table dir="rtl">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right w-44">المستخدم</TableHead>
                                                <TableHead className="text-right w-24">العملية</TableHead>
                                                <TableHead className="text-right w-48">العميل / المستهدف</TableHead>
                                                <TableHead className="text-right">الوصف والبيان</TableHead>
                                                <TableHead className="text-right w-36">العنوان الرقمي IP</TableHead>
                                                <TableHead className="text-right w-44">التاريخ والوقت</TableHead>
                                                <TableHead className="text-center w-24">التعديلات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.data.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-semibold text-xs">
                                                        {log.user ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                                    {log.user.name.substring(0, 1).toUpperCase()}
                                                                </div>
                                                                <div className="flex flex-col text-right">
                                                                    <span className="truncate max-w-[120px]">{log.user.name}</span>
                                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                                        {log.user.role === 'admin' ? 'مدير' : 'موظف'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs font-normal">النظام</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.action === 'create' && (
                                                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[10px] px-2 py-0.5">إضافة</Badge>
                                                        )}
                                                        {log.action === 'update' && (
                                                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 text-[10px] px-2 py-0.5">تعديل</Badge>
                                                        )}
                                                        {log.action === 'delete' && (
                                                            <Badge variant="destructive" className="text-[10px] px-2 py-0.5">حذف</Badge>
                                                        )}
                                                        {log.action !== 'create' && log.action !== 'update' && log.action !== 'delete' && (
                                                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{log.action}</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium">
                                                        {log.subject_name ? (
                                                            <div className="flex flex-col text-right">
                                                                <span className="font-semibold text-foreground truncate max-w-[170px]">{log.subject_name}</span>
                                                                <span className="text-[10px] text-muted-foreground">النوع: {log.log_type} (ID: {log.subject_id})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-foreground max-w-xs truncate" title={log.description}>
                                                        {log.description}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <Globe className="size-3 text-muted-foreground shrink-0" />
                                                            {log.ip_address || '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="size-3 text-muted-foreground shrink-0" />
                                                            {new Date(log.created_at).toLocaleString('ar-EG', {
                                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                                hour: '2-digit', minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {log.changes && Object.keys(log.changes).length > 0 ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                                                                onClick={() => setSelectedLog(log)}
                                                                title="عرض تفاصيل التعديلات"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="block md:hidden divide-y divide-border" dir="rtl">
                                    {logs.data.map((log) => (
                                        <div key={log.id} className="p-3 space-y-2 hover:bg-muted/10">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-col text-right flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-foreground truncate">
                                                        {log.subject_name || '—'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {log.description}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {log.action === 'create' && (
                                                        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0">إضافة</Badge>
                                                    )}
                                                    {log.action === 'update' && (
                                                        <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 text-[10px] px-1.5 py-0">تعديل</Badge>
                                                    )}
                                                    {log.action === 'delete' && (
                                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">حذف</Badge>
                                                    )}
                                                    {log.changes && Object.keys(log.changes).length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-primary"
                                                            onClick={() => setSelectedLog(log)}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="size-3" />
                                                    {log.user?.name || 'النظام'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {new Date(log.created_at).toLocaleString('ar-EG', {
                                                        month: '2-digit', day: '2-digit',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Pagination & Rows Footer */}
                        {logs.total > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 text-xs font-semibold text-muted-foreground w-full" dir="rtl">
                                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                                    <div className="flex items-center gap-2">
                                        <span>صفوف:</span>
                                        <Select value={perPage} onValueChange={setPerPage}>
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
                                        عرض {(logs.current_page - 1) * logs.per_page + 1} - {Math.min(logs.current_page * logs.per_page, logs.total)} من {logs.total}
                                    </span>
                                </div>

                                {logs.last_page > 1 && (
                                    <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-1.5">
                                        {/* Desktop Pagination */}
                                        <div className="hidden md:flex items-center gap-1">
                                            {logs.links.map((link, idx) => {
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
                                                                route('activity-logs.index'),
                                                                {
                                                                    page: urlParams.get('page') || undefined,
                                                                    search: searchTerm || undefined,
                                                                    action: actionFilter !== 'all' ? actionFilter : undefined,
                                                                    user_id: userFilter !== 'all' ? userFilter : undefined,
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
                                                disabled={logs.links[0]?.url === null}
                                                onClick={() => {
                                                    const prevUrl = logs.links[0]?.url;
                                                    if (prevUrl) {
                                                        const urlParams = new URLSearchParams(prevUrl.split('?')[1]);
                                                        router.get(
                                                            route('activity-logs.index'),
                                                            {
                                                                page: urlParams.get('page') || undefined,
                                                                search: searchTerm || undefined,
                                                                action: actionFilter !== 'all' ? actionFilter : undefined,
                                                                user_id: userFilter !== 'all' ? userFilter : undefined,
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
                                                صفحة {logs.current_page} من {logs.last_page}
                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs font-bold px-3 h-8"
                                                disabled={logs.links[logs.links.length - 1]?.url === null}
                                                onClick={() => {
                                                    const nextUrl = logs.links[logs.links.length - 1]?.url;
                                                    if (nextUrl) {
                                                        const urlParams = new URLSearchParams(nextUrl.split('?')[1]);
                                                        router.get(
                                                            route('activity-logs.index'),
                                                            {
                                                                page: urlParams.get('page') || undefined,
                                                                search: searchTerm || undefined,
                                                                action: actionFilter !== 'all' ? actionFilter : undefined,
                                                                user_id: userFilter !== 'all' ? userFilter : undefined,
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

                {/* Changes Dialog */}
                {selectedLog && (
                    <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                        <DialogContent className="max-w-2xl text-right max-h-[85vh] overflow-y-auto" dir="rtl">
                            <DialogHeader>
                                <DialogTitle className="text-base font-bold flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-primary" />
                                    مقارنة تفاصيل التعديلات
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    مقارنة القيم السابقة بالقيم الحالية للعميل: <strong className="text-foreground">{selectedLog.subject_name}</strong>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="border border-border rounded-lg overflow-hidden my-4">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="text-right w-44">الحقل المعدل</TableHead>
                                            <TableHead className="text-right">القيمة السابقة</TableHead>
                                            <TableHead className="text-right">القيمة الجديدة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedLog.changes && Object.entries(selectedLog.changes).map(([key, change]) => (
                                            <TableRow key={key} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="font-semibold text-xs text-foreground">
                                                    {fieldTranslations[key] || key}
                                                    <span className="block font-mono text-[9px] text-muted-foreground font-normal mt-0.5">
                                                        {key}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-rose-600 bg-rose-500/5 font-medium border-l border-rose-500/10">
                                                    <div className="line-through opacity-85">
                                                        {renderValue(key, change.old)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-emerald-600 bg-emerald-500/5 font-semibold">
                                                    <div>
                                                        {renderValue(key, change.new)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Additional Log Meta */}
                            <div className="bg-muted/30 rounded-lg p-3 text-[11px] space-y-2 text-muted-foreground border">
                                <div className="flex justify-between items-center">
                                    <span>المستخدم المنفذ للعملية:</span>
                                    <span className="font-bold text-foreground">@{selectedLog.user?.name || 'غير معروف'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>تاريخ العملية:</span>
                                    <span className="font-mono text-foreground">
                                        {new Date(selectedLog.created_at).toLocaleString('ar-EG')}
                                    </span>
                                </div>
                                {selectedLog.user_agent && (
                                    <div className="space-y-1">
                                        <span>معلومات المتصفح (User Agent):</span>
                                        <p className="font-mono text-[10px] leading-relaxed break-all bg-background border rounded p-1.5 text-foreground max-h-20 overflow-y-auto">
                                            {selectedLog.user_agent}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setSelectedLog(null)}
                                    className="font-bold w-full sm:w-auto"
                                >
                                    إغلاق الواجهة
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
