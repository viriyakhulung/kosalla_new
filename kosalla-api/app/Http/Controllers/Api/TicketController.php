<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Models\Organization;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use App\Notifications\TicketCreatedNotification;
use App\Services\NotificationRecipientService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class TicketController extends Controller
{
    /**
     * LIST tickets untuk 1 organisasi (custstaff bisa lihat semua ticket di org)
     * GET /tickets
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user?->organization_id) {
            return response()->json(['message' => 'User belum punya organization'], 422);
        }

        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $q = Ticket::query()
            ->where('organization_id', $user->organization_id)
            ->with([
                'creator:id,name,email',
                'location:id,name',
                'organization:id,name',
                'inventoryItem:id,name',
            ])
            ->withCount('attachments')
            ->latest();

        if ($request->filled('status')) {
            $q->where('status', (string) $request->input('status'));
        }
        if ($request->filled('priority')) {
            $q->where('priority', (string) $request->input('priority'));
        }
        if ($request->filled('category')) {
            $q->where('category', (string) $request->input('category'));
        }
        if ($request->filled('q')) {
            $keyword = (string) $request->input('q');
            $q->where(function ($w) use ($keyword) {
                $w->where('ticket_number', 'like', "%{$keyword}%")
                  ->orWhere('subject', 'like', "%{$keyword}%");
            });
        }

        return response()->json($q->paginate($perPage));
    }

    /**
     * ADMIN: list tickets untuk 1 organisasi yang DIPILIH (cross-org, superadmin).
     * Dipakai dashboard SLA admin. Tidak bergantung pada organization_id user.
     * Menambahkan kolom turunan `first_response_at` = waktu balasan staff pertama
     * (ticket_comments.is_internal=false & bukan dari pembuat tiket).
     * GET /admin/organizations/{organization}/tickets
     */
    public function adminIndex(Request $request, Organization $organization)
    {
        $perPage = (int) $request->query('per_page', 50);
        if ($perPage < 1) $perPage = 50;
        if ($perPage > 200) $perPage = 200;

        $q = Ticket::query()
            ->where('organization_id', $organization->id)
            ->with([
                'creator:id,name,email',
                'location:id,name',
                'organization:id,name',
                'inventoryItem:id,name',
            ])
            ->latest();

        if ($request->filled('status')) {
            $q->where('status', (string) $request->input('status'));
        }
        if ($request->filled('priority')) {
            $q->where('priority', (string) $request->input('priority'));
        }

        $paginator = $q->paginate($perPage);

        // Balasan pertama (bukan dari pembuat tiket) per tiket → waktu + nama responder
        $items = collect($paginator->items());
        $ids = $items->pluck('id')->all();
        $createdByMap = $items->pluck('created_by', 'id');

        $firstByTicket = [];
        if (!empty($ids)) {
            $comments = TicketComment::query()
                ->whereIn('ticket_id', $ids)
                ->where('is_internal', false)
                ->orderBy('created_at')
                ->with('user:id,name')
                ->get(['id', 'ticket_id', 'user_id', 'created_at']);

            foreach ($comments as $c) {
                if (isset($firstByTicket[$c->ticket_id])) continue;
                if ((int) $c->user_id === (int) ($createdByMap[$c->ticket_id] ?? 0)) continue;
                $firstByTicket[$c->ticket_id] = $c;
            }
        }

        $paginator->getCollection()->transform(function ($t) use ($firstByTicket) {
            $c = $firstByTicket[$t->id] ?? null;
            // fallback bila akun pembalas sudah dihapus: tampilkan "User #id"
            $responder = $c
                ? ($c->user?->name ?: ($c->user_id ? "User #{$c->user_id}" : null))
                : null;
            $t->setAttribute('first_response_at', $c?->created_at);
            $t->setAttribute('first_response_by', $responder);
            return $t;
        });

        return response()->json($paginator);
    }

    /**
     * CREATE ticket (org & location auto dari user)
     * POST /tickets
     */
    public function store(StoreTicketRequest $request)
    {
        $user = $request->user();
        if (!$user?->organization_id) {
            return response()->json(['message' => 'User belum punya organization'], 422);
        }

        // ✅ buat ticket di transaction, tapi kirim email setelah commit
        $ticket = DB::transaction(function () use ($request, $user) {
            $ticketNumber = $this->generateTicketNumber($user->organization_id);

            return Ticket::create([
                'organization_id' => $user->organization_id,
                'location_id' => $user->location_id,
                'created_by' => $user->id,

                'ticket_number' => $ticketNumber,
                'subject' => $request->subject,

                'inventory_item_id' => $request->inventory_item_id,
                'category' => $request->category,
                'tagging_word' => $request->tagging_word,
                'description_html' => $this->sanitizeHtml($request->description_html),

                'priority' => $request->priority,
                'action_number' => $request->action_number,
                'requested_resolution_date' => $request->requested_resolution_date,
                'expected_date' => $request->expected_date,

                'status' => 'open',
            ]);
        });

        // EMAIL NOTIF: kirim ke member tim yang di-attach ke organisasi tiket,
        // plus creator. (organisation_attach_teams — tidak lagi pakai routing service.)
        $recipients = app(NotificationRecipientService::class)
            ->getRecipientsForTicket($ticket)
            ->push($user)
            ->filter(fn ($u) => $u && !empty($u->email))
            ->unique('id')
            ->values();

        Notification::send($recipients, new TicketCreatedNotification($ticket));

        return response()->json(
            $ticket->load([
                'creator:id,name,email',
                'location:id,name',
                'organization:id,name',
                'inventoryItem:id,name',
            ])->loadCount('attachments'),
            201
        );
    }

    /**
     * SHOW ticket (wajib 1 org)
     * GET /tickets/{ticket}
     */
    public function show(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        if (!$user?->organization_id || $ticket->organization_id !== $user->organization_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ticket->load([
            'creator:id,name,email',
            'location:id,name',
            'organization:id,name',
            'inventoryItem:id,name',
            'attachments.uploader:id,name,email',
        ])->loadCount('attachments');

        $attachments = $ticket->attachments->map(function ($a) use ($ticket) {
            return [
                'id' => $a->id,
                'original_name' => $a->original_name,
                'mime_type' => $a->mime_type,
                'size' => $a->size,
                'uploaded_by' => $a->uploaded_by,
                'uploader' => $a->uploader ? [
                    'id' => $a->uploader->id,
                    'name' => $a->uploader->name,
                    'email' => $a->uploader->email,
                ] : null,
                'created_at' => $a->created_at,
                'download_url' => route('tickets.attachments.download', [
                    'ticket' => $ticket->id,
                    'attachment' => $a->id,
                ]),
            ];
        });

        $data = $ticket->toArray();
        $data['attachments'] = $attachments;

        return response()->json($data);
    }

    /**
     * FORCE DELETE: hapus tiket permanen dari DB.
     * Hanya superadmin (master_role_id = 1) yang boleh.
     * DELETE /admin/tickets/{ticket}/force
     */
    public function forceDestroy(Request $request, Ticket $ticket)
    {
        // Pertahanan berlapis: route sudah di grup admin, tegakkan lagi role di sini.
        if ((int) $request->user()?->master_role_id !== 1) {
            return response()->json(['message' => 'Forbidden: hanya superadmin yang boleh menghapus permanen'], 403);
        }

        $ticketId = $ticket->id;
        $ticket->forceDelete();

        return response()->json([
            'message' => 'Ticket dihapus permanen',
            'id' => $ticketId,
        ]);
    }

    private function generateTicketNumber(int $orgId): string
    {
        $date = now()->format('Ymd');
        $prefix = "TCK-{$orgId}-{$date}-";

        $last = Ticket::where('organization_id', $orgId)
            ->where('ticket_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('ticket_number');

        $next = 1;
        if ($last) {
            $lastSeq = (int) substr($last, strlen($prefix));
            $next = $lastSeq + 1;
        }

        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    private function sanitizeHtml(?string $html): ?string
    {
        if ($html === null) return null;

        $allowed = '<p><br><b><strong><i><em><u><ul><ol><li><blockquote><code><pre><a>';
        $clean = strip_tags($html, $allowed);

        $clean = preg_replace('/href\s*=\s*["\']\s*javascript:[^"\']*["\']/i', 'href="#"', $clean);

        return $clean;
    }
}
