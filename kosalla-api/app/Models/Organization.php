<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str; 

class Organization extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'contact_email', 'phone', 'address', 'is_active'
    ];

    public function productTypes()
{
    return $this->hasMany(ProductType::class);
}
public function inventoryItems()
{
    return $this->hasMany(\App\Models\InventoryItem::class);
}

    protected static function booted(): void
    {
        static::creating(function (Organization $org) {
            if (empty($org->slug)) {
                $base = Str::slug($org->name);

                // Cek apakah slug sudah ada, jika ada tambahkan angka
                $slug = $base;
                $i = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = "{$base}-{$i}";
                    $i++;
                }

                $org->slug = $slug;
            }
        });

        static::updating(function (Organization $org) {
            // Jika nama berubah, slug ikut berubah
            if ($org->isDirty('name')) {
                $base = Str::slug($org->name);

                $slug = $base;
                $i = 1;
                // Cek unik tapi kecualikan diri sendiri (id != $org->id)
                while (static::where('slug', $slug)->where('id', '!=', $org->id)->exists()) {
                    $slug = "{$base}-{$i}";
                    $i++;
                }

                $org->slug = $slug;
            }
        });
    }

 

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}