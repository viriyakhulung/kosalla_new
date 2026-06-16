<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Cabang (sub-unit organisasi). Tidak ada FK di DB; relasi cukup nama kolom.
 * Hard delete (tanpa SoftDeletes) agar code bisa dipakai ulang.
 */
class Branch extends Model
{
    public const STATUS_ACTIVE   = 'active';
    public const STATUS_INACTIVE = 'inactive';

    public const STATUSES = [self::STATUS_ACTIVE, self::STATUS_INACTIVE];

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'address',
        'status',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class, 'branch_id');
    }
}
