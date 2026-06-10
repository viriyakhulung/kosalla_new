<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'organization_id',
        'location_id',
        'master_role_id',

        // ✅ User Article access flags
        'can_create',
        'can_review',
        'can_publish',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'can_create' => 'boolean',
        'can_review' => 'boolean',
        'can_publish' => 'boolean',
    ];

    public function masterRole()
    {
        return $this->belongsTo(\App\Models\MasterRole::class, 'master_role_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function teamGroups()
    {
        return $this->belongsToMany(\App\Models\TeamGroup::class, 'team_group_user')
            ->withTimestamps();
    }

    public function engineer()
    {
        return $this->hasOne(\App\Models\Engineer::class);
    }

    public function ticketsCreated()
    {
        return $this->hasMany(\App\Models\Ticket::class, 'created_by');
    }

    public function createdTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'created_by');
    }

    public function assignedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assigned_to');
    }

    public function ticketReplies(): HasMany
    {
        return $this->hasMany(TicketReply::class);
    }
}
