<?php
// تحديد المسارات بدقة
$targetFolder = dirname(__FILE__) . '/storage/app/public';
$linkFolder = dirname(__FILE__) . '/public/storage';

echo "<h3>معلومات المسارات:</h3>";
echo "المجلد المستهدف الأصلي (Target): " . $targetFolder . "<br>";
echo "رابط الوصول العام (Link): " . $linkFolder . "<br><br>";

// 1. التحقق من وجود مجلد حقيقي في public/storage لمنع تعارض الإنشاء
if (file_exists($linkFolder)) {
    if (is_link($linkFolder)) {
        echo "الرابط الرمزي موجود بالفعل! لا حاجة لإعادة إنشائه.<br>";
        exit;
    } else {
        echo "تنبيه: وجدنا مجلد حقيقي في public/storage. سنقوم بنقل محتوياته وحذفه لإنشاء الرابط الرمزي...<br>";
        
        // نقل الصور تلقائياً لمجلد التخزين الأصلي لمنع ضياعها
        if (is_dir($linkFolder . '/refrigerators')) {
            @mkdir($targetFolder . '/refrigerators', 0755, true);
            $files = glob($linkFolder . '/refrigerators/*');
            if ($files) {
                foreach ($files as $file) {
                    $dest = $targetFolder . '/refrigerators/' . basename($file);
                    @rename($file, $dest);
                }
            }
        }
        
        // حذف المجلد القديم الفارغ
        @rmdir($linkFolder . '/refrigerators');
        @rmdir($linkFolder);
    }
}

// 2. إنشاء الرابط الرمزي
if (symlink($targetFolder, $linkFolder)) {
    echo "<h2 style='color:green;'>تم إنشاء الرابط الرمزي (Symlink) بنجاح وتوجيهه إلى public/storage!</h2>";
} else {
    echo "<h2 style='color:red;'>فشل إنشاء الرابط الرمزي. قد تكون الدالة symlink معطلة من إعدادات الاستضافة (PHP disable_functions).</h2>";
}
