<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterRole;
use Illuminate\Support\Facades\Cache;

class MasterRoleController extends Controller
{
    public function index()
    {
        // Master data statis → cache list (hindari query tiap request dropdown).
        // Jika master role berubah, panggil Cache::forget('master_roles_all').
        return Cache::rememberForever('master_roles_all', fn () => MasterRole::query()->orderBy('id')->get());
    }
}
