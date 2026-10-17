<?php

namespace Database\Seeders;

use App\Enums\RankSystem;
use App\Models\SportRank;
use Illuminate\Database\Seeder;

/**
 * Katalog sabuk bawaan per sistem tingkatan. Sumber & status konfirmasi: docs/RANK-SYSTEMS.md.
 */
class RankCatalogSeeder extends Seeder
{
    /**
     * Kode demo lama (sebelum L4-C) → kode katalog Kukkiwon. Id baris dipertahankan agar FK tetap utuh.
     */
    private const LEGACY_TAEKWONDO_CODES = [
        'white' => 'tkd-geup-10',
        'yellow' => 'tkd-geup-9',
        'green' => 'tkd-geup-7',
        'blue' => 'tkd-geup-5',
        'red' => 'tkd-geup-3',
        'poom' => 'tkd-poom-1',
        'black' => 'tkd-dan-1',
    ];

    private const COLOR_LABELS = [
        'white' => 'Putih',
        'yellow' => 'Kuning',
        'orange' => 'Oranye',
        'green' => 'Hijau',
        'blue' => 'Biru',
        'brown' => 'Coklat',
        'red' => 'Merah',
        'black' => 'Hitam',
        'red_black' => 'Merah-Hitam',
    ];

    public function run(): void
    {
        $this->remapLegacyTaekwondoRows();

        foreach (self::catalog() as $item) {
            // Match the DB unique key for global rows (sport_type, code) so a re-run
            // also repairs rows whose rank_system was re-backfilled after a rollback.
            SportRank::updateOrCreate(
                ['akademi_id' => null, 'sport_type' => $item['sport_type'], 'code' => $item['code']],
                $item,
            );
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function catalog(): array
    {
        return [
            ...self::kukkiwon(),
            ...self::forki(),
            ...self::kki(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function kukkiwon(): array
    {
        $geup = [
            10 => ['white', null],
            9 => ['yellow', null],
            8 => ['yellow', 'green'],
            7 => ['green', null],
            6 => ['green', 'blue'],
            5 => ['blue', null],
            4 => ['blue', 'red'],
            3 => ['red', null],
            2 => ['red', 'black'],
            1 => ['red', 'black'],
        ];

        $items = [];
        foreach ($geup as $number => [$belt, $stripe]) {
            $suffix = match ($number) {
                2 => ' 1',
                1 => ' 2',
                default => '',
            };
            $items[] = self::item(RankSystem::TaekwondoKukkiwon, 'tkd', 'geup', $number, $belt, $stripe, $suffix);
        }

        foreach (range(1, 4) as $number) {
            $items[] = self::item(RankSystem::TaekwondoKukkiwon, 'tkd', 'poom', $number, 'red_black');
        }

        foreach (range(1, 9) as $number) {
            $items[] = self::item(RankSystem::TaekwondoKukkiwon, 'tkd', 'dan', $number, 'black');
        }

        return $items;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function forki(): array
    {
        $kyu = [
            10 => 'white', 9 => 'yellow', 8 => 'yellow', 7 => 'orange', 6 => 'orange',
            5 => 'green', 4 => 'green', 3 => 'blue', 2 => 'blue', 1 => 'brown',
        ];

        $items = [];
        foreach ($kyu as $number => $belt) {
            $items[] = self::item(RankSystem::KarateForki, 'forki', 'kyu', $number, $belt);
        }

        foreach (range(1, 10) as $number) {
            $items[] = self::item(RankSystem::KarateForki, 'forki', 'dan', $number, 'black');
        }

        return $items;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function kki(): array
    {
        $kyu = [
            7 => ['white', ''],
            6 => ['yellow', ''],
            5 => ['green', ''],
            4 => ['blue', ' Strip'],
            3 => ['blue', ''],
            2 => ['brown', ' Strip'],
            1 => ['brown', ''],
        ];

        $items = [];
        foreach ($kyu as $number => [$belt, $suffix]) {
            $items[] = self::item(RankSystem::KarateKki, 'kki', 'kyu', $number, $belt, null, $suffix);
        }

        foreach (range(1, 10) as $number) {
            $items[] = self::item(RankSystem::KarateKki, 'kki', 'dan', $number, 'black');
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    private static function item(
        RankSystem $system,
        string $prefix,
        string $levelType,
        int $number,
        string $belt,
        ?string $stripe = null,
        string $labelSuffix = '',
    ): array {
        $isColorLevel = in_array($levelType, ['geup', 'kyu'], true);
        $color = self::COLOR_LABELS[$belt];
        if ($stripe !== null) {
            $color .= ' Strip '.self::COLOR_LABELS[$stripe];
        }

        return [
            'rank_system' => $system->value,
            'sport_type' => $system->sportType(),
            'code' => "{$prefix}-{$levelType}-{$number}",
            'label' => ucfirst($levelType)." {$number} ({$color}{$labelSuffix})",
            'sequence' => $isColorLevel ? (11 - $number) * 10 : 100 + $number * 10,
            'level_type' => $levelType,
            'level_number' => $number,
            'belt_color' => $belt,
            'stripe_color' => $stripe,
        ];
    }

    private function remapLegacyTaekwondoRows(): void
    {
        foreach (self::LEGACY_TAEKWONDO_CODES as $legacyCode => $catalogCode) {
            $legacy = SportRank::query()
                ->whereNull('akademi_id')
                ->where('sport_type', 'taekwondo')
                ->where('code', $legacyCode)
                ->first();

            $catalogExists = SportRank::query()
                ->whereNull('akademi_id')
                ->where('sport_type', 'taekwondo')
                ->where('code', $catalogCode)
                ->exists();

            if ($legacy && ! $catalogExists) {
                $legacy->update([
                    'code' => $catalogCode,
                    'rank_system' => RankSystem::TaekwondoKukkiwon->value,
                ]);
            }
        }
    }
}
