<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThrottleMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_throttled_request_returns_indonesian_message_with_retry_seconds(): void
    {
        // Arrange
        $payload = ['email' => 'user@example.com', 'password' => 'wrong-password'];
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', $payload);
        }

        // Act
        $response = $this->postJson('/api/auth/login', $payload);

        // Assert
        $response->assertStatus(429);
        $retryAfter = (int) $response->headers->get('Retry-After');
        $this->assertGreaterThan(0, $retryAfter);
        $response->assertExactJson([
            'message' => "Terlalu banyak percobaan. Coba lagi dalam {$retryAfter} detik.",
        ]);
    }

    public function test_throttled_inquiry_also_uses_indonesian_message(): void
    {
        // Arrange
        $payload = ['person_name' => 'Calon Member', 'phone' => '081234567890'];
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/compro/inquiries', $payload);
        }

        // Act
        $response = $this->postJson('/api/compro/inquiries', $payload);

        // Assert
        $response->assertStatus(429);
        $this->assertMatchesRegularExpression(
            '/^Terlalu banyak percobaan\. Coba lagi dalam \d+ detik\.$/',
            $response->json('message'),
        );
    }
}
