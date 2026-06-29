<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OwnedMasterProductService;
use App\Support\HtmlSanitizer;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PortalKbController extends Controller
{
    public function __construct(private OwnedMasterProductService $ownedProducts)
    {
    }

    private function resolveOrgId(Request $request): int
    {
        $user = $request->user();
        $roleId = (int) ($user->master_role_id ?? 0);

        // superadmin (1) wajib tentukan org_id
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

    /**
     * Produk yang dimiliki org (mapping inventory_items.name <-> master_products.name).
     */
    private function ownedMasterProductIds(int $orgId): array
    {
        return $this->ownedProducts->ownedMasterProductIds($orgId);
    }

    /**
     * GET /api/portal/kb/articles
     * Query:
     * - q, product_id, per_page, page
     * - (optional) org_id untuk internal/superadmin/viriyastaff
     */
    public function index(Request $request)
    {
        $orgId = $this->resolveOrgId($request);

        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $qText = trim((string) $request->query('q', ''));
        $productId = (int) $request->query('product_id', 0);

        $ownedProductIds = $this->ownedMasterProductIds($orgId);

        // kalau org belum punya produk aktif -> kosongkan
        if (empty($ownedProductIds)) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ]);
        }

        $q = DB::table('kb_articles as k')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'k.product_id')
            ->select([
                'k.id',
                'k.product_id',
                DB::raw('mp.name as product_name'),
                'k.title',
                'k.slug',
                'k.status',
                'k.published_at',
                // pastikan FE selalu punya tanggal untuk kolom "Updated"
                DB::raw('COALESCE(k.updated_at, k.published_at, k.created_at) as updated_at'),
            ])
            ->where('k.status', 'published')
            ->whereNotNull('k.published_at')
            ->whereIn('k.product_id', $ownedProductIds);

        if ($productId > 0) {
            $q->where('k.product_id', $productId);
        }

        if ($qText !== '') {
            $q->where('k.title', 'ilike', '%' . $qText . '%');
        }

        $q->orderByDesc('k.published_at');

        return response()->json($q->paginate($perPage));
    }

    /**
     * GET /api/portal/kb/articles/{slug}
     * Portal reader: hanya boleh lihat artikel published + produk dimiliki org.
     */
    public function show(Request $request, string $slug)
    {
        $orgId = $this->resolveOrgId($request);
        $ownedProductIds = $this->ownedMasterProductIds($orgId);

        $row = DB::table('kb_articles as k')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'k.product_id')
            ->where('k.slug', $slug)
            ->where('k.status', 'published')
            ->whereNotNull('k.published_at')
            ->first([
                'k.id',
                'k.product_id',
                DB::raw('mp.name as product_name'),
                'k.title',
                'k.slug',
                'k.body_html',
                'k.applies_to_version',
                'k.status',
                'k.published_at',
                DB::raw('COALESCE(k.updated_at, k.published_at, k.created_at) as updated_at'),
            ]);

        if (!$row) return response()->json(['message' => 'Not found'], 404);

        if (!in_array((int) $row->product_id, $ownedProductIds, true)) {
            return response()->json(['message' => 'Forbidden (product not owned)'], 403);
        }

        return response()->json($row);
    }

    /**
     * GET /api/portal/kb/articles/{slug}/export-pdf
     * Export 1 artikel Knowledge Base (published) ke PDF resmi Viriya.
     * Mengikuti pola permission/scoping yang sama dengan show().
     */
    public function exportPdf(Request $request, string $slug)
    {
        $orgId = $this->resolveOrgId($request);
        $ownedProductIds = $this->ownedMasterProductIds($orgId);

        $row = DB::table('kb_articles as k')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'k.product_id')
            ->leftJoin('users as au', 'au.id', '=', 'k.created_by')
            ->leftJoin('users as ru', 'ru.id', '=', 'k.reviewed_by')
            ->leftJoin('users as pu', 'pu.id', '=', 'k.published_by')
            ->where('k.slug', $slug)
            ->where('k.status', 'published')
            ->whereNotNull('k.published_at')
            ->first([
                'k.id',
                'k.product_id',
                DB::raw('mp.name as product_name'),
                'k.title',
                'k.slug',
                'k.body_html',
                'k.applies_to_version',
                'k.status',
                'k.published_at',
                'k.created_at',
                DB::raw('COALESCE(k.updated_at, k.published_at, k.created_at) as updated_at'),
                DB::raw('au.name as author_name'),
                DB::raw('ru.name as reviewer_name'),
                DB::raw('pu.name as publisher_name'),
            ]);

        if (!$row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (!in_array((int) $row->product_id, $ownedProductIds, true)) {
            return response()->json(['message' => 'Forbidden (product not owned)'], 403);
        }

        // Privasi: custstaff (role 3) tidak perlu lihat reviewer/publisher internal.
        $roleId = (int) ($request->user()->master_role_id ?? 0);
        $isInternal = in_array($roleId, [1, 2], true);

        $logoPath = public_path('images/viriya-logo.png');
        $logoFound = is_file($logoPath);
        // Logo statis → cache base64 selamanya (hindari file_get_contents+encode tiap export).
        // Jika file logo diganti, panggil Cache::forget('kb_pdf_logo_base64').
        $logoBase64 = $logoFound
            ? Cache::rememberForever(
                'kb_pdf_logo_base64',
                fn () => 'data:image/png;base64,' . base64_encode((string) file_get_contents($logoPath))
            )
            : null;

        $fmt = fn ($v) => $v ? Carbon::parse($v)->format('d F Y') : null;

        $data = [
            'logoBase64'  => $logoBase64,
            'logoFound'   => $logoFound,
            'title'       => (string) ($row->title ?: 'Knowledge Base Article'),
            'articleId'   => (int) $row->id,
            'status'      => (string) $row->status,
            'version'     => $row->applies_to_version ?: null,
            'productName' => $row->product_name ?: null,
            'author'      => $row->author_name ?: null,
            'reviewedBy'  => $isInternal ? ($row->reviewer_name ?: null) : null,
            'publishedBy' => $isInternal ? ($row->publisher_name ?: null) : null,
            'createdAt'   => $fmt($row->created_at),
            'updatedAt'   => $fmt($row->updated_at),
            'generatedAt' => Carbon::now()->format('d F Y'),
            'bodyHtml'    => HtmlSanitizer::clean($row->body_html),
        ];

        $slugTitle = Str::slug((string) $row->title) ?: 'article';
        $filename = 'knowledge-base-' . $slugTitle . '-' . (int) $row->id . '.pdf';

        $pdf = Pdf::loadView('pdf.kb-article', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', false) // tidak fetch resource eksternal
            ->setOption('isPhpEnabled', false)    // tidak eksekusi PHP di template
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('defaultFont', 'DejaVu Sans');

        return $pdf->download($filename);
    }
}
