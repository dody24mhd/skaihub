<?php

namespace App\Services\Demo;

/**
 * Mengganti istilah Taekwondo pada teks demo menjadi istilah Karate.
 */
class KarateTextAdapter
{
    /** Istilah cabang olahraga. strtr() memilih kecocokan terpanjang lebih dulu. */
    private const SPORT_TERMS = [
        'TAEKWONDO' => 'KARATE',
        'Taekwondo' => 'Karate',
        'taekwondo' => 'karate',
        'TKD' => 'KRT',
        'Kukkiwon' => 'FORKI',
        'KUKKIWON' => 'FORKI',
        'KUKKI' => 'FORKI',
        'Poomsae' => 'Kata',
        'poomsae' => 'kata',
        'Kyorugi' => 'Kumite',
        'kyorugi' => 'kumite',
        'Dojang' => 'Dojo',
        'dojang' => 'dojo',
        'Geup' => 'Kyu',
        'geup' => 'kyu',
        'Sabeum' => 'Sensei',
        'sabeum' => 'sensei',
        'Dobok' => 'Karategi',
        'dobok' => 'karategi',
        'ap chagi' => 'mae geri',
        'dollyo chagi' => 'mawashi geri',
    ];

    /**
     * @param  array<string, string>  $academyNames  nama akademi sumber => nama akademi tujuan
     */
    public function __construct(private readonly array $academyNames) {}

    /** Ganti istilah olahraga dan nama akademi. */
    public function text(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return strtr($value, array_merge(self::SPORT_TERMS, $this->academyNames));
    }

    /** Hanya istilah olahraga; untuk alamat agar nama jalan (mis. "Jl. Sriwijaya") tetap. */
    public function sportOnly(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return strtr($value, self::SPORT_TERMS);
    }
}
