<?php

return [
    // Pelatih boleh membuat/mengubah sesi hingga N hari ke belakang (tidak untuk tanggal mendatang).
    'coach_backfill_days' => (int) env('TRAINING_COACH_BACKFILL_DAYS', 7),
];
