<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    // Disable default timestamps since we only use created_at
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'log_type',
        'action',
        'subject_id',
        'subject_name',
        'description',
        'changes',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
    ];

    // Boot method to automatically set created_at on creation
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = now();
        });
    }

    /**
     * Get the user who performed the activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a log entry helper.
     */
    public static function log(string $action, string $description, $subject = null, ?array $changes = null): void
    {
        self::create([
            'user_id' => auth()->id(),
            'log_type' => $subject ? strtolower(class_basename($subject)) : 'general',
            'action' => $action,
            'subject_id' => $subject ? $subject->getKey() : null,
            'subject_name' => $subject ? ($subject->commercial_name ?? $subject->name ?? null) : null,
            'description' => $description,
            'changes' => $changes,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
