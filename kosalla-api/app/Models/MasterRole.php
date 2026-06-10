<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterRole extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'master_role_id');
    }
}
