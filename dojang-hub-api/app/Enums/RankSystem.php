<?php

namespace App\Enums;

enum RankSystem: string
{
    case TaekwondoKukkiwon = 'taekwondo_kukkiwon';
    case KarateForki = 'karate_forki';
    case KarateKki = 'karate_kki';

    public function sportType(): string
    {
        return match ($this) {
            self::TaekwondoKukkiwon => 'taekwondo',
            self::KarateForki, self::KarateKki => 'karate',
        };
    }

    /**
     * Cabang olahraga tanpa katalog (judo, silat, dll.) tidak punya sistem tingkatan.
     */
    public static function defaultForSport(?string $sportType): ?self
    {
        return match ($sportType) {
            'taekwondo' => self::TaekwondoKukkiwon,
            'karate' => self::KarateForki,
            default => null,
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
