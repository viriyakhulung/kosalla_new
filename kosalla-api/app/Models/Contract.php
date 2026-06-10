<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'organization_id',
        'contract_number',
        'start_date',
        'end_date',
        'status',
        'reminder_days_before_end',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
