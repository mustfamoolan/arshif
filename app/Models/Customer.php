<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'commercial_name',
        'latitude',
        'longitude',
        'location_address',
        'is_main_street',
        'is_side_street',
        'inside_residential_complex',
        'inside_residential_area',
        'nearest_landmark',
        'customer_area',
        'estimated_area',
        'trust_items',
        'trust_code',
        'sign_type',
        'phone',
        'refrigerator_photo',
        'status',
        'classification',
        'created_by',
        'district',
    ];

    protected $casts = [
        'is_main_street' => 'boolean',
        'is_side_street' => 'boolean',
        'inside_residential_complex' => 'boolean',
        'inside_residential_area' => 'boolean',
        'trust_items' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    /**
     * Get the user who created this customer record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Accessor for refrigerator_photo: always returns an array.
     */
    public function getRefrigeratorPhotoAttribute($value)
    {
        if (empty($value)) {
            return [];
        }
        
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        return [$value];
    }

    /**
     * Mutator for refrigerator_photo: serializes arrays to JSON.
     */
    public function setRefrigeratorPhotoAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['refrigerator_photo'] = json_encode($value);
        } else {
            $this->attributes['refrigerator_photo'] = $value;
        }
    }
}
