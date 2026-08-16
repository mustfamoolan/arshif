<?php
$targetFolder = dirname(__FILE__) . '/../storage/app/public';
$linkFolder = dirname(__FILE__) . '/storage';

echo "<h3>معلومات المسارات:</h3>";
echo "المجلد المستهدف الأصلي (Target): " . realpath($targetFolder) . " ($targetFolder)<br>";
echo "رابط الوصول العام (Link): " . $linkFolder . "<br><br>";

// دالة لحذف مجلد وكل ما بداخله بشكل متكرر
function deleteDirectory($dir) {
    if (!file_exists($dir)) {
        return true;
    }
    if (!is_dir($dir)) {
        return @unlink($dir);
    }
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }
        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }
    }
    return @rmdir($dir);
}

// 1. التحقق من وجود مجلد حقيقي في public/storage لمنع تعارض الإنشاء
if (file_exists($linkFolder)) {
    if (is_link($linkFolder)) {
        echo "الرابط الرمزي موجود بالفعل! لا حاجة لإعادة إنشائه.<br>";
        exit;
    } else {
        echo "تنبيه: وجدنا مجلد حقيقي في public/storage. سنقوم بنقل الصور وتفريغ الملفات المخفية...<br>";
        
        // إنشاء مجلد refrigerators في المستهدف الأصلي إذا لم يكن موجوداً
        @mkdir($targetFolder . '/refrigerators', 0755, true);
        
        // نقل الصور من المجلد القديم إلى المجلد الأصلي
        $oldRefrigerators = $linkFolder . '/refrigerators';
        if (is_dir($oldRefrigerators)) {
            $files = scandir($oldRefrigerators);
            foreach ($files as $file) {
                if ($file == '.' || $file == '..') continue;
                $src = $oldRefrigerators . '/' . $file;
                $dest = $targetFolder . '/refrigerators/' . $file;
                @rename($src, $dest);
            }
        }
        
        // الآن نقوم بحذف مجلد public/storage بالكامل (بما فيه ملفات .gitignore المخفية) لتوفير المسار
        if (deleteDirectory($linkFolder)) {
            echo "تم تفريغ وحذف المجلد القديم بنجاح!<br>";
        } else {
            echo "فشل حذف بعض الملفات تلقائياً. يرجى حذفه يدوياً عبر لوحة تحكم الاستضافة cPanel / File Manager.<br>";
        }
    }
}

// 2. إنشاء الرابط الرمزي
if (symlink($targetFolder, $linkFolder)) {
    echo "<h2 style='color:green;'>تم إنشاء الرابط الرمزي (Symlink) بنجاح!</h2>";
} else {
    echo "<h2 style='color:red;'>فشل إنشاء الرابط الرمزي. قد تكون الدالة symlink معطلة من إعدادات الاستضافة (PHP disable_functions).</h2>";
}
