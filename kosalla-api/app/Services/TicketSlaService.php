<?php

namespace App\Services;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Sumber kebenaran TUNGGAL logika SLA tiket (durasi + klasifikasi).
 *
 * Replikasi PERSIS dari computeMetrics() FE (apps/client/src/lib/dashboard.ts)
 * agar angka dashboard tidak berubah saat perhitungan dipindah ke backend,
 * dan agar Export Excel (Fase 2) memakai angka yang sama.
 *
 * Aturan penting (sengaja ditiru apa adanya dari FE):
 * - isClosed ditentukan dari STATUS (== 'closed'), BUKAN dari closed_at.
 * - Durasi closed   = closed_at - created_at (butuh keduanya valid).
 * - Durasi non-closed = now - created_at.
 * - within  : closed & durasi <= target.
 * - breached: (closed & durasi > target) ATAU (non-closed & elapsed > target, strict).
 * - closed tanpa closed_at: durasi null, tidak dihitung ke avg/within/breached.
 * - avg     = durationSum / resolvedCount, resolvedCount = closed-dengan-closed_at saja.
 * - slaPct  = round(within / resolvedCount * 100), basis resolvedCount.
 */
class TicketSlaService
{
    public function targetHours(): int
    {
        return (int) config('sla.target_hours', 4);
    }

    private function targetMs(): int
    {
        return $this->targetHours() * 60 * 60 * 1000;
    }

    /** Replikasi normalizeStatus() FE. */
    private function normalizeStatus(?string $status): string
    {
        $key = str_replace('-', '_', (string) ($status ?? 'open'));
        $allowed = ['open', 'in_progress', 'resolved', 'closed'];
        return in_array($key, $allowed, true) ? $key : 'open';
    }

    private function epochMs(?Carbon $dt): ?int
    {
        return $dt ? (int) $dt->getTimestampMs() : null;
    }

    /**
     * Metrik SLA untuk SATU tiket.
     *
     * @return array{duration_ms: ?int, pending: bool, breached: bool, sla_status: string, is_closed: bool}
     */
    public function forTicket(Ticket $ticket, ?Carbon $now = null): array
    {
        $now = $now ?? Carbon::now();

        $isClosed  = $this->normalizeStatus($ticket->status) === 'closed';
        $createdMs = $this->epochMs($ticket->created_at);
        $closedMs  = $this->epochMs($ticket->closed_at);
        $targetMs  = $this->targetMs();

        $durationMs = null;
        $pending = true;
        $breached = false;

        if ($isClosed) {
            $pending = false;
            if ($closedMs !== null && $createdMs !== null) {
                $durationMs = $closedMs - $createdMs;
                $breached = $durationMs > $targetMs; // within bila <= target
            }
            // closed tanpa closed_at → durasi null, tidak breached (data lama)
        } elseif ($createdMs !== null) {
            $durationMs = $this->epochMs($now) - $createdMs;
            $breached = $durationMs > $targetMs; // strict
        }

        // Selaras SlaBadge FE: breached > pending > within.
        $status = $breached ? 'breached' : ($pending ? 'pending' : 'within');

        return [
            'duration_ms' => $durationMs,
            'pending'     => $pending,
            'breached'    => $breached,
            'sla_status'  => $status,
            'is_closed'   => $isClosed,
        ];
    }

    /**
     * Agregat dashboard. Replikasi computeMetrics() tingkat ringkasan.
     *
     * @param Collection<int,Ticket> $tickets
     */
    public function summary(Collection $tickets, ?Carbon $now = null): array
    {
        $now = $now ?? Carbon::now();
        $targetMs = $this->targetMs();

        $total = $tickets->count();
        $closedCount = 0;
        $resolvedCount = 0;
        $within = 0;
        $breachedCount = 0;
        $durationSum = 0;

        foreach ($tickets as $t) {
            $isClosed  = $this->normalizeStatus($t->status) === 'closed';
            if ($isClosed) {
                $closedCount++;
            }

            $createdMs = $this->epochMs($t->created_at);
            $closedMs  = $this->epochMs($t->closed_at);

            if ($isClosed) {
                if ($closedMs !== null && $createdMs !== null) {
                    $d = $closedMs - $createdMs;
                    $resolvedCount++;
                    $durationSum += $d;
                    if ($d <= $targetMs) {
                        $within++;
                    } else {
                        $breachedCount++;
                    }
                }
            } elseif ($createdMs !== null) {
                $d = $this->epochMs($now) - $createdMs;
                if ($d > $targetMs) {
                    $breachedCount++;
                }
            }
        }

        $open = $total - $closedCount;

        return [
            'total'          => $total,
            'open'           => $open,
            'closed'         => $closedCount,
            'resolved_count' => $resolvedCount,
            'within_sla'     => $within,
            'breached_sla'   => $breachedCount,
            'avg_ms'         => $resolvedCount ? $durationSum / $resolvedCount : null,
            'sla_pct'        => $resolvedCount ? (int) round($within / $resolvedCount * 100) : null,
            'target_hours'   => $this->targetHours(),
        ];
    }
}
