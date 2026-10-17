<?php

return [

    /*
    | Proxy yang dipercaya untuk header X-Forwarded-* (dibaca middleware TrustProxies bawaan Laravel).
    | Di balik load balancer Render isi TRUSTED_PROXIES=* agar skema https dan IP klien
    | (dipakai rate limit) terbaca benar. Kosong = tidak ada proxy yang dipercaya.
    */

    'proxies' => env('TRUSTED_PROXIES'),

];
