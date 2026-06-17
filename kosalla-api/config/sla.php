<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Target SLA penyelesaian tiket (jam)
    |--------------------------------------------------------------------------
    | Dihitung dari created_at → closed_at (tiket closed) atau created_at → now
    | (tiket belum closed). Sumber kebenaran TUNGGAL untuk dashboard & export.
    */
    'target_hours' => (int) env('SLA_TARGET_HOURS', 4),
];
