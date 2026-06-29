<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Tentukan penerima notifikasi tiket berdasarkan arsitektur
 * organisation_attach_teams: penerima = member aktif dari semua tim yang
 * di-attach ke organisasi tiket. Bila organisasi belum meng-attach tim apa pun
 * (atau timnya tanpa member aktif), fallback ke seluruh viriyastaff.
 *
 * KEAMANAN MULTI-TENANT: anggota team bisa lintas-organisasi (team di-attach ke
 * banyak org). Maka penerima difilter di application layer — seorang user sah
 * menerima HANYA jika internal vendor (master_role 1/2) ATAU org-nya sama dengan
 * org tiket. Mencegah custstaff org lain menerima tiket org berbeda.
 *
 * Dipakai oleh titik dispatch create/close/comment agar tak ada duplikasi.
 */
class NotificationRecipientService
{
    /**
     * Apakah $user sah menerima notifikasi tiket milik $organizationId?
     * Internal vendor (superadmin/viriyastaff = role 1/2) selalu sah;
     * selain itu hanya bila organisasi user sama dengan organisasi tiket.
     */
    public function mayReceive(User $user, int $organizationId): bool
    {
        $role = (int) $user->master_role_id;
        if ($role === 1 || $role === 2) {
            return true;
        }
        return (int) $user->organization_id === $organizationId;
    }

    /**
     * @return Collection<int, User>
     */
    public function getRecipientsForTicket(Ticket $ticket): Collection
    {
        $orgId = (int) $ticket->organization_id;

        $teams = Organization::find($orgId)
            ?->teamGroups()
            ->where('team_groups.is_active', true)
            ->get();

        if ($teams && $teams->isNotEmpty()) {
            $teamIds = $teams->pluck('id')->all();

            // Satu query menggantikan flatMap per-tim (hindari N+1).
            // Penerima = user yang merupakan anggota AKTIF (pivot is_active=true)
            // dari minimal satu tim dalam set — setara hasil flatMap+unique lama.
            $recipients = User::whereHas('teamGroups', function ($q) use ($teamIds) {
                $q->whereIn('team_groups.id', $teamIds)
                    ->where('team_group_user.is_active', true);
            })
                ->get()
                // Filter keamanan multi-tenant (app-layer) — tidak diubah.
                ->filter(fn ($u) => $u && $this->mayReceive($u, $orgId))
                ->unique('id')
                ->values();

            if ($recipients->isNotEmpty()) {
                return $recipients;
            }
        }

        // Fallback: org belum attach tim → kirim ke semua viriyastaff (vendor).
        return User::where('master_role_id', 2)->get();
    }
}
