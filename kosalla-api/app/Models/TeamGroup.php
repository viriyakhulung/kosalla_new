<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    /**
     * organisation_attach_teams: organisasi yang meng-attach tim ini.
     */
    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(
            Organization::class,
            'organization_team_groups',
            'team_group_id',
            'organization_id'
        )->withTimestamps();
    }
}
