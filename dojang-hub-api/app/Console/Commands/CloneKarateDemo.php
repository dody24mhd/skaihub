<?php

namespace App\Console\Commands;

use App\Enums\RankSystem;
use App\Models\Akademi;
use App\Services\Demo\AcademyCloner;
use App\Services\Demo\AcademyPurger;
use App\Services\SubscriptionService;
use Database\Seeders\RankCatalogSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class CloneKarateDemo extends Command
{
    protected $signature = 'demo:clone-karate
        {--source=sriwijaya : Slug akademi demo sumber (Taekwondo)}
        {--slug=karate-musi : Slug akademi Karate tujuan}
        {--name=Karate Musi : Nama akademi Karate tujuan}
        {--assets= : Folder foto karate (default: ../dojang-hub-web/public/images/photos)}
        {--fresh : Hapus dulu akademi tujuan (hanya tujuan) bila slug sudah ada}';

    protected $description = 'Salin akademi demo Taekwondo menjadi akademi demo Karate (data, tanggal, dan struktur identik).';

    public function handle(AcademyPurger $purger, SubscriptionService $subscriptions): int
    {
        $sourceSlug = (string) $this->option('source');
        $targetSlug = (string) $this->option('slug');
        $targetName = (string) $this->option('name');
        $assetsDir = (string) ($this->option('assets') ?: base_path('../dojang-hub-web/public/images/photos'));

        $source = DB::table('akademi')->where('slug', $sourceSlug)->whereNull('deleted_at')->first();
        if (! $source) {
            $this->error("Akademi sumber [{$sourceSlug}] tidak ditemukan.");

            return self::FAILURE;
        }

        $existing = DB::table('akademi')->where('slug', $targetSlug)->first();
        if ($targetSlug === $sourceSlug || ($existing && (int) $existing->id === (int) $source->id)) {
            $this->error('Slug tujuan tidak boleh sama dengan akademi sumber.');

            return self::FAILURE;
        }
        if ($existing && ! $this->option('fresh')) {
            $this->error("Akademi [{$targetSlug}] sudah ada. Jalankan ulang dengan --fresh untuk menggantinya.");

            return self::FAILURE;
        }

        $this->ensureForkiCatalog();
        $cloner = new AcademyCloner;

        try {
            $counts = DB::transaction(function () use ($existing, $purger, $cloner, $source, $targetSlug, $targetName, $assetsDir) {
                if ($existing) {
                    $purger->purge((int) $existing->id);
                }

                return $cloner->clone($source, $targetSlug, $targetName, $assetsDir);
            });
        } catch (Throwable $e) {
            $this->error('Gagal menyalin akademi: '.$e->getMessage());

            return self::FAILURE;
        }

        if ($existing) {
            $purger->purgeFiles((int) $existing->id);
        }
        $cloner->copyAssets();

        $this->table(['Tabel', $sourceSlug, $targetSlug], collect($counts)
            ->map(fn (array $count, string $table) => [$table, $count['source'], $count['cloned']])->values()->all());

        $target = Akademi::findOrFail($cloner->targetId());
        $state = $subscriptions->lifecycleState($target);
        $this->info("Akademi [{$target->name}] #{$target->id} dibuat. Status langganan: {$state}.");
        if ($state === 'read_only') {
            $this->warn('Langganan sumber sudah habis sehingga akademi tujuan baca-saja. Perpanjang lewat Super Admin.');
        }

        return self::SUCCESS;
    }

    private function ensureForkiCatalog(): void
    {
        $hasForki = DB::table('sport_ranks')->whereNull('akademi_id')
            ->where('rank_system', RankSystem::KarateForki->value)->exists();

        if (! $hasForki) {
            $this->info('Katalog FORKI belum ada; menjalankan RankCatalogSeeder.');
            $this->callSilent('db:seed', ['--class' => RankCatalogSeeder::class, '--force' => true]);
        }
    }
}
