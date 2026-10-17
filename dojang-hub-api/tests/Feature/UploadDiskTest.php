<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SppBill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UploadDiskTest extends TestCase
{
    use RefreshDatabase;

    private const R2_URL = 'https://pub-test.r2.dev';

    private Akademi $akademi;

    private SppBill $bill;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Akademi Elang',
            'slug' => 'akademi-elang',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
        $this->giveActiveSubscription($this->akademi);

        $student = $this->akademi->siswa()->create([
            'member_number' => 'ELG-001',
            'name' => 'Sari',
            'gender' => 'female',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'status' => 'active',
        ]);

        $this->bill = $this->akademi->sppBills()->create([
            'student_id' => $student->id,
            'billing_year' => 2026,
            'billing_month' => 5,
            'amount' => 100000,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs(User::factory()->akademiAdmin($this->akademi->id)->create());
    }

    private function useR2Disk(): void
    {
        config(['filesystems.upload_disk' => 's3']);
        Storage::fake('s3', ['url' => self::R2_URL]);
        Storage::fake('public');
    }

    private function pay(string $proofUrl)
    {
        return $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => $proofUrl,
        ]);
    }

    public function test_upload_uses_public_disk_by_default(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/akademi/upload/file', [
            'purpose' => 'spp_proof',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertCreated();

        Storage::disk('public')->assertExists($response->json('path'));
        $this->assertStringContainsString(
            "/storage/akademi/{$this->akademi->id}/spp-proofs/",
            $response->json('url')
        );
    }

    public function test_akademi_upload_is_stored_on_configured_upload_disk(): void
    {
        $this->useR2Disk();

        $response = $this->postJson('/api/akademi/upload/file', [
            'purpose' => 'spp_proof',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertCreated();

        $path = $response->json('path');
        Storage::disk('s3')->assertExists($path);
        Storage::disk('public')->assertMissing($path);
        $this->assertSame(self::R2_URL.'/'.$path, $response->json('url'));
    }

    public function test_admin_image_upload_is_stored_on_configured_upload_disk(): void
    {
        $this->useR2Disk();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $response = $this->postJson('/api/admin/upload/image', [
            'image' => UploadedFile::fake()->image('banner.png'),
        ])->assertOk();

        $this->assertStringStartsWith(self::R2_URL.'/uploads/images/', $response->json('url'));
        $path = substr($response->json('url'), strlen(self::R2_URL) + 1);
        Storage::disk('s3')->assertExists($path);
    }

    public function test_proof_url_from_upload_disk_is_accepted(): void
    {
        $this->useR2Disk();

        $url = $this->postJson('/api/akademi/upload/file', [
            'purpose' => 'spp_proof',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertCreated()->json('url');

        $this->pay($url)->assertOk();
        $this->assertDatabaseHas('spp_payments', ['spp_bill_id' => $this->bill->id, 'proof_url' => $url]);
    }

    public function test_proof_url_validation_on_upload_disk_rejects_foreign_or_missing_files(): void
    {
        $this->useR2Disk();
        $id = $this->akademi->id;
        $otherId = $id + 99;
        Storage::disk('s3')->put("akademi/{$otherId}/spp-proofs/x.png", 'x');
        Storage::disk('s3')->put("akademi/{$id}/spp-proofs/own.png", 'x');
        Storage::disk('public')->put("akademi/{$id}/spp-proofs/local.png", 'x');

        $rejected = [
            'other host' => "https://evil.example/akademi/{$id}/spp-proofs/x.png",
            'other academy' => self::R2_URL."/akademi/{$otherId}/spp-proofs/x.png",
            'missing file' => self::R2_URL."/akademi/{$id}/spp-proofs/missing.png",
            'traversal' => self::R2_URL."/akademi/{$id}/../{$otherId}/spp-proofs/x.png",
            'encoded traversal' => self::R2_URL."/akademi/{$id}/%2e%2e/{$otherId}/spp-proofs/x.png",
            'query' => self::R2_URL."/akademi/{$id}/spp-proofs/x.png?a=1",
            'local disk path' => "/storage/akademi/{$id}/spp-proofs/local.png",
            'api host on cloud disk' => config('app.url')."/akademi/{$id}/spp-proofs/own.png",
            'path only on cloud disk' => "/akademi/{$id}/spp-proofs/own.png",
        ];

        foreach ($rejected as $case => $url) {
            $this->assertSame(422, $this->pay($url)->status(), "Kasus '{$case}' seharusnya ditolak.");
        }

        $this->assertDatabaseCount('spp_payments', 0);
    }
}
