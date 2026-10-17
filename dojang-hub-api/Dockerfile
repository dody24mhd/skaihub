# syntax=docker/dockerfile:1
# Image produksi API SKAIHUB: Nginx + PHP-FPM 8.3 dalam satu kontainer.
# Panduan demo (Render free + Neon): docs/DEPLOY-DEMO.md

FROM php:8.3-fpm-alpine AS base

RUN apk add --no-cache nginx libpq \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS libpq-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql opcache \
    && apk del .build-deps \
    && mkdir -p /run/nginx \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

FROM base AS vendor

RUN apk add --no-cache unzip
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

COPY . .
RUN composer dump-autoload --optimize --no-dev --no-interaction

FROM base

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-skaihub.ini"
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-skaihub.conf
COPY docker/nginx.conf.template /etc/nginx/skaihub.conf.template
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/skaihub-entrypoint

WORKDIR /var/www/html
COPY --from=vendor /app /var/www/html

RUN rm -rf docker \
    && mkdir -p storage/app/public storage/app/private storage/framework/cache/data \
       storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 10000

ENTRYPOINT ["skaihub-entrypoint"]
