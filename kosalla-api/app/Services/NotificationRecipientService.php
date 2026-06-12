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
 * Dipakai oleh 4 titik dispatch (create/close/comment) agar tak ada duplikasi.
 */
class NotificationRecipientService
{
    /**
     * @return Collection<int, User>
     */
    public function getRecipientsForTicket(Ticket $ticket): Collection
    {
        $teams = Organization::find($ticket->organization_id)
            ?->teamGroups()
            ->where('team_groups.is_active', true)
            ->get();

        if ($teams && $teams->isNotEmpty()) {
            $recipients = $teams->flatMap(function ($team) {
                return $team->users()
                    ->wherePivot('is_active', true)
                    ->get();
            })->unique('id')->values();

            if ($recipients->isNotEmpty()) {
                return $recipients;
            }
        }

        // Fallback: org belum attach tim → kirim ke semua viriyastaff.
        return User::where('master_role_id', 2)->get();
    }
}
