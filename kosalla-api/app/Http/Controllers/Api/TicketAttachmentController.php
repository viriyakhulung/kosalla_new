<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentController extends Controller
{
    private const MAX_TOTAL_TICKET_FILES = 5; // ticket_comment_id NULL
    private const MAX_FILES_PER_REQUEST = 5;
    private const MAX_FILE_SIZE_KB = 10240; // 10MB

    private function roleName($user): ?string
    {
        return $user?->masterRole?->name;
    }

    private function isInternalStaffById($user): bool
    {
        $roleId = (int)($user?->master_role_id ?? 0);
        return in_array($roleId, [1, 2], true); // 1=superadmin, 2=viriyastaff
    }

    private function isInternalStaffByName(?string $role): bool
    {
        return in_array($role, ['viriyastaff', 'superadmin'], true);
    }

    /**
     * Tenant guard:
     * - superadmin/viriyastaff boleh cross-org
     * - custstaff wajib 1 org
     */
    private function guardTenant(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $role = $this->roleName($user);
        $isInternal = $this->isInternalStaffById($user) || $this->isInternalStaffByName($role);

        // ✅ internal staff boleh akses lintas org
        if ($isInternal) return null;

        if (!$user?->organization_id || (int)$ticket->organization_id !== (int)$user->organization_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return null;
    }

    /**
     * GET /tickets/{ticket}/attachments
     * ✅ hanya ticket attachment (ticket_comment_id is null)
     */
    public function index(Request $request, Ticket $ticket)
    {
        if ($resp = $this->guardTenant($request, $ticket)) return $resp;

        $attachments = TicketAttachment::query()
            ->where('ticket_id', $ticket->id)
            ->whereNull('ticket_comment_id')
            ->with(['uploader:id,name,email'])
            ->latest()
            ->get();

        return response()->json([
            'attachments' => $attachments->map(fn ($a) => $this->formatAttachment($ticket, $a))->values()->all(),
        ]);
    }

    /**
     * POST /tickets/{ticket}/attachments
     * ✅ upload ticket attachment saja (ticket_comment_id harus NULL)
     * ✅ enforce total max 5 per ticket (khusus yang NULL)
     *
     * ✅ PostgreSQL-safe concurrency:
     * - lock row ticket (bukan lock count aggregate)
     */
    public function store(Request $request, Ticket $ticket)
    {
        if ($resp = $this->guardTenant($request, $ticket)) return $resp;

        $user = $request->user();

        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:' . self::MAX_FILES_PER_REQUEST],
            'files.*' => [
                'file',
                'max:' . self::MAX_FILE_SIZE_KB,
                'mimes:pdf,png,jpg,jpeg,doc,docx,xls,xlsx,txt,zip',
            ],
        ]);

        $incomingCount = count($validated['files']);

        $created = DB::transaction(function () use ($ticket, $user, $validated, $incomingCount) {

            // ✅ lock ticket row supaya upload paralel untuk ticket yang sama tidak tembus limit
            Ticket::whereKey($ticket->id)->lockForUpdate()->first();

            // ✅ count biasa (tanpa FOR UPDATE) -> aman di PostgreSQL
            $currentCount = TicketAttachment::query()
                ->where('ticket_id', $ticket->id)
                ->whereNull('ticket_comment_id')
                ->count();

            if (($currentCount + $incomingCount) > self::MAX_TOTAL_TICKET_FILES) {
                return response()->json([
                    'message' => "Max 5 ticket attachments per ticket. Saat ini sudah ada {$currentCount} file.",
                ], 422);
            }

            $rows = [];
            foreach ($validated['files'] as $file) {
                $path = $file->store("tickets/{$ticket->id}/attachments", 'public');

                $rows[] = TicketAttachment::create([
                    'ticket_id' => $ticket->id,
                    'ticket_comment_id' => null,
                    'uploaded_by' => $user->id,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]);
            }

            return $rows;
        });

        // ✅ kalau transaksi mengembalikan JsonResponse (422), langsung return
        if ($created instanceof \Illuminate\Http\JsonResponse) {
            return $created;
        }

        $created = TicketAttachment::with('uploader:id,name,email')
            ->whereIn('id', collect($created)->pluck('id'))
            ->get();

        return response()->json([
            'message' => 'Attachments uploaded',
            'attachments' => $created->map(fn ($a) => $this->formatAttachment($ticket, $a))->values()->all(),
        ], 201);
    }

    /**
     * GET /tickets/{ticket}/attachments/{attachment}/download
     * ✅ custstaff TIDAK BOLEH download attachment internal comment
     */
    public function download(Request $request, Ticket $ticket, TicketAttachment $attachment)
    {
        if ($resp = $this->guardTenant($request, $ticket)) return $resp;

        $user = $request->user();
        $role = $this->roleName($user);

        // anti-IDOR
        abort_unless((int)$attachment->ticket_id === (int)$ticket->id, 404);

        // ✅ block custstaff download internal comment attachments
        if (($role === 'custstaff' || (int)$user->master_role_id === 3) && $attachment->ticket_comment_id) {
            $attachment->loadMissing('comment:id,is_internal');
            if ($attachment->comment && (bool)$attachment->comment->is_internal) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        if (!Storage::disk('public')->exists($attachment->path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($attachment->path, $attachment->original_name);
    }

    private function formatAttachment(Ticket $ticket, TicketAttachment $a): array
    {
        $a->loadMissing('uploader:id,name,email');

        return [
            'id' => $a->id,
            'original_name' => $a->original_name,
            'mime_type' => $a->mime_type,
            'size' => (int) $a->size,
            'created_at' => $a->created_at?->toISOString(),
            'download_url' => url("/api/tickets/{$ticket->id}/attachments/{$a->id}/download"),
            'uploader' => $a->uploader ? [
                'id' => $a->uploader->id,
                'name' => $a->uploader->name,
                'email' => $a->uploader->email,
            ] : null,
        ];
    }
}
