<?php

namespace App\Exports;

use App\Exports\Sheets\DataTiketSheet;
use App\Exports\Sheets\RingkasanSheet;
use App\Models\Organization;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Export report tiket — DUA SHEET:
 *   1. "Ringkasan"  → blok meta + ringkasan SLA.
 *   2. "Data Tiket" → tabel data tiket (header di baris 1, freeze A2).
 *
 * Nilai data, format sel, perhitungan SLA TIDAK berubah dari versi sebelumnya —
 * hanya dipisah ke sheet masing-masing. Ringkasan tetap dari TicketSlaService.
 */
class TicketReportExport implements WithMultipleSheets
{
    public function __construct(
        private Organization $organization,
        private Collection $tickets,
        private array $summary,        // TicketSlaService::summary()
        private array $perTicketSla,   // [ticket_id => ['duration_ms'=>..,'sla_status'=>..]]
        private ?string $from,
        private ?string $to,
        private ?string $status,
        private bool $capped = false,   // true bila hasil terpotong di safety cap baris
    ) {}

    public function sheets(): array
    {
        return [
            new RingkasanSheet($this->organization, $this->summary, $this->from, $this->to, $this->status, $this->capped),
            new DataTiketSheet($this->tickets, $this->perTicketSla),
        ];
    }
}
