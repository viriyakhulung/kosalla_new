<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserArticleAccessController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->whereIn('master_role_id', [1, 2]) // internal
            ->select(['id', 'name', 'email', 'master_role_id', 'can_create', 'can_review', 'can_publish'])
            ->orderBy('email')
            ->get();

        return response()->json(['data' => $users]);
    }

    public function upsert(Request $request)
    {
        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'mode' => ['required', 'string', 'in:none,create_only,review_only,publish_only,create_publish,create_review_publish'],
        ]);

        $user = User::findOrFail($request->user_id);

        if (!in_array((int)$user->master_role_id, [1, 2], true)) {
            return response()->json(['message' => 'Target user harus role internal (1/2)'], 422);
        }

        $mode = $request->mode;

        $payload = match ($mode) {
            'create_only'   => ['can_create' => true,  'can_review' => false, 'can_publish' => false],
            'review_only'   => ['can_create' => false, 'can_review' => true,  'can_publish' => false],
            'publish_only'  => ['can_create' => false, 'can_review' => false, 'can_publish' => true],
            'create_publish'=> ['can_create' => true,  'can_review' => false, 'can_publish' => true],
            'create_review_publish' => ['can_create' => true,  'can_review' => true,  'can_publish' => true],
            default         => ['can_create' => false, 'can_review' => false, 'can_publish' => false],
        };

        $user->update($payload);

        return response()->json(['ok' => true]);
    }
}
