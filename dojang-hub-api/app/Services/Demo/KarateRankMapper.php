<?php

namespace App\Services\Demo;

use App\Enums\RankSystem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Memetakan tingkatan sumber ke tingkatan global FORKI dengan posisi urut yang sama.
 * Posisi = peringkat padat (dense rank) berdasarkan sequence di dalam sistem tingkatannya,
 * sehingga Poom 1 dan Dan 1 (sequence sama) jatuh ke posisi yang sama. Posisi di atas
 * tingkatan FORKI tertinggi dijepit ke tingkatan tertinggi.
 */
class KarateRankMapper
{
    /** @var list<int> id FORKI per posisi */
    private array $targetByOrdinal;

    /** @var array<int, int> id sumber => id FORKI */
    private array $map = [];

    public function __construct(int $sourceAkademiId, string $targetSystem = RankSystem::KarateForki->value)
    {
        $this->targetByOrdinal = DB::table('sport_ranks')
            ->whereNull('akademi_id')->where('rank_system', $targetSystem)
            ->orderBy('sequence')->orderBy('id')->get(['id', 'sequence'])
            ->unique('sequence')->pluck('id')->values()->all();

        if ($this->targetByOrdinal === []) {
            throw new RuntimeException("Katalog tingkatan global [{$targetSystem}] kosong.");
        }

        DB::table('sport_ranks')
            ->where(fn ($q) => $q->whereNull('akademi_id')->orWhere('akademi_id', $sourceAkademiId))
            ->orderBy('sequence')->orderBy('id')
            ->get(['id', 'rank_system', 'sport_type', 'akademi_id', 'sequence'])
            ->groupBy(fn ($rank) => ($rank->rank_system ?? $rank->sport_type).'|'.($rank->akademi_id ? 'own' : 'global'))
            ->each(fn (Collection $group) => $this->mapGroup($group));
    }

    public function map(?int $rankId): ?int
    {
        if ($rankId === null) {
            return null;
        }

        return $this->map[$rankId] ?? throw new RuntimeException("Tingkatan sumber #{$rankId} tidak bisa dipetakan.");
    }

    /** @param  Collection<int, object>  $group  satu sistem tingkatan, urut sequence */
    private function mapGroup(Collection $group): void
    {
        $highest = count($this->targetByOrdinal) - 1;
        $ordinal = -1;
        $lastSequence = null;

        foreach ($group as $rank) {
            if ((int) $rank->sequence !== $lastSequence) {
                $ordinal++;
                $lastSequence = (int) $rank->sequence;
            }
            $this->map[(int) $rank->id] = $this->targetByOrdinal[min($ordinal, $highest)];
        }
    }
}
