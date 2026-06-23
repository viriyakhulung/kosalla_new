<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\TransferTicketRequest;
use App\Models\Ticket;
use App\Notifications\TicketTransferredNotification;
use App\Services\TicketTransferService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class PortalTicketTransferController extends Controller
{
    public function __construct(private TicketTransferService $service) {}

    /**
     * GET /api/portal/transfer-targets/{ticket}
     * Daftar team tujuan (se-org, exclude team tiket saat ini) + flag has_lead.
     */
    public function targets(Request $request, Ticket $ticket)
    {
        if (!$this->service->canTransfer($request->user(), $ticket)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['data' => $this->service->targetsFor($ticket)]);
    }

    /**
     * PATCH /api/portal/tickets/{ticket}/transfer
     * Lempar tiket: assigned_to → Team Lead aktif team tujuan. team_group_id TETAP.
     */
    public function transfer(TransferTicketRequest $request, Ticket $ticket)
    {
        $user = $request->user();

        if (!$this->service->canTransfer($user, $ticket)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();

        // Validasi team tujuan di application layer (no exists/FK).
        $toTeam = $this->service->resolveValidTarget($ticket, (int) $data['to_team_group_id']);
        if (!$toTeam) {
            return response()->json([
                'message' => 'Team tujuan tidak valid (harus team aktif lain di organisasi yang sama).',
                'errors'  => ['to_team_group_id' => ['Team tujuan tidak valid.']],
            ], 422);
        }

        // Team tujuan wajib punya Team Lead aktif.
        $lead = $this->service->resolveLead($toTeam);
        if (!$lead) {
            return response()->json([
                'message' => 'Team tujuan tidak punya Team Lead aktif.',
                'errors'  => ['to_team_group_id' => ['Team tujuan tidak punya Team Lead aktif.']],
            ], 422);
        }

        // Simpan state lama untuk audit + email.
        // "Tim penanganan" diturunkan dari handler bila team_group_id null.
        $fromTeamIds = $this->service->currentHandlingTeamIds($ticket);
        $fromTeamName = $this->service->currentHandlingTeamName($ticket);
        $note = (string) $data['note'];

        DB::transaction(function () use ($ticket, $lead) {
            // Hanya assigned_to yang berubah. team_group_id TETAP.
            $ticket->update([
                'assigned_to'      => $lead->id,
                'last_activity_at' => now(),
            ]);
        });

        // Audit trail via log file (tanpa tabel).
        Log::info('ticket.transferred', [
            'ticket_id'           => $ticket->id,
            'by_user_id'          => $user->id,
            'from_team_group_id'  => $ticket->team_group_id, // raw (bisa null)
            'from_team_group_ids' => $fromTeamIds,           // derivasi dari handler bila null
            'to_team_group_id'    => $toTeam->id,
            'new_assignee_id'     => $lead->id,
            'note'                => $note,
            'at'                  => now()->toISOString(),
        ]);

        // Email ke member aktif team tujuan. Filter keamanan multi-tenant sama
        // dengan resolver utama: internal vendor (role 1/2) ATAU org == org tiket.
        $recipientService = app(\App\Services\NotificationRecipientService::class);
        $orgId = (int) $ticket->organization_id;
        $recipients = $toTeam->users()
            ->wherePivot('is_active', true)
            ->get()
            ->filter(fn ($u) => $u && !empty($u->email) && $recipientService->mayReceive($u, $orgId))
            ->unique('id')
            ->values();

        if ($recipients->isNotEmpty()) {
            Notification::send(
                $recipients,
                new TicketTransferredNotification(
                    $ticket,
                    $fromTeamName,
                    $toTeam->name,
                    (string) ($user->name ?? '-'),
                    $note
                )
            );
        }

        return response()->json([
            'message' => 'Ticket transferred',
            'data'    => $ticket->load([
                'assignee:id,name,email',
                'teamGroup:id,name',
            ]),
        ]);
    }
}
