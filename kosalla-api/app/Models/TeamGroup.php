<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'is_active',
        'organization_id',
        'handles_category',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function users()
    {
        return $this->belongsToMany(\App\Models\User::class, 'team_group_user')
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }
}
