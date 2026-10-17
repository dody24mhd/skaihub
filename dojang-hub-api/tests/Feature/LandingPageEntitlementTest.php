<?php

namespace Tests\Feature;

use App\Models\AcademyPublicProfile;
use App\Models\Akademi;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LandingPageEntitlementTest extends TestCase
{
    use RefreshDatabase;

    public function test_starter_cannot_update_public_profile(): void
    {
        $akademi = Akademi::create([
            'name' => 'Akademi Starter',
            'slug' => 'akademi-starter',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        Subscription::create([
            'akademi_id' => $akademi->id,
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 50,
            'extra_student_blocks' => 0,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'amount' => 99000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now(),
        ]);

        $admin = User::factory()->akademiAdmin($akademi->id)->create();
        Sanctum::actingAs($admin);

        $this->putJson('/api/akademi/public-profile', [
            'about' => 'Deskripsi akademi starter',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Paket langganan Anda tidak mencakup fitur website publik.');
    }

    public function test_active_pro_can_update_public_profile(): void
    {
        $akademi = Akademi::create([
            'name' => 'Akademi Pro Aktif',
            'slug' => 'akademi-pro-aktif',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        Subscription::create([
            'akademi_id' => $akademi->id,
            'plan' => 'pro',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 150,
            'extra_student_blocks' => 0,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'amount' => 199000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now(),
        ]);

        $admin = User::factory()->akademiAdmin($akademi->id)->create();
        Sanctum::actingAs($admin);

        $this->putJson('/api/akademi/public-profile', [
            'about' => 'Deskripsi akademi pro aktif',
        ])->assertOk();
    }

    public function test_expired_pro_cannot_access_public_endpoint(): void
    {
        $akademi = Akademi::create([
            'name' => 'Akademi Pro Expired',
            'slug' => 'akademi-pro-expired',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        AcademyPublicProfile::create([
            'akademi_id' => $akademi->id,
            'about' => 'Profil publik kami',
            'is_published' => true,
        ]);

        Subscription::create([
            'akademi_id' => $akademi->id,
            'plan' => 'pro',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 150,
            'extra_student_blocks' => 0,
            'starts_at' => now()->subMonths(2),
            'ends_at' => now()->subDays(10),
            'amount' => 199000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now()->subMonths(2),
        ]);

        $this->getJson('/api/public/akademi/akademi-pro-expired')
            ->assertNotFound()
            ->assertJsonPath('message', 'Halaman publik tidak tersedia untuk paket ini.');
    }
}
