<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminUserArticleReviewerController extends Controller
{
    // GET /api/admin/user-article-reviewers?product_id=&org_id=&q=
    public function index(Request $request)
    {
        $productId = $request->query('product_id');
        $orgId = $request->query('org_id');
        $q = trim((string) $request->query('q', ''));

        $query = DB::table('user_article_reviewer_assignments as a')
            ->leftJoin('organizations as o', 'o.id', '=', 'a.organization_id')
            ->join('master_products as mp', 'mp.id', '=', 'a.product_id')
            ->join('users as u', 'u.id', '=', 'a.reviewer_user_id')
            ->select([
                'a.id',
                'a.organization_id',
                'o.name as organization_name',
                'a.product_id',
                'mp.name as product_name',
                'a.reviewer_user_id',
                'u.name as reviewer_name',
                'u.email as reviewer_email',
                'a.created_at',
                'a.updated_at',
            ])
            ->orderByRaw('a.organization_id nulls first')
            ->orderBy('mp.name', 'asc');

        if ($productId) $query->where('a.product_id', (int) $productId);
        if ($orgId !== null && $orgId !== '') $query->where('a.organization_id', (int) $orgId);

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('u.email', 'ilike', "%{$q}%")
                  ->orWhere('u.name', 'ilike', "%{$q}%")
                  ->orWhere('mp.name', 'ilike', "%{$q}%")
                  ->orWhere('o.name', 'ilike', "%{$q}%");
            });
        }

        return response()->json($query->get());
    }

    // POST /api/admin/user-article-reviewers
    // body: { organization_id?: number|null, product_id: number, reviewer_user_id?: number, reviewer_email?: string }
    public function store(Request $request)
    {
        $data = $request->validate([
            'organization_id' => 'nullable|integer|exists:organizations,id',
            'product_id' => 'required|integer|exists:master_products,id',
            'reviewer_user_id' => 'nullable|integer|exists:users,id',
            'reviewer_email' => 'nullable|email',
        ]);

        $reviewerId = $data['reviewer_user_id'] ?? null;

        if (!$reviewerId) {
            if (empty($data['reviewer_email'])) {
                return response()->json(['message' => 'reviewer_user_id atau reviewer_email wajib diisi'], 422);
            }

            $u = DB::table('users')->where('email', $data['reviewer_email'])->first(['id']);
            if (!$u) {
                return response()->json(['message' => 'Reviewer email tidak ditemukan di users'], 422);
            }
            $reviewerId = (int) $u->id;
        }

        $now = now();

        // upsert per (organization_id, product_id)
        DB::table('user_article_reviewer_assignments')->updateOrInsert(
            [
                'organization_id' => $data['organization_id'] ?? null,
                'product_id' => (int) $data['product_id'],
            ],
            [
                'reviewer_user_id' => $reviewerId,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        return response()->json(['message' => 'OK']);
    }

    // PUT/PATCH /api/admin/user-article-reviewers/{id}
    public function update(Request $request, int $id)
    {
        $exists = DB::table('user_article_reviewer_assignments')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Not found'], 404);

        $data = $request->validate([
            'organization_id' => 'nullable|integer|exists:organizations,id',
            'product_id' => 'nullable|integer|exists:master_products,id',
            'reviewer_user_id' => 'nullable|integer|exists:users,id',
            'reviewer_email' => 'nullable|email',
        ]);

        $reviewerId = $data['reviewer_user_id'] ?? null;

        if (!$reviewerId && !empty($data['reviewer_email'])) {
            $u = DB::table('users')->where('email', $data['reviewer_email'])->first(['id']);
            if (!$u) return response()->json(['message' => 'Reviewer email tidak ditemukan di users'], 422);
            $reviewerId = (int) $u->id;
        }

        $update = ['updated_at' => now()];
        foreach (['organization_id', 'product_id'] as $k) {
            if (array_key_exists($k, $data)) $update[$k] = $data[$k];
        }
        if ($reviewerId) $update['reviewer_user_id'] = $reviewerId;

        DB::table('user_article_reviewer_assignments')->where('id', $id)->update($update);

        return response()->json(['message' => 'OK']);
    }

    // DELETE /api/admin/user-article-reviewers/{id}
    public function destroy(int $id)
    {
        $deleted = DB::table('user_article_reviewer_assignments')->where('id', $id)->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['message' => 'OK']);
    }
}
