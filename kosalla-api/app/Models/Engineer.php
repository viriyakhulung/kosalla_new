<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Engineer extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'level',
        'phone',
        'is_active',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
