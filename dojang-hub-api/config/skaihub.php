<?php

return [
    /*
    | Subdomain yang dipakai sistem; tidak boleh menjadi slug akademi karena
    | web memetakan <slug>.<domain> ke halaman publik akademi.
    | Daftar ini harus sama dengan RESERVED_SUBDOMAINS di
    | dojang-hub-web/src/lib/routing/resolve-rewrite.ts.
    */
    'reserved_subdomains' => ['www', 'app', 'api', 'admin', 'mail', 'static', 'cdn', 'status'],
];
