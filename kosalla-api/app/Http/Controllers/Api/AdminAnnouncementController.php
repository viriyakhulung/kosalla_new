<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminAnnouncementController extends Controller
{
    // GET /api/admin/announcements?per_page=20&q=&scope=&product_id=
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $scope  = $request->query('scope'); // global|product
        $q      = trim((string) $request->query('q', ''));
        $productId = $request->query('product_id');

        $query = DB::table('kb_announcements as a')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'a.product_id')
            ->select([
                'a.id',
                'a.scope',
                'a.product_id',
                'mp.name as product_name',
                'a.title',
                'a.body_html',
                'a.status',
                'a.starts_at',
                'a.ends_at',
                'a.published_at',
                'a.created_by',
                'a.published_by',
                'a.created_at',
                'a.updated_at',
            ]);

        if ($scope && in_array($scope, ['global', 'product'], true)) {
            $query->where('a.scope', $scope);
        }

        if ($productId !== null && $productId !== '') {
            $query->where('a.product_id', (int) $productId);
        }

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('a.title', 'ilike', "%{$q}%")
                    ->orWhere('a.body_html', 'ilike', "%{$q}%");
            });
        }

        // ✅ sorting: newest first
        $query->orderByDesc('a.published_at')->orderByDesc('a.created_at');

        return response()->json($query->paginate($perPage));
    }

    // GET /api/admin/announcements/{announcement}
    public function show(int $announcement)
    {
        $row = DB::table('kb_announcements as a')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'a.product_id')
            ->where('a.id', $announcement)
            ->first([
                'a.*',
                'mp.name as product_name',
            ]);

        if (!$row) {
            return response()->json(['message' => 'Announcement tidak ditemukan'], 404);
        }

        return response()->json($row);
    }

    // POST /api/admin/announcements  (publish langsung)
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'scope'      => ['nullable', Rule::in(['global', 'product'])],
            'product_id' => ['nullable', 'integer', 'exists:master_products,id'],
            'title'      => ['required', 'string', 'max:255'],
            'body_html'  => ['required', 'string'],
            'starts_at'  => ['nullable', 'date'],
            'ends_at'    => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $now = now();

        $scope = $data['scope'] ?? null;
        $productId = $data['product_id'] ?? null;

        if (!$scope) {
            $scope = $productId ? 'product' : 'global';
        }

        if ($scope === 'global') {
            $productId = null;
        } else {
            if (!$productId) {
                return response()->json(['message' => 'product_id wajib untuk scope=product'], 422);
            }
        }

        $startsAt = $data['starts_at'] ?? null;
        $endsAt   = $data['ends_at'] ?? null;

        // ✅ normalize: date-only jadi range 1 hari penuh
        if ($startsAt) $startsAt = \Carbon\Carbon::parse($startsAt)->startOfDay();
        if ($endsAt)   $endsAt   = \Carbon\Carbon::parse($endsAt)->endOfDay();

        // ✅ auto 7 hari kalau starts_at diisi tapi ends_at kosong
        if ($startsAt && !$endsAt) {
            $endsAt = \Carbon\Carbon::parse($startsAt)->addDays(7)->endOfDay();
        }

        $id = DB::table('kb_announcements')->insertGetId([
            'scope'        => $scope,
            'product_id'   => $productId,
            'title'        => $data['title'],
            'body_html'    => $data['body_html'],

            'status'       => 'published',
            'reviewed_at'  => null,
            'reviewed_by'  => null,
            'published_at' => $now,
            'published_by' => $user->id,

            'starts_at'    => $startsAt,
            'ends_at'      => $endsAt,

            'created_by'   => $user->id,
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        return response()->json(['id' => $id, 'message' => 'OK'], 201);
    }

    // PUT /api/admin/announcements/{announcement}
    public function update(Request $request, int $announcement)
    {
        $current = DB::table('kb_announcements')->where('id', $announcement)->first();
        if (!$current) {
            return response()->json(['message' => 'Announcement tidak ditemukan'], 404);
        }

        $data = $request->validate([
            'scope'      => ['nullable', Rule::in(['global', 'product'])],
            'product_id' => ['nullable', 'integer', 'exists:master_products,id'],
            'title'      => ['nullable', 'string', 'max:255'],
            'body_html'  => ['nullable', 'string'],
            'starts_at'  => ['nullable', 'date'],
            'ends_at'    => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $now = now();

        $scope = $data['scope'] ?? $current->scope;
        $productId = array_key_exists('product_id', $data) ? $data['product_id'] : $current->product_id;

        if ($scope === 'global') {
            $productId = null;
        } else {
            if (!$productId) {
                return response()->json(['message' => 'product_id wajib untuk scope=product'], 422);
            }
        }

        $startsAt = array_key_exists('starts_at', $data) ? ($data['starts_at'] ?: null) : $current->starts_at;
        $endsAt   = array_key_exists('ends_at', $data) ? ($data['ends_at'] ?: null) : $current->ends_at;

        // ✅ normalize
        if ($startsAt) $startsAt = \Carbon\Carbon::parse($startsAt)->startOfDay();
        if ($endsAt)   $endsAt   = \Carbon\Carbon::parse($endsAt)->endOfDay();

        // ✅ auto 7 hari kalau starts_at ada tapi ends_at kosong
        if ($startsAt && !$endsAt) {
            $endsAt = \Carbon\Carbon::parse($startsAt)->addDays(7)->endOfDay();
        }

        $update = [
            'scope'      => $scope,
            'product_id' => $productId,
            'starts_at'  => $startsAt,
            'ends_at'    => $endsAt,
            'updated_at' => $now,
        ];

        foreach (['title', 'body_html'] as $k) {
            if (array_key_exists($k, $data)) $update[$k] = $data[$k];
        }

        $update['status'] = 'published';
        if (!$current->published_at) $update['published_at'] = $now;
        if (!$current->published_by) $update['published_by'] = $request->user()->id;

        DB::table('kb_announcements')->where('id', $announcement)->update($update);

        return response()->json(['message' => 'OK']);
    }

    // DELETE /api/admin/announcements/{announcement}
    public function destroy(int $announcement)
    {
        $deleted = DB::table('kb_announcements')->where('id', $announcement)->delete();
        if (!$deleted) {
            return response()->json(['message' => 'Announcement tidak ditemukan'], 404);
        }
        return response()->json(['message' => 'OK']);
    }
}