<?php
// kosalla-api/app/Http/Controllers/Api/PortalUserArticleController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PortalUserArticleController extends Controller
{
    private function resolveOrgId(Request $request): int
    {
        $user = $request->user();
        $roleId = (int) ($user->master_role_id ?? 0);

        // superadmin (1) wajib tentukan org_id kalau endpoint butuh konteks org
        if ($roleId === 1) {
            $reqOrg = (int) $request->query('org_id', 0);
            if ($reqOrg <= 0) {
                abort(response()->json([
                    'message' => 'Superadmin wajib memilih org_id (contoh: ?org_id=6)'
                ], 422));
            }
            return $reqOrg;
        }

        if (!$user?->organization_id) {
            abort(response()->json(['message' => 'User belum punya organization_id'], 422));
        }

        $orgId = (int) $user->organization_id;

        // viriyastaff (2) boleh override org via ?org_id=
        if ($roleId === 2) {
            $reqOrg = (int) $request->query('org_id', 0);
            if ($reqOrg > 0) $orgId = $reqOrg;
        }

        return $orgId;
    }

    private function ownedMasterProductIds(int $orgId): array
    {
        return DB::table('master_products as mp')
            ->join('inventory_items as ii', function ($join) {
                $join->whereRaw("LOWER(TRIM(ii.name)) = LOWER(TRIM(mp.name))");
            })
            ->where('ii.organization_id', $orgId)
            ->where('ii.is_active', true)
            ->distinct()
            ->pluck('mp.id')
            ->map(fn ($v) => (int) $v)
            ->values()
            ->all();
    }

    private function isInternal(Request $request): bool
    {
        $roleId = (int) $request->user()->master_role_id;
        return in_array($roleId, [1, 2], true); // superadmin, viriyastaff
    }

    private function canCreate(Request $request): bool
    {
        return (bool) ($request->user()->can_create ?? false);
    }

    private function canReview(Request $request): bool
    {
        return (bool) ($request->user()->can_review ?? false);
    }

    private function canPublish(Request $request): bool
    {
        return (bool) ($request->user()->can_publish ?? false);
    }

    private function isInternalPublisher(Request $request): bool
    {
        return $this->isInternal($request) && $this->canPublish($request);
    }

    /**
     * ======================================================
     * KB Sync Helpers
     * ======================================================
     */
    private function makeKbSlug(string $title, int $userArticleId): string
    {
        $base = Str::slug($title);
        if ($base === '') $base = 'article';
        return $base . '-' . $userArticleId; // deterministic + unique
    }

    private function upsertKbFromUserArticle(object $ua, int $publisherId, $now): void
    {
        $slug = $this->makeKbSlug((string) $ua->title, (int) $ua->id);

        DB::table('kb_articles')->upsert(
            [[
                'source_user_article_id' => (int) $ua->id,
                'product_id' => (int) $ua->product_id,
                'title' => (string) $ua->title,
                'slug' => $slug,
                'body_html' => (string) $ua->body_html,
                'applies_to_version' => null,
                'status' => 'published',

                'reviewed_at' => $ua->reviewed_at,
                'reviewed_by' => $ua->reviewed_by,

                'published_at' => $now,
                'published_by' => $publisherId,

                'created_by' => $ua->created_by,
                'created_at' => $ua->created_at ?? $now,
                'updated_at' => $now,
            ]],
            ['source_user_article_id'],
            [
                'product_id',
                'title',
                'slug',
                'body_html',
                'status',
                'reviewed_at',
                'reviewed_by',
                'published_at',
                'published_by',
                'updated_at',
            ]
        );
    }

    private function updateKbPreserveSlug(int $userArticleId, int $productId, string $title, string $bodyHtml, $now): void
    {
        $kb = DB::table('kb_articles')
            ->where('source_user_article_id', $userArticleId)
            ->first();

        if ($kb) {
            DB::table('kb_articles')
                ->where('id', (int) $kb->id)
                ->update([
                    'product_id' => $productId,
                    'title' => $title,
                    'body_html' => $bodyHtml,
                    'status' => 'published',
                    'updated_at' => $now,
                ]);
            return;
        }

        $slug = $this->makeKbSlug($title, $userArticleId);

        DB::table('kb_articles')->insert([
            'source_user_article_id' => $userArticleId,
            'product_id' => $productId,
            'title' => $title,
            'slug' => $slug,
            'body_html' => $bodyHtml,
            'applies_to_version' => null,
            'status' => 'published',
            'published_at' => $now,
            'published_by' => null,
            'created_by' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function archiveKbByUserArticleId(int $userArticleId, $now): void
    {
        DB::table('kb_articles')
            ->where('source_user_article_id', $userArticleId)
            ->update([
                'status' => 'archived',
                'published_at' => null,
                'updated_at' => $now,
            ]);
    }

    /**
     * ======================================================
     * INDEX (List)
     * ======================================================
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $mine         = (int) $request->query('mine', 0) === 1;
        $orgDrafts    = (int) $request->query('org_drafts', 0) === 1;
        $orgAll       = (int) $request->query('org_all', 0) === 1;
        $readyPublish = (int) $request->query('ready_publish', 0) === 1;
        $reviewedByMe = (int) $request->query('reviewed_by_me', 0) === 1;

        $qText = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('status', ''));
        $productId = (int) $request->query('product_id', 0);

        $q = DB::table('user_articles as a')
            ->leftJoin('organizations as o', 'o.id', '=', 'a.organization_id')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'a.product_id')
            ->leftJoin('users as cu', 'cu.id', '=', 'a.created_by')
            ->leftJoin('users as pu', 'pu.id', '=', 'a.published_by')
            ->select([
                'a.id',
                'a.organization_id',
                'o.name as organization_name',
                'a.product_id',
                'mp.name as product_name',
                'a.title',
                'a.status',
                'a.submitted_at',
                'a.reviewer_id',
                'a.reviewed_at',
                'a.reviewed_by',
                'a.rejected_at',
                'a.rejected_by',
                'a.rejected_reason',
                'a.published_at',
                'a.published_by',
                'pu.email as published_by_email',
                'a.created_by',
                'cu.email as created_by_email',
                'a.created_at',
                'a.updated_at',
            ]);

        if ($readyPublish) {
            if (!$this->isInternal($request) || !$this->canPublish($request)) {
                return response()->json(['message' => 'Forbidden (publisher only)'], 403);
            }

            $q->where('a.status', 'review')
                ->whereNotNull('a.reviewed_at')
                ->whereNull('a.published_at')
                ->orderByDesc('a.reviewed_at');
        } elseif ($reviewedByMe) {
            if (!$this->canReview($request)) {
                return response()->json(['message' => 'Forbidden (reviewer only)'], 403);
            }

            $q->where(function ($w) use ($user) {
                $w->where('a.reviewed_by', $user->id)
                    ->orWhere('a.rejected_by', $user->id);
            })
                ->orderByDesc(DB::raw("COALESCE(a.reviewed_at, a.rejected_at, a.updated_at)"));
        } elseif ($orgDrafts) {
            if (
                !$this->isInternal($request) ||
                (!$this->canReview($request) && !$this->canPublish($request))
            ) {
                return response()->json(['message' => 'Forbidden (internal reviewer/publisher only)'], 403);
            }

            $orgId = $this->resolveOrgId($request);

            $q->where('a.organization_id', $orgId)
                ->whereIn('a.status', ['draft', 'rejected'])
                ->orderByDesc('a.updated_at');

            if ($status !== '' && in_array($status, ['draft', 'rejected'], true)) {
                $q->where('a.status', $status);
            }
        } elseif ($orgAll) {
            if (
                !$this->isInternal($request) ||
                (!$this->canReview($request) && !$this->canPublish($request))
            ) {
                return response()->json(['message' => 'Forbidden (internal only)'], 403);
            }

            $orgId = $this->resolveOrgId($request);

            $q->where('a.organization_id', $orgId)
                ->orderByDesc('a.updated_at');

            if ($status !== '' && in_array($status, ['draft', 'review', 'published', 'rejected'], true)) {
                $q->where('a.status', $status);
            }
        } elseif ($mine) {
            $orgId = $this->resolveOrgId($request);

            $q->where('a.organization_id', $orgId)
                ->where('a.created_by', $user->id);

            if ($status !== '' && in_array($status, ['draft', 'review', 'published', 'rejected'], true)) {
                $q->where('a.status', $status);
            }

            $q->orderByDesc('a.updated_at');
        } else {
            // Reader (published) untuk org + entitlement produk
            $orgId = $this->resolveOrgId($request);
            $ownedProductIds = $this->ownedMasterProductIds($orgId);

            $q->where('a.organization_id', $orgId)
                ->where('a.status', 'published')
                ->whereNotNull('a.published_at');

            if (!empty($ownedProductIds)) {
                $q->whereIn('a.product_id', $ownedProductIds);
            } else {
                $q->whereRaw('1=0');
            }

            $q->orderByDesc('a.published_at');
        }

        if ($qText !== '') {
            $q->where('a.title', 'ilike', '%' . $qText . '%');
        }
        if ($productId > 0) {
            $q->where('a.product_id', $productId);
        }

        return response()->json($q->paginate($perPage));
    }

    /**
     * ======================================================
     * SHOW (Detail)
     * ======================================================
     */
    public function show(Request $request, int $id)
    {
        $user = $request->user();

        $isInternalPower = $this->isInternal($request) && ($this->canReview($request) || $this->canPublish($request));

        $q = DB::table('user_articles as a')
            ->leftJoin('organizations as o', 'o.id', '=', 'a.organization_id')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'a.product_id')
            ->leftJoin('users as cu', 'cu.id', '=', 'a.created_by')
            ->leftJoin('users as pu', 'pu.id', '=', 'a.published_by')
            ->where('a.id', $id);

        if (!$isInternalPower) {
            $orgId = $this->resolveOrgId($request);
            $q->where('a.organization_id', $orgId);
        }

        $row = $q->first([
            'a.*',
            'o.name as organization_name',
            'mp.name as product_name',
            'cu.email as created_by_email',
            'pu.email as published_by_email',
        ]);

        if (!$row) return response()->json(['message' => 'Not found'], 404);

        $mine = ((int) $row->created_by === (int) $user->id);

        $isPublisher = $this->isInternal($request) && $this->canPublish($request);

        $isReviewer =
            $this->canReview($request) &&
            (
                (
                    $row->status === 'review'
                    && !$row->reviewed_at
                    && ((is_null($row->reviewer_id)) || (int)$row->reviewer_id === (int)$user->id)
                    && (int)$row->created_by !== (int)$user->id
                )
                || ((int)($row->reviewed_by ?? 0) === (int)$user->id)
                || ((int)($row->rejected_by ?? 0) === (int)$user->id)
                || ((int)($row->reviewer_id ?? 0) === (int)$user->id)
            );

        if (!$mine && !$isReviewer && !$isPublisher) {
            if ($row->status !== 'published') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $orgId = $this->resolveOrgId($request);
            $ownedProductIds = $this->ownedMasterProductIds($orgId);
            if (!in_array((int) $row->product_id, $ownedProductIds, true)) {
                return response()->json(['message' => 'Forbidden (product not owned)'], 403);
            }
        }

        return response()->json($row);
    }

    /**
     * ======================================================
     * STORE
     * ======================================================
     */
    public function store(Request $request)
    {
        if (!$this->canCreate($request)) {
            return response()->json(['message' => 'Forbidden (can_create=false)'], 403);
        }

        $user = $request->user();
        $orgId = $this->resolveOrgId($request);

        $data = $request->validate([
            'product_id' => 'required|integer|exists:master_products,id',
            'title' => 'required|string|max:255',
            'body_html' => 'required|string',
        ]);

        if (!$this->isInternal($request)) {
            $ownedProductIds = $this->ownedMasterProductIds($orgId);
            if (!in_array((int) $data['product_id'], $ownedProductIds, true)) {
                return response()->json(['message' => 'Produk tidak dimiliki organisasi ini'], 422);
            }
        }

        $now = now();

        $id = DB::table('user_articles')->insertGetId([
            'organization_id' => $orgId,
            'product_id' => (int) $data['product_id'],
            'title' => $data['title'],
            'body_html' => $data['body_html'],
            'status' => 'draft',
            'created_by' => $user->id,
            'updated_by' => $user->id,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return response()->json(['id' => $id, 'message' => 'OK'], 201);
    }

    /**
     * ======================================================
     * UPDATE (draft/rejected/review-not-approved)
     * - author boleh edit draft miliknya
     * - internal publisher boleh edit draft user lain (agar tidak perlu login mentor)
     * ======================================================
     */
    public function update(Request $request, int $id)
    {
        $user = $request->user();
        $internalPublisher = $this->isInternalPublisher($request);

        if (!$this->canCreate($request) && !$internalPublisher) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $orgId = $this->resolveOrgId($request);

        $current = DB::table('user_articles')
            ->where('id', $id)
            ->where('organization_id', $orgId)
            ->first();

        if (!$current) return response()->json(['message' => 'Not found'], 404);

        if ((int) $current->created_by !== (int) $user->id && !$internalPublisher) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $status = strtolower((string) ($current->status ?? ''));

        if (!in_array($status, ['draft', 'rejected', 'review'], true)) {
            return response()->json(['message' => 'Hanya draft/rejected/review yang bisa di-edit'], 422);
        }

        if ($status === 'review' && !is_null($current->reviewed_at)) {
            return response()->json(['message' => 'Artikel sudah di-approve reviewer. Tidak bisa di-edit.'], 422);
        }

        if (!is_null($current->published_at)) {
            return response()->json(['message' => 'Artikel sudah published. Tidak bisa di-edit.'], 422);
        }

        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'body_html' => 'nullable|string',
        ]);

        $now = now();

        $update = [
            'updated_at' => $now,
            'updated_by' => $user->id,
        ];

        foreach (['title', 'body_html'] as $k) {
            if (array_key_exists($k, $data)) $update[$k] = $data[$k];
        }

        // rejected -> auto balik review
        if ($status === 'rejected') {
            $hasReviewer = DB::table('users')
                ->whereIn('master_role_id', [1, 2])
                ->where('can_review', true)
                ->where('id', '<>', (int)$current->created_by)
                ->exists();

            if (!$hasReviewer) {
                return response()->json([
                    'message' => 'Belum ada user internal yang can_review=true. Admin wajib set reviewer di tab Access.'
                ], 422);
            }

            $update['status'] = 'review';
            $update['reviewer_id'] = null;
            $update['submitted_at'] = $now;

            $update['reviewed_at'] = null;
            $update['reviewed_by'] = null;

            $update['rejected_at'] = null;
            $update['rejected_by'] = null;
            $update['rejected_reason'] = null;
        }

        // edit saat review (belum approved) -> lepas claim + bump submitted
        if ($status === 'review') {
            $update['reviewer_id'] = null;
            $update['submitted_at'] = $now;

            $update['reviewed_at'] = null;
            $update['reviewed_by'] = null;

            $update['rejected_at'] = null;
            $update['rejected_by'] = null;
            $update['rejected_reason'] = null;
        }

        DB::table('user_articles')->where('id', $id)->update($update);

        return response()->json(['message' => 'OK']);
    }

    /**
     * ======================================================
     * SUBMIT REVIEW
     * - author boleh submit draft miliknya
     * - internal publisher boleh submit draft user lain
     * ======================================================
     */
    public function submitReview(Request $request, int $id)
    {
        $user = $request->user();
        $internalPublisher = $this->isInternalPublisher($request);

        if (!$this->canCreate($request) && !$internalPublisher) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $orgId = $this->resolveOrgId($request);

        $article = DB::table('user_articles')
            ->where('id', $id)
            ->where('organization_id', $orgId)
            ->first();

        if (!$article) return response()->json(['message' => 'Not found'], 404);

        if ((int) $article->created_by !== (int) $user->id && !$internalPublisher) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!in_array($article->status, ['draft', 'rejected'], true)) {
            return response()->json(['message' => 'Status tidak valid untuk submit review'], 422);
        }

        $hasReviewer = DB::table('users')
            ->whereIn('master_role_id', [1, 2])
            ->where('can_review', true)
            ->where('id', '<>', (int)$article->created_by)
            ->exists();

        if (!$hasReviewer) {
            return response()->json([
                'message' => 'Belum ada user internal yang can_review=true. Admin wajib set reviewer di tab Access.'
            ], 422);
        }

        $now = now();

        DB::table('user_articles')->where('id', $id)->update([
            'status' => 'review',
            'reviewer_id' => null,
            'submitted_at' => $now,

            'reviewed_at' => null,
            'reviewed_by' => null,

            'rejected_at' => null,
            'rejected_by' => null,
            'rejected_reason' => null,

            'updated_at' => $now,
            'updated_by' => $user->id,
        ]);

        return response()->json(['message' => 'OK']);
    }

    /**
     * ======================================================
     * PUBLISH (full access auto approve + publish)
     * ======================================================
     */
    public function publish(Request $request, int $id)
    {
        $user = $request->user();

        // publisher only
        if (!$this->isInternal($request) || !$this->canPublish($request)) {
            return response()->json(['message' => 'Forbidden (publisher only)'], 403);
        }

        $article = DB::table('user_articles')->where('id', $id)->first();
        if (!$article) return response()->json(['message' => 'Not found'], 404);

        $status = strtolower((string) ($article->status ?? ''));

        if ($article->published_at) {
            return response()->json(['message' => 'Artikel sudah published'], 422);
        }

        if ($status === 'rejected' || $article->rejected_at) {
            return response()->json(['message' => 'Artikel ditolak, tidak bisa publish'], 422);
        }

        $now = now();

        if ($status === 'draft') {
            if (!$this->canReview($request)) {
                return response()->json([
                    'message' => 'Draft harus Submit Review dulu (hanya full-access yang bisa publish langsung).'
                ], 422);
            }

            if ((int) $article->created_by !== (int) $user->id) {
                return response()->json(['message' => 'Draft hanya boleh dipublish oleh author-nya'], 403);
            }

            DB::table('user_articles')->where('id', $id)->update([
                'status' => 'published',

                'reviewer_id' => $user->id,
                'submitted_at' => $article->submitted_at ?? $now,
                'reviewed_at' => $now,
                'reviewed_by' => $user->id,

                'published_at' => $now,
                'published_by' => $user->id,

                'rejected_at' => null,
                'rejected_by' => null,
                'rejected_reason' => null,

                'updated_at' => $now,
                'updated_by' => $user->id,
            ]);
        } elseif ($status === 'review') {
            if (!$article->reviewed_at) {
                return response()->json(['message' => 'Artikel belum di-approve reviewer'], 422);
            }

            DB::table('user_articles')->where('id', $id)->update([
                'status' => 'published',
                'published_at' => $now,
                'published_by' => $user->id,
                'updated_at' => $now,
                'updated_by' => $user->id,
            ]);
        } else {
            return response()->json(['message' => 'Status tidak valid untuk publish'], 422);
        }

        $fresh = DB::table('user_articles')->where('id', $id)->first();

        $kbSynced = true;
        $kbError = null;

        try {
            if ($fresh) {
                $this->upsertKbFromUserArticle($fresh, (int) $user->id, $now);
            }
        } catch (\Throwable $e) {
            $kbSynced = false;
            $kbError = $e->getMessage();
            Log::error("KB sync failed on publish user_article_id={$id}: {$kbError}");
        }

        return response()->json([
            'message' => 'OK',
            'kb_synced' => $kbSynced,
            'kb_error' => $kbError,
        ]);
    }

    /**
     * ======================================================
     * UPDATE PUBLISHED
     * ======================================================
     */
    public function updatePublished(Request $request, int $id)
    {
        $user = $request->user();

        if (!$this->isInternal($request) || !$this->canPublish($request)) {
            return response()->json(['message' => 'Forbidden (publisher only)'], 403);
        }

        $article = DB::table('user_articles')->where('id', $id)->first();
        if (!$article) return response()->json(['message' => 'Not found'], 404);

        if ($article->status !== 'published' || !$article->published_at) {
            return response()->json(['message' => 'Hanya artikel published yang bisa di-edit via endpoint ini'], 422);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body_html' => 'required|string',
        ]);

        $now = now();

        DB::table('user_articles')->where('id', $id)->update([
            'title' => $data['title'],
            'body_html' => $data['body_html'],
            'updated_at' => $now,
            'updated_by' => $user->id,
        ]);

        $this->updateKbPreserveSlug(
            (int) $id,
            (int) $article->product_id,
            (string) $data['title'],
            (string) $data['body_html'],
            $now
        );

        return response()->json(['message' => 'OK']);
    }

    /**
     * ======================================================
     * DESTROY (hard delete)
     * - draft/rejected: author OR internal publisher
     * - published/archived: publisher only + delete kb_articles
     * ======================================================
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $internalPublisher = $this->isInternalPublisher($request);

        $article = DB::table('user_articles')->where('id', $id)->first();
        if (!$article) return response()->json(['message' => 'Not found'], 404);

        $status = strtolower((string) ($article->status ?? ''));

        // CASE A: draft/rejected hard delete (author OR internal publisher)
        if (in_array($status, ['draft', 'rejected'], true) && is_null($article->published_at)) {
            $orgId = $this->resolveOrgId($request);
            if ((int) $article->organization_id !== (int) $orgId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $isOwner = ((int) $article->created_by === (int) $user->id);

            if (!$isOwner && !$internalPublisher) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            // owner but can_create must be true; internalPublisher bypass can_create
            if ($isOwner && !$this->canCreate($request) && !$internalPublisher) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            DB::transaction(function () use ($id) {
                DB::table('kb_articles')
                    ->where('source_user_article_id', $id)
                    ->delete();

                DB::table('user_articles')
                    ->where('id', $id)
                    ->delete();
            });

            return response()->json(['message' => 'OK']);
        }

        // CASE B: published/archived hard delete (publisher only)
        if (!$this->isInternal($request) || !$this->canPublish($request)) {
            return response()->json(['message' => 'Forbidden (publisher only)'], 403);
        }

        if (!in_array($status, ['published', 'archived'], true)) {
            return response()->json(['message' => 'Hanya artikel published/archived yang bisa dihapus permanen'], 422);
        }

        DB::transaction(function () use ($id) {
            DB::table('kb_articles')
                ->where('source_user_article_id', $id)
                ->delete();

            DB::table('user_articles')
                ->where('id', $id)
                ->delete();
        });

        return response()->json(['message' => 'OK']);
    }
}