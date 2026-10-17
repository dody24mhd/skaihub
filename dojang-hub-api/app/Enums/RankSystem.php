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

    public static function defaultForSport(?string $sportType): self
    {
        return $sportType === 'karate' ? self::KarateForki : self::TaekwondoKukkiwon;
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
