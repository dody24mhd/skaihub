<?php

/*
| Aturan paket SKAIHUB. Nilai frontend (dojang-hub-web/src/lib/plan-pricing.ts)
| wajib disamakan bila angka di sini berubah.
*/

return [
    'plans' => [
        'starter' => [
            'monthly_price' => 99000,
            'included_students' => 50,
            'free_extra_blocks' => 1,
            'public_website' => false,
        ],
        'pro' => [
            'monthly_price' => 199000,
            'included_students' => 150,
            'free_extra_blocks' => 1,
            'public_website' => true,
        ],
        'scale' => [
            'monthly_price' => 349000,
            'included_students' => 300,
            'free_extra_blocks' => 1,
            'public_website' => true,
        ],
    ],

    'default_plan' => 'starter',

    'extra_block_size' => 50,

    'extra_block_surcharge_percent' => 15,

    'renewal_warning_days' => 14,

    'grace_days' => 7,

    'quota_warning_percent' => 80,

    /*
    | Subdomain yang dipakai sistem; tidak boleh menjadi slug akademi karena
    | web memetakan <slug>.<domain> ke halaman publik akademi.
    | Daftar ini harus sama dengan RESERVED_SUBDOMAINS di
    | dojang-hub-web/src/lib/routing/resolve-rewrite.ts.
    */
    'reserved_subdomains' => ['www', 'app', 'api', 'admin', 'mail', 'static', 'cdn', 'status'],
];
