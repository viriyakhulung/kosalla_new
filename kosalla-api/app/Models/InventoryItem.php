<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $table = 'inventory_items';

    protected $fillable = [
        'organization_id',
        'master_product_id',
        'name',
        'product_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function masterProduct()
    {
        return $this->belongsTo(MasterProduct::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'inventory_item_id');
    }
}
