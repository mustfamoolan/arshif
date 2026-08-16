<?php
$targetFolder = dirname(__FILE__) . '/../storage/app/public';
$linkFolder = dirname(__FILE__) . '/storage';

echo "<h3>معلومات المسارات وتصاريح الملفات:</h3>";

// دالة لمعرفة التصاريح بصيغة 755
function getPerms($path) {
    if (!file_exists($path)) return 'غير موجود';
    return substr(sprintf('%o', fileperms($path)), -4);
}

// دالة لمحاولة تعديل التصاريح لـ 755 للمجلدات و 644 للملفات
function fixPermissions($path) {
    if (!file_exists($path)) return;
    if (is_dir($path)) {
        @chmod($path, 0755);
        $items = scandir($path);
        foreach ($items as $item) {
            if ($item == '.' || $item == '..') continue;
            fixPermissions($path . '/' . $item);
        }
    } else {
        @chmod($path, 0644);
    }
}

// طباعة تصاريح المجلدات الرئيسية للتأكد من وصول الخادم لها
$path1 = dirname(__FILE__) . '/../storage';
$path2 = dirname(__FILE__) . '/../storage/app';
$path3 = dirname(__FILE__) . '/../storage/app/public';

echo "تصاريح مجلد storage الرئيسي: " . getPerms($path1) . "<br>";
echo "تصاريح مجلد storage/app: " . getPerms($path2) . "<br>";
echo "تصاريح مجلد storage/app/public: " . getPerms($path3) . "<br>";

// محاولة إصلاح التصاريح تلقائياً
echo "جاري محاولة إصلاح التصاريح إلى 755 للمجلدات و 644 للملفات...<br>";
fixPermissions($path1);
echo "تم تحديث التصاريح.<br><br>";

// 1. التحقق من وجود مجلد حقيقي في public/storage وتفريغه إن وجد
if (file_exists($linkFolder) && !is_link($linkFolder)) {
    echo "تنبيه: وجدنا مجلد حقيقي. جاري تفريغه وحذفه للتحضير للرابط الرمزي...<br>";
    // تفريغ المجلد
    function deleteDirectory($dir) {
        if (!file_exists($dir)) return true;
        if (!is_dir($dir)) return @unlink($dir);
        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') continue;
            if (!deleteDirectory($dir . '/' . $item)) return false;
        }
        return @rmdir($dir);
    }
    deleteDirectory($linkFolder);
}

// 2. محاولة إنشاء الرابط الرمزي الآن
if (!file_exists($linkFolder) && !is_link($linkFolder)) {
    echo "جاري محاولة إنشاء الرابط الرمزي الآن...<br>";
    if (symlink($targetFolder, $linkFolder)) {
        echo "<span style='color:green; font-weight:bold;'>✅ تم إنشاء الرابط الرمزي (Symlink) بنجاح!</span><br>";
    } else {
        echo "<span style='color:red; font-weight:bold;'>❌ فشل إنشاء الرابط الرمزي. قد تكون الدالة symlink معطلة من الاستضافة.</span><br>";
    }
}

// 3. التحقق النهائي من حالة الرابط الرمزي بعد محاولة الإنشاء
if (is_link($linkFolder)) {
    echo "<span style='color:green;'>الرابط الرمزي نشط حالياً (Link is active)</span><br>";
    echo "يشير إلى: " . readlink($linkFolder) . "<br>";
    if (file_exists(readlink($linkFolder))) {
        echo "<span style='color:green;'>المجلد المستهدف قابل للوصول عبر الرابط الرمزي بشكل كامل</span><br>";
    } else {
        echo "<span style='color:red;'>المجلد المستهدف غير قابل للوصول (رابط معطل)</span><br>";
    }
} else {
    echo "<span style='color:red;'>الرابط الرمزي غير موجود حتى الآن!</span><br>";
}

// محاولة كتابة ملف فحص صغير داخل مجلد الصور للتأكد من إمكانية قراءته بالمتصفح
$testFile = $targetFolder . '/refrigerators/test_read.txt';
@mkdir($targetFolder . '/refrigerators', 0755, true);
@file_put_contents($testFile, 'read_success');
@chmod($testFile, 0644);

echo "<br><b>رابط فحص القراءة المباشر:</b><br>";
echo "<a href='/storage/refrigerators/test_read.txt' target='_blank'>اضغط هنا لفتح ملف الفحص التجريبي</a><br>";
echo "إذا فتح الملف وظهرت كلمة 'read_success' فإن الرابط يعمل والتصاريح سليمة. إذا ظهر 403 أو 404 فهناك مشكلة في خيارات Apache Symlinks.<br>";
