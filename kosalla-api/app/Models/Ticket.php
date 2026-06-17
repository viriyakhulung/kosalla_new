<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'organization_id',
        'location_id',
        'team_group_id',
        'assigned_to',
        'inventory_item_id',
        'created_by',
        'ticket_number',
        'subject',
        'category',
        'description_html',
        'priority',
        'status',
        'tagging_word',
        'requested_resolution_date',
        'expected_date',
        'action_number',
        'version',
        'build_no',
        'patch_no',
        'module',
        'error_code',
        'severity',
        'project',
        'customer',
        'complete_ps',
        'schedule_comment',
        'last_activity_at',
        'resolved_at',
        'closed_at',
        'closed_by',
    ];

    protected $casts = [
        'requested_resolution_date' => 'date',
        'expected_date' => 'date',
        'complete_ps' => 'boolean',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function teamGroup(): BelongsTo
    {
        return $this->belongsTo(TeamGroup::class, 'team_group_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    /**
     * Cabang asal tiket — diturunkan dari lokasi (ticket → location → branch).
     * Tidak ada kolom branch_id di tickets; satu sumber kebenaran = location.
     * Eager-load berantai `with('location.branch')` agar tidak N+1.
     */
    public function getBranchAttribute()
    {
        return $this->location?->branch;
    }
}
