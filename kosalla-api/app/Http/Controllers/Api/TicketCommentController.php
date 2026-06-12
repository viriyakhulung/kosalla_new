<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\User;
use App\Notifications\TicketChatNotification;
use App\Services\NotificationRecipientService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;

class TicketCommentController extends Controller
{
    private const MAX_FILES_PER_MESSAGE = 5;
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

        // internal staff boleh lintas org
        if ($isInternal) return null;

        // non-internal wajib match org
        if (!$user?->organization_id) {
            return response()->json(['message' => 'User belum punya organization'], 422);
        }
        if ((int)$ticket->organization_id !== (int)$user->organization_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return null;
    }

    private function downloadUrl(Ticket $ticket, TicketAttachment $a): string
    {
        return url("/api/tickets/{$ticket->id}/attachments/{$a->id}/download");
    }

    /**
     * ✅ Minimal sanitizer (anti XSS):
     * - buang <script>, <style>, <iframe>, <object>, <embed>
     * - buang attribute on* (onclick/onerror/etc)
     * - blok javascript: di href/src
     */
    private function sanitizeRichText(string $html): string
    {
        $html = (string) $html;

        // remove dangerous tags (paired)
        $html = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $html);
        $html = preg_replace('/<style\b[^>]*>.*?<\/style>/is', '', $html);
        $html = preg_replace('/<(iframe|object|embed)\b[^>]*>.*?<\/\1>/is', '', $html);

        // also remove self-closing variants (rare but safe)
        $html = preg_replace('/<(iframe|object|embed)\b[^>]*\/>/is', '', $html);

        // remove inline event handlers (onclick, onerror, onload, etc)
        $html = preg_replace('/\son\w+\s*=\s*"[^"]*"/i', '', $html);
        $html = preg_replace("/\son\w+\s*=\s*'[^']*'/i", '', $html);
        $html = preg_replace('/\son\w+\s*=\s*[^\s>]+/i', '', $html);

        // block javascript: in href/src
        $html = preg_replace('/\b(href|src)\s*=\s*("|\')\s*javascript:[^"\']*\2/i', '$1="#"', $html);

