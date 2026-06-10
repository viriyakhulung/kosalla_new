<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterRole;

class MasterRoleController extends Controller
{
    public function index()
    {
        return MasterRole::query()->orderBy('id')->get();
    }
}
