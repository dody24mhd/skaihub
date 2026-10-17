<?php

namespace Tests\Feature;

use App\Models\Compro\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_rate_limited_on_sixth_attempt(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/auth/login', [
                'email' => 'user@example.com',
                'password' => 'wrong-password',
            ]);
            $this->assertNotEquals(429, $response->status());
        }

        $sixth = $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'wrong-password',
        ]);

        $sixth->assertStatus(429);
    }

    public function test_login_rate_limiter_does_not_affect_different_emails(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'user-a@example.com',
                'password' => 'wrong-password',
            ]);
        }

        $sixthA = $this->postJson('/api/auth/login', [
            'email' => 'user-a@example.com',
            'password' => 'wrong-password',
        ]);
        $sixthA->assertStatus(429);

        $firstB = $this->postJson('/api/auth/login', [
            'email' => 'user-b@example.com',
            'password' => 'wrong-password',
        ]);
        $this->assertNotEquals(429, $firstB->status());
    }

    public function test_inquiries_are_rate_limited_on_fourth_attempt(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $response = $this->postJson('/api/compro/inquiries', [
                'person_name' => 'Calon Member',
                'phone' => '081234567890',
            ]);
            $response->assertCreated();
        }

        $fourth = $this->postJson('/api/compro/inquiries', [
            'person_name' => 'Calon Member',
            'phone' => '081234567890',
        ]);

        $fourth->assertStatus(429);
    }

    public function test_public_views_are_rate_limited_after_thirty_attempts(): void
    {
        $author = User::factory()->superAdmin()->create();
        $post = BlogPost::create([
            'title' => 'Tips Tendangan',
            'slug' => 'tips-tendangan',
            'content' => 'Konten tips tendangan',
            'author_id' => $author->id,
            'status' => 'published',
        ]);

        for ($i = 0; $i < 30; $i++) {
            $response = $this->postJson("/api/compro/blog/{$post->slug}/view");
            $response->assertOk();
        }

        $thirtyFirst = $this->postJson("/api/compro/blog/{$post->slug}/view");
        $thirtyFirst->assertStatus(429);
    }
}