        return trim($html);
    }

    private function formatAttachment(Ticket $ticket, TicketAttachment $a): array
    {
        $a->loadMissing('uploader:id,name,email');

        return [
            'id' => $a->id,
            'original_name' => $a->original_name,
            'size' => (int) $a->size,
            'mime_type' => $a->mime_type,
            'created_at' => $a->created_at?->toISOString(),
            'download_url' => $this->downloadUrl($ticket, $a),
            'uploader' => $a->uploader ? [
                'id' => $a->uploader->id,
                'name' => $a->uploader->name,
                'email' => $a->uploader->email,
            ] : null,
        ];
    }

    private function formatComment(Ticket $ticket, TicketComment $c): array
    {
        $c->loadMissing([
            'user:id,name,email,master_role_id,organization_id',
            'user.masterRole:id,name',
            'user.organization:id,name',
            'attachments.uploader:id,name,email',
        ]);

        return [
            'id' => $c->id,
            'ticket_id' => $c->ticket_id,
            'user_id' => $c->user_id,
            'is_internal' => (bool) $c->is_internal,
            'body' => $c->body,
            'created_at' => $c->created_at?->toISOString(),
            'user' => $c->user ? [
                'id' => $c->user->id,
                'name' => $c->user->name,
                'email' => $c->user->email,
                'master_role_id' => $c->user->master_role_id,
                'master_role' => $c->user->masterRole?->name,
                'organization_id' => $c->user->organization_id,
                'organization' => $c->user->organization?->name,
            ] : null,
            'attachments' => ($c->attachments ?? collect())
                ->sortBy('created_at')
                ->values()
                ->map(fn ($a) => $this->formatAttachment($ticket, $a))
                ->all(),
        ];
    }

    /**
     * GET /api/tickets/{ticket}/comments
     */
    public function index(Request $request, Ticket $ticket)
    {
        if ($resp = $this->guardTenant($request, $ticket)) return $resp;

        $user = $request->user();
        $role = $this->roleName($user);

        $q = TicketComment::query()
            ->where('ticket_id', $ticket->id)
            ->with([
                'user:id,name,email,master_role_id,organization_id',
                'user.masterRole:id,name',
                'user.organization:id,name',
                'attachments' => fn ($qq) => $qq->orderBy('created_at', 'asc'),
                'attachments.uploader:id,name,email',
            ])
            ->orderByDesc('created_at');

        // custstaff hanya non-internal
        if ($role === 'custstaff' || (int)$user->master_role_id === 3) {
            $q->where('is_internal', false);
        }

        $comments = $q->get();

        return response()->json([
            'comments' => $comments->map(fn ($c) => $this->formatComment($ticket, $c))->values()->all(),
        ]);
    }

    /**
     * POST /api/tickets/{ticket}/comments
     */
    public function store(Request $request, Ticket $ticket)
    {
        if ($resp = $this->guardTenant($request, $ticket)) return $resp;

        $user = $request->user();
        $role = $this->roleName($user);

        // block custstaff saat ticket closed
        $status = strtolower((string) $ticket->status);
        $isClosed = in_array($status, ['closed', 'close'], true);
        if ($isClosed && !$this->isInternalStaffById($user) && !$this->isInternalStaffByName($role)) {
            return response()->json(['message' => 'Ticket sudah closed.'], 403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string'],
            'is_internal' => ['nullable', 'boolean'],
            'files' => ['nullable', 'array', 'max:' . self::MAX_FILES_PER_MESSAGE],
            'files.*' => ['file', 'max:' . self::MAX_FILE_SIZE_KB],
        ]);

        // is_internal hanya internal staff
        $isInternal = false;
        if ($this->isInternalStaffById($user) || $this->isInternalStaffByName($role)) {
            $isInternal = (bool)($validated['is_internal'] ?? false);
        }

        $files = $request->file('files', []);
        if (!is_array($files)) $files = [];

        // ✅ sanitize body before save
        $cleanBody = $this->sanitizeRichText($validated['body']);

        // ✅ create comment + attachments in transaction
        $comment = DB::transaction(function () use ($ticket, $user, $cleanBody, $isInternal, $files) {
            $comment = TicketComment::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'is_internal' => $isInternal,
                'body' => $cleanBody,
            ]);

            // chat attachments (files[])
            foreach ($files as $file) {
                $path = $file->store("tickets/{$ticket->id}/comments/{$comment->id}", 'public');

                TicketAttachment::create([
                    'ticket_id' => $ticket->id,
                    'ticket_comment_id' => $comment->id,
                    'uploaded_by' => $user->id,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]);
            }

            if (Schema::hasColumn('tickets', 'last_activity_at')) {
                $ticket->update(['last_activity_at' => now()]);
            }

            return $comment;
        });

        $comment->load(['user:id,name,email', 'attachments.uploader:id,name,email']);

        // ===========================
        // EMAIL NOTIFICATION (CHAT)
        // Rules:
        // - customer chat -> semua viriyastaff (master_role_id=2)
        // - viriyastaff/superadmin reply:
        //      - kalau public (is_internal=false): reporter + semua viriyastaff
        //      - kalau internal (is_internal=true): imply hanya viriyastaff (customer tidak)
        // ===========================
        try {
            // Penerima dasar: member tim yang di-attach ke org tiket
            // (organisation_attach_teams). Sender dikecualikan default; ditambah
            // lagi di bawah bila sender staff internal.
            $recipients = app(NotificationRecipientService::class)
                ->getRecipientsForTicket($ticket)
                ->filter(fn ($u) => $u && !empty($u->email))
                ->where('id', '!=', $user->id) // exclude sender (default)
                ->unique('id')
                ->values();

            $isSenderInternal = $this->isInternalStaffById($user) || $this->isInternalStaffByName($role);

            // ✅ if sender is internal staff, include sender too (so they receive notification)
            if ($isSenderInternal && !empty($user->email)) {
                $recipients = $recipients->push($user)->unique('id')->values();
            }

            // notify reporter ONLY if internal sender AND comment is PUBLIC
            if ($isSenderInternal && !(bool)$comment->is_internal) {
                $ticket->loadMissing('creator:id,name,email');
                $reporter = $ticket->creator;

                if ($reporter && $reporter->email && (int)$reporter->id !== (int)$user->id) {
                    $recipients = $recipients->push($reporter)->unique('id')->values();
                }
            }

            if ($recipients->isNotEmpty()) {
                Notification::send(
                    $recipients,
                    new TicketChatNotification($ticket, $comment, (string) $user->name)
                );
            }
        } catch (\Throwable $e) {
            \Log::error('[TicketChatNotification] failed', [
                'ticket_id' => $ticket->id,
                'comment_id' => $comment->id,
                'err' => $e->getMessage(),
            ]);
        }

        return response()->json(
            $this->formatComment($ticket, $comment),
            201
        );
    }
}
