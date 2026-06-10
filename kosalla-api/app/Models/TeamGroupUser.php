<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class TeamGroupUser extends Pivot
{
    protected $table = 'team_group_user';

    public $incrementing = false;

    protected $primaryKey = null;

    protected $fillable = [
        'team_group_id',
        'user_id',
        'role',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public const VALID_ROLES = [
        'engineer-staff',
        'engineer-manager',
        'team-lead',
    ];
}
