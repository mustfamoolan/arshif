<?php
header('Content-Type: text/plain; charset=utf-8');

$linkPath = __DIR__ . '/storage';
$targetPath = __DIR__ . '/../storage/app/public';

echo "--- أداة إصلاح الرابط الرمزي (Symlink Fixer) --- \n\n";

if (file_exists($linkPath)) {
    if (is_link($linkPath)) {
        echo "تنبيه: الرابط الرمزي موجود بالفعل ويشير إلى: " . readlink($linkPath) . "\n";
        echo "لا داعي لإجراء أي تعديل.\n";
        exit;
    } else {
        echo "وجدنا مجلد حقيقي (مادي) في $linkPath بدلاً من الرابط الرمزي.\n";
        echo "نقوم بحذفه الآن لتهيئة المكان للرابط الرمزي...\n";
        
        // Recursive helper to delete directory
        function deleteDir($dirPath) {
            if (!is_dir($dirPath)) return;
            $files = array_diff(scandir($dirPath), array('.', '..'));
            foreach ($files as $file) {
                $p = $dirPath . '/' . $file;
                (is_dir($p)) ? deleteDir($p) : unlink($p);
            }
            return rmdir($dirPath);
        }
        
        if (deleteDir($linkPath)) {
            echo "نجاح: تم حذف المجلد المادي القديم بنجاح!\n\n";
        } else {
            echo "خطأ: فشل حذف المجلد. يرجى حذفه يدوياً عن طريق مدير الملفات (cPanel) أو SSH.\n";
            exit;
        }
    }
} else {
    echo "المسار $linkPath فارغ ومستعد لإنشاء الرابط.\n\n";
}

echo "الآن، قم بتشغيل الأمر التالي في SSH لإنشاء الرابط الرمزي بشكل صحيح:\n\n";
echo "ln -s $targetPath $linkPath\n\n";
echo "بمجرد تشغيل هذا الأمر، ستعمل جميع الصور المرفوعة فوراً دون أي مشاكل!\n";
