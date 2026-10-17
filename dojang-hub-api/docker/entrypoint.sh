#!/bin/sh
# Entrypoint kontainer API: siapkan Nginx di $PORT, migrasi DB, cache konfigurasi, lalu jalankan PHP-FPM + Nginx.
set -eu

cd /var/www/html

PORT="${PORT:-10000}"

# Render mengisi RENDER_EXTERNAL_URL (https://<nama>.onrender.com); dipakai bila APP_URL tidak di-set.
if [ -z "${APP_URL:-}" ] && [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
    export APP_URL="$RENDER_EXTERNAL_URL"
fi

sed "s/__PORT__/${PORT}/g" /etc/nginx/skaihub.conf.template > /etc/nginx/http.d/default.conf

# Migrasi sebelum config:cache supaya DB_MIGRATION_URL (koneksi langsung Neon, tanpa pooler) bisa menimpa DB_URL.
migrate() {
    if [ -n "${DB_MIGRATION_URL:-}" ]; then
        DB_URL="$DB_MIGRATION_URL" php artisan migrate --force --no-interaction
    else
        php artisan migrate --force --no-interaction
    fi
}

attempt=1
until migrate; do
    if [ "$attempt" -ge 5 ]; then
        echo "entrypoint: migrasi gagal setelah ${attempt} percobaan." >&2
        exit 1
    fi
    echo "entrypoint: migrasi gagal (percobaan ${attempt}), coba lagi dalam 5 detik..." >&2
    attempt=$((attempt + 1))
    sleep 5
done

# Hanya untuk demo: isi data contoh sekali, lalu hapus SEED_ON_BOOT dari env Render.
if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
    echo "entrypoint: SEED_ON_BOOT=true -> menjalankan db:seed (hapus variabel ini setelah berhasil)." >&2
    php artisan db:seed --force --no-interaction || echo "entrypoint: db:seed gagal, lanjut tanpa seed." >&2
fi

php artisan config:cache --no-interaction
php artisan route:cache --no-interaction

chown -R www-data:www-data storage bootstrap/cache

php-fpm --daemonize
exec nginx -g 'daemon off;'
