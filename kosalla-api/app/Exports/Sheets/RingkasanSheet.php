<?php

namespace App\Exports\Sheets;

use App\Models\Organization;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

/**
 * Sheet 1 — "Ringkasan": blok meta + ringkasan SLA saja (tanpa tabel data).
 * Nilai identik dgn versi single-sheet sebelumnya (baris 1–13).
 */
class RingkasanSheet implements FromArray, WithTitle, WithEvents, WithColumnWidths, WithStrictNullComparison
{
    private const BRAND = '0D9488';
    private const INK   = '374151';

    public function __construct(
        private Organization $organization,
        private array $summary,
        private ?string $from,
        private ?string $to,
        private ?string $status,
    ) {}

    public function title(): string
    {
        return 'Ringkasan';
    }

    public function array(): array
    {
        return [
            ['Report Tiket — ' . $this->organization->name],            // 1
            ['Periode (dibuat)', $this->from ?? 'awal', 's/d', $this->to ?? 'sekarang'], // 2
            ['Filter status', $this->status ?? 'semua'],                // 3
            ['Digenerate pada', now()->format('d/m/Y H.i')],            // 4
            [],                                                         // 5
            ['RINGKASAN'],                                              // 6
            ['Total Tiket', $this->summary['total'] ?? 0],             // 7
            ['Open', $this->summary['open'] ?? 0],                     // 8
            ['Closed', $this->summary['closed'] ?? 0],                 // 9
            ['Dalam SLA', $this->summary['within_sla'] ?? 0],         // 10
            ['Lewat SLA', $this->summary['breached_sla'] ?? 0],       // 11
            ['Rata-rata penyelesaian', $this->fmtHours($this->summary['avg_ms'] ?? null)], // 12
            ['Target SLA (jam)', $this->summary['target_hours'] ?? null], // 13
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 28, 'B' => 18, 'C' => 6, 'D' => 14];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Judul (baris 1) — merge, bold 16, brand
                $sheet->mergeCells('A1:D1');
                $sheet->getStyle('A1')->applyFromArray([
                    'font'      => ['bold' => true, 'size' => 16, 'color' => ['rgb' => self::BRAND]],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(24);

                // Blok meta (baris 2–4) — label kolom A bold, abu gelap
                foreach ([2, 3, 4] as $r) {
                    $sheet->getStyle("A{$r}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => self::INK]],
                    ]);
                }

                // Sub-header "RINGKASAN" (baris 6) — bold 13, brand
                $sheet->getStyle('A6')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => self::BRAND]],
                ]);

                // Baris ringkasan (7–13): label (A) bold, nilai (B) rata kanan
                for ($r = 7; $r <= 13; $r++) {
                    $sheet->getStyle("A{$r}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => self::INK]],
                    ]);
                    $sheet->getStyle("B{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                }
            },
        ];
    }

    /** Replikasi formatHours() FE: "<1 jam" → "X mnt", else "X.X jam". */
    private function fmtHours(?float $ms): string
    {
        if ($ms === null) return '—';
        $h = $ms / 3_600_000;
        if ($h < 1) return round($ms / 60_000) . ' mnt';
        return number_format($h, 1) . ' jam';
    }
}
