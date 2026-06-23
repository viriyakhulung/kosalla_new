<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MasterProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'product_type',
        'is_active',
        'team_group_id',
    ];

    /**
     * Team PIC produk (mapping 1:1). Tanpa FK DB-level — integritas app-layer.
     */
    public function teamGroup(): BelongsTo
    {
        return $this->belongsTo(TeamGroup::class, 'team_group_id');
    }
}
