import { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Plus,
    Pencil,
    Trash2,
    ShieldAlert,
    Loader2,
    Search,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';

interface TrustType {
    id: number;
    name: string;
    created_at: string;
}

interface Props {
    trustTypes: TrustType[];
}

export default function Index({ trustTypes }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingType, setEditingType] = useState<TrustType | null>(null);
    const [deletingType, setDeletingType] = useState<TrustType | null>(null);

    // Form setup for adding
    const addForm = useForm({
        name: '',
    });

    // Form setup for editing
    const editForm = useForm({
        name: '',
    });

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route('trust-types.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
            },
        });
    };

    const handleEditOpen = (type: TrustType) => {
        setEditingType(type);
        editForm.setData('name', type.name);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingType) return;
        editForm.put(route('trust-types.update', editingType.id), {
            onSuccess: () => {
                setEditingType(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingType) return;
        editForm.delete(route('trust-types.destroy', deletingType.id), {
            onSuccess: () => {
                setDeletingType(null);
            },
        });
    };

    // Filter local list
    const filteredTypes = trustTypes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout header="إدارة أنواع الأمانات">
            <Head title="إدارة الأمانات - الهادي للمكالمات التجارية" />

            <div className="space-y-4 text-right" dir="rtl">
                {/* Header Section */}
                <div className="flex flex-row items-center justify-between gap-2 pb-2">
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 justify-start">
                            <ShieldAlert className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                            دليل أنواع الأمانات
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                            إدارة وتحديث قائمة الأمانات الرئيسية المتاحة للاختيار عند تسجيل العملاء (البرادات، الستاندات، إلخ).
                        </p>
                    </div>

                    <Button onClick={() => setIsAddOpen(true)} className="gap-1.5 text-xs font-bold h-8">
                        <Plus className="h-4 w-4" />
                        إضافة أمانة
                    </Button>
                </div>

                {/* Search Bar */}
                <Card>
                    <CardContent className="py-3 px-3 md:px-6">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute right-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث عن أمانة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-8 h-9 text-xs"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table / List Container */}
                <Card>
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-base font-bold">أنواع الأمانات الحالية</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            إجمالي الأنواع المسجلة: <strong className="text-foreground font-mono">{filteredTypes.length}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredTypes.length === 0 ? (
                            <div className="text-center py-12 text-sm text-muted-foreground">
                                لا توجد أنواع أمانات مطابقة للبحث أو مسجلة حالياً.
                            </div>
                        ) : (
                            <>
                                {/* Desktop View */}
                                <div className="hidden sm:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">الاسم</TableHead>
                                                <TableHead className="text-right">تاريخ الإضافة</TableHead>
                                                <TableHead className="text-left w-32">الإجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTypes.map((type) => (
                                                <TableRow key={type.id}>
                                                    <TableCell className="font-semibold text-sm">{type.name}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                                        {new Date(type.created_at).toLocaleDateString('ar-EG', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit'
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <div className="flex gap-1.5 justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                                                                onClick={() => handleEditOpen(type)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                                                                onClick={() => setDeletingType(type)}
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
                                <div className="block sm:hidden divide-y divide-border">
                                    {filteredTypes.map((type) => (
                                        <div key={type.id} className="p-4 flex items-center justify-between gap-3">
                                            <div className="flex flex-col text-right">
                                                <span className="font-bold text-sm text-foreground">{type.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                    تمت الإضافة: {new Date(type.created_at).toLocaleDateString('ar-EG')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-primary"
                                                    onClick={() => handleEditOpen(type)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-destructive"
                                                    onClick={() => setDeletingType(type)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md text-right" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            إضافة أمانة جديدة
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            أدخل اسم الأمانة الرئيسي (مثال: براد رند 2026). سيظهر هذا الاسم كخيار في قائمة الأمانات لتسهيل الترميز للعملاء.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">اسم الأمانة الرئيسي</Label>
                            <Input
                                value={addForm.data.name}
                                onChange={(e) => addForm.setData('name', e.target.value)}
                                placeholder="مثال: براد ارسي"
                                required
                            />
                            {addForm.errors.name && (
                                <p className="text-xs text-destructive mt-1">{addForm.errors.name}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs h-9">
                                إلغاء
                            </Button>
                            <Button type="submit" className="text-xs h-9 gap-1.5" disabled={addForm.processing}>
                                {addForm.processing ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                إضافة الأمانة
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editingType !== null} onOpenChange={(open) => !open && setEditingType(null)}>
                <DialogContent className="max-w-md text-right" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" />
                            تعديل اسم الأمانة
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            قم بتعديل المسمى الرئيسي للأمانة ثم اضغط حفظ التعديل.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">اسم الأمانة الرئيسي</Label>
                            <Input
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                placeholder="مثال: براد رند"
                                required
                            />
                            {editForm.errors.name && (
                                <p className="text-xs text-destructive mt-1">{editForm.errors.name}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditingType(null)} className="text-xs h-9">
                                إلغاء
                            </Button>
                            <Button type="submit" className="text-xs h-9 gap-1.5" disabled={editForm.processing}>
                                {editForm.processing ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                حفظ التعديل
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deletingType !== null} onOpenChange={(open) => !open && setDeletingType(null)}>
                <DialogContent className="max-w-md text-right" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                            <AlertTriangle className="size-5" />
                            تأكيد حذف الأمانة
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed mt-2">
                            أنت على وشك حذف نوع الأمانة <strong className="text-foreground">"{deletingType?.name}"</strong> نهائياً من القائمة المتاحة.
                            <br /><br />
                            لن يؤثر هذا الحذف على العملاء المسجلين مسبقاً بهذه الأمانة، ولكنه سيزيل هذا الخيار من النماذج الجديدة.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDeletingType(null)} className="text-xs h-9 flex-1">
                            تراجع
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={editForm.processing}
                            className="text-xs h-9 gap-1.5 flex-1"
                        >
                            {editForm.processing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            نعم، احذف النوع
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
