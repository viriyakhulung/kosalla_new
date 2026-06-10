<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'description',
        'is_active',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
