<?php

namespace App\Exports\Sheets;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Sheet 2 — "Data Tiket": header tabel di BARIS 1, data mulai baris 2.
 * Header di baris 1 → freezePane('A2') sederhana, tidak ada index dinamis
 * (memperbaiki bug baris-dobel pada versi single-sheet).
 *
 * Nilai & format sel identik dgn versi sebelumnya — hanya pindah sheet.
 */
class DataTiketSheet implements FromArray, WithTitle, WithEvents, WithColumnWidths, WithStrictNullComparison
{
    private const BRAND = '0D9488';
    private const WHITE = 'FFFFFF';
    private const ZEBRA = 'F8FAFC';
    private const GRID  = 'E2E8F0';
    private const RED   = 'DC2626';
    private const GREEN = '16A34A';
    private const GRAY  = '6B7280';
    private const MUTED = '9CA3AF';
    private const LAST_COL = 'J';

    public function __construct(
        private Collection $tickets,
        private array $perTicketSla,
    ) {}

    public function title(): string
    {
        return 'Data Tiket';
    }

    public function array(): array
    {
        $rows = [];

        // Header tabel di BARIS 1
        $rows[] = [
            'No. Tiket', 'Subjek', 'Status', 'Prioritas',
            'Dibuat', 'Ditutup', 'Durasi', 'Status SLA',
            'Pembuat', 'Penutup',
        ];

        foreach ($this->tickets as $t) {
            $sla = $this->perTicketSla[$t->id] ?? null;
            $rows[] = [
                $t->ticket_number,
                $t->subject,
                $t->status,
                $t->priority,
                optional($t->created_at)->format('d/m/Y H.i'),
                $t->closed_at ? $t->closed_at->format('d/m/Y H.i') : '—',
                $this->fmtDurationShort($sla['duration_ms'] ?? null),
                $this->slaLabel($sla['sla_status'] ?? null),
                $t->creator?->name ?? '—',
                $t->closedBy?->name ?? '—',
            ];
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 22, 'B' => 35, 'C' => 12, 'D' => 11, 'E' => 18, 'F' => 18, 'G' => 12, 'H' => 14, 'I' => 18, 'J' => 18];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $last  = self::LAST_COL;

                $dataStart = 2;
                $dataEnd   = $sheet->getHighestRow(); // baris terakhir berisi data
                $lastRow   = max(1, $dataEnd);

                // Header tabel (baris 1) — fill brand, putih bold, center, tinggi
                $sheet->getStyle("A1:{$last}1")->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => self::WHITE]],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::BRAND]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(20);

                // Border grid utk seluruh tabel
                $sheet->getStyle("A1:{$last}{$lastRow}")->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::GRID]]],
                ]);

                if ($dataEnd >= $dataStart) {
                    // Subjek (B) rata KIRI
                    $sheet->getStyle("B{$dataStart}:B{$dataEnd}")
                        ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                    // Status, Prioritas, tanggal, durasi, SLA → center
                    foreach (['C', 'D', 'E', 'F', 'G', 'H'] as $col) {
                        $sheet->getStyle("{$col}{$dataStart}:{$col}{$dataEnd}")
                            ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    }

                    for ($r = $dataStart; $r <= $dataEnd; $r++) {
                        // zebra striping baris genap
                        if ($r % 2 === 0) {
                            $sheet->getStyle("A{$r}:{$last}{$r}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB(self::ZEBRA);
                        }

                        // warna teks Status SLA (H) berdasar nilai yg SUDAH ada
                        $val = (string) $sheet->getCell("H{$r}")->getValue();
                        $color = match ($val) {
                            'Lewat SLA'                  => self::RED,
                            'Tepat waktu', 'Dalam SLA'   => self::GREEN,
                            'Belum selesai', 'Berjalan'  => self::GRAY,
                            default                      => self::MUTED, // "—"
                        };
                        $sheet->getStyle("H{$r}")->getFont()->getColor()->setRGB($color);
                    }
                }

                // Freeze tepat di bawah header → header tetap terlihat saat scroll
                $sheet->freezePane('A2');
            },
        ];
    }

    /** Replikasi formatDurationShort() FE: "X mnt" / "Hj Mm" / "H jam". */
    private function fmtDurationShort(?int $ms): string
    {
        if ($ms === null) return '—';
        $totalMin = (int) round($ms / 60_000);
        if ($totalMin < 60) return "{$totalMin} mnt";
        $h = intdiv($totalMin, 60);
        $m = $totalMin % 60;
        return $m ? "{$h}j {$m}m" : "{$h} jam";
    }

    /** Selaras SlaBadge FE: within→Tepat waktu, breached→Lewat SLA, pending→Belum selesai. */
    private function slaLabel(?string $status): string
    {
        return match ($status) {
            'within'   => 'Tepat waktu',
            'breached' => 'Lewat SLA',
            'pending'  => 'Belum selesai',
            default    => '—',
        };
    }
}
