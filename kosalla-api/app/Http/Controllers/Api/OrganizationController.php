<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OrganizationController extends Controller
{
    public function index()
    {
        // Jika Organization model pakai SoftDeletes, defaultnya yang tampil hanya deleted_at NULL
        $orgs = Organization::orderBy('id', 'desc')->get();

        return response()->json(['data' => $orgs]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
        ]);

        $slug = $this->makeUniqueSlug($data['name']);

        $org = Organization::create([
            'name' => $data['name'],
            'slug' => $slug,
            'is_active' => true,
        ]);

        return response()->json(['data' => $org], 201);
    }

    public function update(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
        ]);

        $slug = $this->makeUniqueSlug($data['name'], $organization->id);

        $organization->update([
            'name' => $data['name'],
            'slug' => $slug,
        ]);

        return response()->json(['data' => $organization]);
    }

    /**
     * ? HARD DELETE on normal delete:
     * DELETE /api/admin/organizations/{organization}
     *
     * Ini yang kamu minta: saat admin delete organisasi, data benar-benar hilang dari DB
     * + hapus semua data turunan (users/locations/items/contracts/tickets/comments/attachments + file).
     */
    public function destroy(Organization $organization)
    {
        $this->purgeOrganization($organization);

        return response()->json(['message' => 'Organization deleted permanently (hard delete)']);
    }

    // ===== OPTIONAL: kalau kamu masih keep fitur trash/restore/force =====

    public function trash()
    {
        return response()->json([
            'data' => Organization::onlyTrashed()->orderByDesc('deleted_at')->get()
        ]);
    }

    public function restore($id)
    {
        $org = Organization::onlyTrashed()->findOrFail($id);
        $org->restore();

        return response()->json(['data' => $org]);
    }

    /**
     * DELETE /api/admin/organizations/{id}/force
     * Untuk hapus permanen yang sudah soft-deleted (trash).
     */
    public function forceDelete($id)
    {
        $org = Organization::onlyTrashed()->findOrFail($id);

        $this->purgeOrganization($org);

        return response()->json(['message' => 'Force deleted (purged)']);
    }

    /**
     * Core: purge organization + cascade manual (aman untuk FK).
     */
    private function purgeOrganization(Organization $organization): void
    {
        DB::transaction(function () use ($organization) {
            $orgId = $organization->id;

            // 1) Ticket IDs milik org
            $ticketIds = DB::table('tickets')
                ->where('organization_id', $orgId)
                ->pluck('id');

            if ($ticketIds->isNotEmpty()) {
                // 2) Hapus file attachment di storage (disk public)
                $paths = DB::table('ticket_attachments')
                    ->whereIn('ticket_id', $ticketIds)
                    ->pluck('path');

                foreach ($paths as $p) {
                    if (!empty($p)) {
                        Storage::disk('public')->delete($p);
                    }
                }

                // 3) Hapus child ticket (urut penting)
                DB::table('ticket_attachments')->whereIn('ticket_id', $ticketIds)->delete();
                DB::table('ticket_comments')->whereIn('ticket_id', $ticketIds)->delete();

                // 4) Hapus tickets
                DB::table('tickets')->whereIn('id', $ticketIds)->delete();
            }

            // 5) Hapus table lain yg reference organization_id
            DB::table('contracts')->where('organization_id', $orgId)->delete();
            DB::table('inventory_items')->where('organization_id', $orgId)->delete();
            DB::table('locations')->where('organization_id', $orgId)->delete();
            DB::table('branches')->where('organization_id', $orgId)->delete();
            DB::table('users')->where('organization_id', $orgId)->delete();

            // 6) Terakhir: hapus organization row (HARD DELETE)
            // pakai query builder biar pasti delete beneran walau model pakai SoftDeletes
            DB::table('organizations')->where('id', $orgId)->delete();
        });
    }

    private function makeUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $base = $slug;
        $i = 1;

        // kalau kamu mau slug tetap unik walau soft deleted, pakai withTrashed()
        $query = Organization::withTrashed();

        while (
            $query->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
