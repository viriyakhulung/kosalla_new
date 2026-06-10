<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PortalUserArticleReviewController extends Controller
{
    private function canReview(Request $request): bool
    {
        return (bool) ($request->user()->can_review ?? false);
    }

    // GET /api/portal/user-articles/review/queue?per_page=20
    public function queue(Request $request)
    {
        if (!$this->canReview($request)) {
            return response()->json(['message' => 'Forbidden (can_review=false)'], 403);
        }

        $user = $request->user();

        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $q = DB::table('user_articles as a')
            ->join('organizations as o', 'o.id', '=', 'a.organization_id')
            ->join('master_products as mp', 'mp.id', '=', 'a.product_id')
            ->join('users as cu', 'cu.id', '=', 'a.created_by')
            ->where('a.status', 'review')
            ->whereNull('a.reviewed_at')
            ->where(function ($w) use ($user) {
                $w->whereNull('a.reviewer_id')
                  ->orWhere('a.reviewer_id', $user->id);
            })
            ->where('a.created_by', '<>', $user->id) // anti self-review
            ->select([
                'a.id',
                'a.status', // ✅ FE butuh status
                'a.organization_id',
                'o.name as organization_name',
                'a.product_id',
                'mp.name as product_name',
                'a.title',
                'a.submitted_at',
                'a.reviewer_id',
                'a.created_by',
                'cu.email as created_by_email',
                'a.created_at',
                'a.updated_at',
            ])
            ->orderByDesc('a.submitted_at');

        return response()->json($q->paginate($perPage));
    }

    // POST /api/portal/user-articles/review/{id}/approve
    public function approve(Request $request, int $id)
    {
        if (!$this->canReview($request)) {
            return response()->json(['message' => 'Forbidden (can_review=false)'], 403);
        }

        $user = $request->user();
        $now = now();

        $affected = DB::table('user_articles')
            ->where('id', $id)
            ->where('status', 'review')
            ->whereNull('reviewed_at')
            ->where('created_by', '<>', $user->id)
            ->where(function ($w) use ($user) {
                $w->whereNull('reviewer_id')
                  ->orWhere('reviewer_id', $user->id);
            })
            ->update([
                'reviewer_id' => $user->id,
                'reviewed_at' => $now,
                'reviewed_by' => $user->id,
                'updated_at'  => $now,
                'updated_by'  => $user->id,
            ]);

        if ($affected === 0) {
            $article = DB::table('user_articles')->where('id', $id)->first();
            if (!$article) return response()->json(['message' => 'Not found'], 404);

            if ($article->status !== 'review' || $article->reviewed_at) {
                return response()->json(['message' => 'Status tidak valid untuk approve'], 422);
            }

            if ((int)$article->created_by === (int)$user->id) {
                return response()->json(['message' => 'Reviewer tidak boleh sama dengan author'], 422);
            }

            if ($article->reviewer_id !== null && (int)$article->reviewer_id !== (int)$user->id) {
                return response()->json(['message' => 'Artikel sudah di-claim reviewer lain'], 409);
            }

            return response()->json(['message' => 'Tidak bisa approve (unknown condition)'], 422);
        }

        return response()->json(['message' => 'OK']);
    }

    // POST /api/portal/user-articles/review/{id}/reject  body: { reason: "..." }
    public function reject(Request $request, int $id)
    {
        if (!$this->canReview($request)) {
            return response()->json(['message' => 'Forbidden (can_review=false)'], 403);
        }

        $user = $request->user();

        $data = $request->validate([
            'reason' => 'required|string|max:5000',
        ]);

        $now = now();

        $affected = DB::table('user_articles')
            ->where('id', $id)
            ->where('status', 'review')
            ->whereNull('reviewed_at')
            ->where('created_by', '<>', $user->id)
            ->where(function ($w) use ($user) {
                $w->whereNull('reviewer_id')
                  ->orWhere('reviewer_id', $user->id);
            })
            ->update([
                'reviewer_id'      => $user->id,
                'status'           => 'rejected',
                'rejected_at'      => $now,
                'rejected_by'      => $user->id,
                'rejected_reason'  => $data['reason'],
                'reviewed_at'      => null,
                'reviewed_by'      => null,
                'updated_at'       => $now,
                'updated_by'       => $user->id,
            ]);

        if ($affected === 0) {
            $article = DB::table('user_articles')->where('id', $id)->first();
            if (!$article) return response()->json(['message' => 'Not found'], 404);

            if ($article->status !== 'review' || $article->reviewed_at) {
                return response()->json(['message' => 'Status tidak valid untuk reject'], 422);
            }

            if ((int)$article->created_by === (int)$user->id) {
                return response()->json(['message' => 'Reviewer tidak boleh sama dengan author'], 422);
            }

            if ($article->reviewer_id !== null && (int)$article->reviewer_id !== (int)$user->id) {
                return response()->json(['message' => 'Artikel sudah di-claim reviewer lain'], 409);
            }

            return response()->json(['message' => 'Tidak bisa reject (unknown condition)'], 422);
        }

        return response()->json(['message' => 'OK']);
    }
}