<?php
// Bootstrap Laravel
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Customer;
$customer = Customer::latest()->first();
header('Content-Type: application/json');

if ($customer) {
    echo json_encode([
        'id' => $customer->id,
        'full_name' => $customer->full_name,
        'raw_photo' => $customer->getRawOriginal('refrigerator_photo'),
        'accessor_photo' => $customer->refrigerator_photo,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} else {
    echo json_encode(['error' => 'No customers found']);
}
