<?php
header('Content-Type: text/plain; charset=utf-8');

$fileName = 'refrigerators/GeruLQdu59fgDNXnwxFL1J3R1NmSWLWYX33yE34V.jpg';

// Paths
$targetDir = __DIR__ . '/../storage/app/public';
$targetFile = $targetDir . '/' . $fileName;

$linkDir = __DIR__ . '/storage';
$linkFile = $linkDir . '/' . $fileName;

echo "--- فحص وجود الملفات والتصاريح --- \n\n";

echo "1. فحص المجلد الأصلي (Target):\n";
echo "مسار المجلد: " . realpath($targetDir) . "\n";
echo "هل المجلد الأصلي موجود؟ " . (is_dir($targetDir) ? "نعم" : "لا") . "\n";
echo "تصاريح المجلد الأصلي: " . substr(sprintf('%o', fileperms($targetDir)), -4) . "\n\n";

echo "2. فحص ملف الصورة في المجلد الأصلي:\n";
echo "مسار الملف: $targetFile\n";
echo "هل الملف موجود؟ " . (file_exists($targetFile) ? "نعم" : "لا") . "\n";
if (file_exists($targetFile)) {
    echo "تصاريح الملف الأصلي: " . substr(sprintf('%o', fileperms($targetFile)), -4) . "\n";
    echo "حجم الملف الأصلي: " . filesize($targetFile) . " بايت\n";
}
echo "\n";

echo "3. فحص الرابط الرمزي (Symlink):\n";
echo "مسار الرابط الرمزي: $linkDir\n";
echo "هل الرابط الرمزي موجود كـ Link؟ " . (is_link($linkDir) ? "نعم" : "لا") . "\n";
echo "هل الرابط الرمزي موجود كمجلد/ملف؟ " . (file_exists($linkDir) ? "نعم" : "لا") . "\n";
if (is_link($linkDir)) {
    echo "الوجهة التي يشير إليها الرابط الرمزي: " . readlink($linkDir) . "\n";
}
echo "\n";

echo "4. فحص قراءة الصورة من خلال الرابط الرمزي:\n";
echo "مسار الصورة عبر الرابط: $linkFile\n";
echo "هل الصورة مقروءة عبر الرابط؟ " . (file_exists($linkFile) ? "نعم" : "لا") . "\n";
if (file_exists($linkFile)) {
    echo "تصاريح الصورة عبر الرابط: " . substr(sprintf('%o', fileperms($linkFile)), -4) . "\n";
}
echo "\n";

echo "5. فحص محتويات مجلد المرفوعات (refrigerators) الأصلي:\n";
$refigDir = $targetDir . '/refrigerators';
if (is_dir($refigDir)) {
    echo "مجلد refrigerators موجود.\n";
    echo "تصاريح مجلد refrigerators: " . substr(sprintf('%o', fileperms($refigDir)), -4) . "\n";
    $files = scandir($refigDir);
    echo "محتويات المجلد:\n";
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            $fPath = $refigDir . '/' . $file;
            echo " - $file (الحجم: " . filesize($fPath) . " بايت, التصاريح: " . substr(sprintf('%o', fileperms($fPath)), -4) . ")\n";
        }
    }
} else {
    echo "مجلد refrigerators غير موجود في المجلد الأصلي!\n";
}
