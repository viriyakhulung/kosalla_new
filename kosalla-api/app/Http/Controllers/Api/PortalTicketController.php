<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Models\Contract;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use App\Notifications\TicketCreatedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Services\NotificationRecipientService;

class PortalTicketController extends Controller
{
    // GET /api/portal/tickets
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user?->organization_id) {
            return response()->json(['message' => 'User belum punya organization_id'], 422);
        }

        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $roleId = (int) $user->master_role_id;

        // Tentukan organization yang dipakai
        $orgId = $user->organization_id;
        $allOrgs = false;

        // role 2 (viriyastaff) boleh memilih org (org_id query).
        // org_id KOSONG = "All Organizations" → tampilkan tiket SEMUA org.
        if ($roleId === 2) {
            $reqOrg = $request->query('org_id');
            if ($reqOrg) {
                $orgId = (int) $reqOrg;
            } else {
                $allOrgs = true;
            }
        }

        $q = Ticket::query()
            ->when(!$allOrgs, fn ($qq) => $qq->where('organization_id', $orgId))
            ->with([
                'location:id,name,organization_id',
                'creator:id,name,email',
                'inventoryItem:id,name',
                'organization:id,name',
            ])
            ->withCount([
                'attachments as attachments_count' => function ($qq) {
                    $qq->whereNull('ticket_comment_id');
                }
            ])
            ->orderByDesc('id');

        // optional filter sederhana
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

        // STEP 6 — Scoped ticket list (organisation_attach_teams):
        // viriyastaff (role 2) hanya melihat tiket dari ORGANISASI yang
        // timnya di-attach. Tanpa tim → fallback lihat semua. Superadmin (1)
        // & custstaff (3) memakai behaviour org existing (tidak dibatasi di sini).
        if ($roleId === 2) {
            $userTeamIds = $user->teamGroups()
                ->wherePivot('is_active', true)
                ->pluck('team_groups.id');

            if ($userTeamIds->isNotEmpty()) {
                $orgIds = DB::table('organization_team_groups')
                    ->whereIn('team_group_id', $userTeamIds)
                    ->pluck('organization_id');

                $q->whereIn('organization_id', $orgIds);
            }
        }

        $tickets = $q->paginate($perPage);

        // Kolom turunan `first_response_at` / `first_response_by` = balasan staff
        // pertama (ticket_comments.is_internal=false & bukan dari pembuat tiket).
        // Dipakai dashboard portal untuk menghitung "Avg. Response".
        $items = collect($tickets->items());
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

        $tickets->getCollection()->transform(function ($t) use ($firstByTicket) {
            $c = $firstByTicket[$t->id] ?? null;
            $responder = $c
                ? ($c->user?->name ?: ($c->user_id ? "User #{$c->user_id}" : null))
                : null;
            $t->setAttribute('first_response_at', $c?->created_at);
            $t->setAttribute('first_response_by', $responder);
            return $t;
        });

        // Daftar organisasi hanya untuk role 2 (viriyastaff)
        $orgOptions = [];
        if ($roleId === 2) {
            $orgOptions = \App\Models\Organization::select('id', 'name')->orderBy('name')->get();
        }

        // Saat "All Organizations" (lintas-org), tidak ada org aktif tunggal.
        $activeOrg = $allOrgs ? null : \App\Models\Organization::select('id', 'name')->find($orgId);

        return response()->json([
            'data' => $tickets->items(),
            'current_page' => $tickets->currentPage(),
            'last_page' => $tickets->lastPage(),
            'per_page' => $tickets->perPage(),
            'total' => $tickets->total(),
            'organization' => $activeOrg,
            'organizations' => $orgOptions,
        ]);
    }

    // POST /api/portal/tickets
    public function store(StoreTicketRequest $request)
    {
        // ✅ LOG: RAW input (sebelum validated)
        \Log::info("TICKET_DESC_HTML_IN", [
            "len_raw" => strlen((string) $request->input("description_html")),
            "has_img_raw" => str_contains((string) $request->input("description_html"), "<img"),
            "has_style_raw" => str_contains((string) $request->input("description_html"), "style="),
            "head_raw" => substr((string) $request->input("description_html"), 0, 300),
        ]);

        // ✅ sekali saja
        $payload = $request->validated();

        // ✅ LOG: setelah validated()
        \Log::info("TICKET_DESC_HTML_VALIDATED", [
            "len_val" => strlen((string) ($payload["description_html"] ?? "")),
            "has_img_val" => str_contains((string) ($payload["description_html"] ?? ""), "<img"),
            "has_style_val" => str_contains((string) ($payload["description_html"] ?? ""), "style="),
            "head_val" => substr((string) ($payload["description_html"] ?? ""), 0, 300),
        ]);

        $user = $request->user();

        if (!$user?->organization_id) {
            return response()->json(['message' => 'User belum punya organization_id'], 422);
        }
        if (!$user?->location_id) {
            return response()->json(['message' => 'User belum punya location_id'], 422);
        }

        // Pastikan kontrak organisasi masih aktif
        $now = now();
        $hasActiveContract = Contract::query()
            ->where('organization_id', $user->organization_id)
            ->where('status', 'active')
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->exists();

        if (!$hasActiveContract) {
            return response()->json([
                'message' => 'Kontrak organisasi sudah expired atau tidak ada. Hubungi admin untuk perpanjang.',
            ], 403);
        }

        $ticket = DB::transaction(function () use ($user, $payload) {
            // ticket_number unik per organisasi: TCK-{ORGID}-{YYYYMMDD}-{NNNN}
            $date = now()->format('Ymd');
            $prefix = "TCK-{$user->organization_id}-{$date}-";

            $last = Ticket::where('organization_id', $user->organization_id)
                ->where('ticket_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderByDesc('id')
                ->value('ticket_number');

            $nextSeq = 1;
            if ($last) {
                $lastSeq = (int) substr($last, strlen($prefix));
                $nextSeq = $lastSeq + 1;
            }

            $ticketNumber = $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

            $sanitized = $this->sanitizeHtml($payload['description_html'] ?? null);

            $ticket = Ticket::create([
                'organization_id' => $user->organization_id,
                'location_id' => $user->location_id,
                'created_by' => $user->id,
                'ticket_number' => $ticketNumber,

                'subject' => $payload['subject'],
                'category' => $payload['category'] ?? null,
                'inventory_item_id' => $payload['inventory_item_id'] ?? null,
                'tagging_word' => $payload['tagging_word'] ?? null,

                // mindmap: description-only (HTML)
                'description_html' => $sanitized,

                'priority' => $payload['priority'] ?? 'normal',
                'status' => 'open',

                'action_number' => $payload['action_number'] ?? null,
                'requested_resolution_date' => $payload['requested_resolution_date'] ?? null,
                'expected_date' => $payload['expected_date'] ?? null,

                // fields tambahan
                'version' => $payload['version'] ?? null,
                'build_no' => $payload['build_no'] ?? null,
                'patch_no' => $payload['patch_no'] ?? null,
                'module' => $payload['module'] ?? null,
                'error_code' => $payload['error_code'] ?? null,
                'severity' => $payload['severity'] ?? null,
                'project' => $payload['project'] ?? null,
                'customer' => $payload['customer'] ?? null,
                'complete_ps' => $payload['complete_ps'] ?? null,
                'schedule_comment' => $payload['schedule_comment'] ?? null,
            ]);

            // ✅ LOG: hasil yang benar-benar tersimpan
            \Log::info("TICKET_DESC_HTML_SAVED", [
                "ticket_id" => $ticket->id,
                "len_saved" => strlen((string) ($ticket->description_html ?? "")),
                "has_img_saved" => str_contains((string) ($ticket->description_html ?? ""), "<img"),
                "has_style_saved" => str_contains((string) ($ticket->description_html ?? ""), "style="),
                "head_saved" => substr((string) ($ticket->description_html ?? ""), 0, 300),
            ]);

            return $ticket;
        });

        // EMAIL NOTIF: kirim ke member tim yang di-attach ke organisasi tiket,
        // plus creator. (organisation_attach_teams — tidak lagi pakai routing service.)
        $recipients = app(NotificationRecipientService::class)
            ->getRecipientsForTicket($ticket)
            ->push($user)
            ->filter(fn ($u) => $u && !empty($u->email))
            ->unique('id')
            ->values();

        $ticket->loadMissing([
            'location:id,name,organization_id',
            'creator:id,name,email',
            'inventoryItem:id,name',
            'organization:id,name',
        ]);

        Notification::send($recipients, new TicketCreatedNotification($ticket));

        return response()->json([
            'message' => 'Ticket created',
            'data' => $ticket->load([
                'location:id,name,organization_id',
                'creator:id,name,email',
                'inventoryItem:id,name',
                'organization:id,name',
            ])->loadCount([
                'attachments as attachments_count' => function ($qq) {
                    $qq->whereNull('ticket_comment_id');
                }
            ]),
        ], 201);
    }

    // GET /api/portal/tickets/{ticket}
    public function show(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        $roleId = (int) $user->master_role_id;
        $isInternal = in_array($roleId, [1, 2], true);

        if (!$isInternal) {
            if (!$user?->organization_id || (int) $ticket->organization_id !== (int) $user->organization_id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        // STEP 6 — Guard scoped (organisation_attach_teams): viriyastaff yang
        // punya tim hanya boleh buka tiket dari organisasi yang timnya di-attach.
        // Tanpa tim → fallback boleh (tidak dibatasi). Superadmin tetap bebas.
        if ($roleId === 2) {
            $userTeamIds = $user->teamGroups()
                ->wherePivot('is_active', true)
                ->pluck('team_groups.id');

            if ($userTeamIds->isNotEmpty()) {
                $orgIds = DB::table('organization_team_groups')
                    ->whereIn('team_group_id', $userTeamIds)
                    ->pluck('organization_id');

                if (!$orgIds->contains((int) $ticket->organization_id)) {
                    return response()->json(['message' => 'Forbidden'], 403);
                }
            }
        }

        $ticket->load([
            'location:id,name,organization_id',
            'creator:id,name,email',
            'inventoryItem:id,name',
            'organization:id,name',
            'attachments' => function ($q) {
                $q->whereNull('ticket_comment_id')
                  ->with('uploader:id,name,email')
                  ->latest();
            },
        ]);

        $ticket->loadCount([
            'attachments as attachments_count' => function ($q) {
                $q->whereNull('ticket_comment_id');
            }
        ]);

        $attachments = $ticket->attachments->map(function ($a) use ($ticket) {
            return [
                'id' => $a->id,
                'original_name' => $a->original_name,
                'mime_type' => $a->mime_type,
                'size' => (int) $a->size,
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

        return response()->json(['data' => $data]);
    }

    /**
     * Sanitize HTML untuk description_html.
     * - Allow span + style (dibatasi properti aman)
     * - Allow img src (https/http) dan data:image/(png|jpg|jpeg|gif|webp);base64
     * - Block javascript: pada href
     */
    private function sanitizeHtml(?string $html): ?string
    {
        if ($html === null) return null;

        // Allow tags (penting: span + img untuk tiptap color/font/image)
        $allowed = '<p><br><b><strong><i><em><u><s><ul><ol><li><blockquote><code><pre><a><span><div><img>';
        $clean = strip_tags($html, $allowed);

        // Hapus attribute event handler: onclick=, onerror=, dll
        $clean = preg_replace('/\son\w+\s*=\s*(".*?"|\'.*?\'|[^\s>]+)/i', '', $clean);

        // Sanitize href javascript:
        $clean = preg_replace('/href\s*=\s*["\']\s*(javascript:|data:|vbscript:)[^"\']*["\']/i', 'href="#"', $clean);

        // Sanitize style: hanya allow properti tertentu
        $clean = preg_replace_callback('/style\s*=\s*("|\')(.*?)\1/i', function ($m) {
            $quote = $m[1];
            $style = $m[2];

            // blok yang mencurigakan
            $lower = strtolower($style);
            if (str_contains($lower, 'expression') || str_contains($lower, 'javascript:') || str_contains($lower, 'url(')) {
                return ''; // buang style
            }

            $allowedProps = [
                'color',
                'background-color',
                'text-align',
                'font-family',
                'font-size',
                'font-weight',
                'text-decoration',
                'line-height',
            ];

            $out = [];
            foreach (explode(';', $style) as $decl) {
                $decl = trim($decl);
                if ($decl === '' || !str_contains($decl, ':')) continue;

                [$prop, $val] = array_map('trim', explode(':', $decl, 2));
                $propLower = strtolower($prop);

                if (!in_array($propLower, $allowedProps, true)) continue;

                $valLower = strtolower($val);
                if (str_contains($valLower, 'expression') || str_contains($valLower, 'javascript:') || str_contains($valLower, 'url(')) {
                    continue;
                }

                $out[] = $propLower . ': ' . $val;
            }

            if (count($out) === 0) return '';
            return 'style=' . $quote . implode('; ', $out) . $quote;
        }, $clean);

        // Sanitize img src: allow http(s) atau data:image/(...);base64
        $clean = preg_replace_callback('/<img\b[^>]*>/i', function ($m) {
            $tag = $m[0];

            if (!preg_match('/src\s*=\s*("|\')(.*?)\1/i', $tag, $sm)) {
                return ''; // tanpa src, buang
            }

            $src = $sm[2];

            $okHttp = preg_match('#^https?://#i', $src) === 1;

            $okData = preg_match('#^data:image/(png|jpe?g|gif|webp);base64,#i', $src) === 1;

            if (!$okHttp && !$okData) {
                return ''; // buang img yang aneh
            }

            // buang event handler di img juga (onerror dll) sudah dihapus sebelumnya,
            // tapi aman kalau dibersihin lagi.
            $tag = preg_replace('/\son\w+\s*=\s*(".*?"|\'.*?\'|[^\s>]+)/i', '', $tag);

            return $tag;
        }, $clean);

        return $clean;
    }
}
