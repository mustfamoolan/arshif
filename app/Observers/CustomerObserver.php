<?php

namespace App\Observers;

use App\Models\Customer;
use App\Models\ActivityLog;

class CustomerObserver
{
    /**
     * Handle the Customer "created" event.
     */
    public function created(Customer $customer): void
    {
        if (auth()->check()) {
            ActivityLog::log('create', "تم إضافة العميل الجديد: {$customer->commercial_name}", $customer);
        }
    }

    /**
     * Handle the Customer "updated" event.
     */
    public function updated(Customer $customer): void
    {
        if (auth()->check()) {
            $changes = [];
            
            // Collect dirty fields except internal system fields
            $ignoredKeys = ['updated_at', 'created_at'];
            
            foreach ($customer->getDirty() as $key => $newValue) {
                if (in_array($key, $ignoredKeys)) {
                    continue;
                }
                
                $oldValue = $customer->getOriginal($key);
                
                // Convert boolean attributes to readable text
                if (in_array($key, ['is_main_street', 'is_side_street', 'inside_residential_complex', 'inside_residential_area'])) {
                    $oldValue = (bool) $oldValue ? 'نعم' : 'لا';
                    $newValue = (bool) $newValue ? 'نعم' : 'لا';
                }
                
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }

            // Only log if there were actual user changes
            if (!empty($changes)) {
                ActivityLog::log('update', "تم تعديل بيانات العميل: {$customer->commercial_name}", $customer, $changes);
            }
        }
    }

    /**
     * Handle the Customer "deleted" event.
     */
    public function deleted(Customer $customer): void
    {
        if (auth()->check()) {
            ActivityLog::log('delete', "تم حذف العميل: {$customer->commercial_name}", $customer);
        }
    }
}
