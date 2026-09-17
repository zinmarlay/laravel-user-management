<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_users(): void
    {
        $user = User::create([
            'name' => 'Test User3',
            'email' => 'test3@example.com',
            'password' => 'password'
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('api/users');

        $response->assertStatus(200);

        //Response ထဲမှာ တကယ် user ပါလား ဆိုတာစစ်တာ
        $response->assertJsonPath('data.0.email', 'test3@example.com');
    }

    public function test_guest_cannot_view_users(): void
    {
        $response = $this->getJson('api/users');
        $response->assertStatus(401);
    }
    public function test_user_can_search_users(): void
    {
        $user = User::create(
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => 'password'
            ]
        );
        User::create(
            [
                'name' => 'Alice',
                'email' => 'alice@example.com',
                'password' => 'password'
            ]
        );

        Sanctum::actingAs($user);
        $response = $this->getJson('api/users?search=john');
        $response->assertStatus(200);

        // Search result ထဲမှာ John ပါလာတာကို စစ်တာ
        $response->assertJsonPath('data.0.email', 'john@example.com');

        // Search result ထဲမှာ Alice မပါကြောင်း စစ်တာ
        $response->assertJsonMissing([
            'email' => 'alice@example.com',
        ]);
    }

    public function test_user_can_paginate_users(): void
    {
        $user = User::create(
            [
                'name' => 'User1',
                'email' => 'user1@example.com',
                'password' => 'password'
            ]
        );

        for ($i = 2; $i <= 6; $i++) {
            $user = User::create(
                [
                    'name' => "User{$i}",
                    'email' => "user{$i}@example.com",
                    'password' => 'password'
                ]
            );
        }

        Sanctum::actingAs($user);
        $response = $this->getJson('api/users?page=2');
        $response->assertStatus(200);

        //pagination တကယ် 5 ယောက်ပဲ ပြန်ပေးလား စစ်မယ်။
        $response->assertJsonCount(1, 'data');
    }

    public function test_user_can_view_single_user(): void
    {
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->getJson("api/users/{$user->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('email', 'user@example.com');
    }

    public function test_user_cannot_view_single_user(): void
    {
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'password' => 'password'
            ]
        );
        $response = $this->getJson("api/users/{$user->id}");
        $response->assertStatus(401);
    }
    public function test_admin_can_create_user(): void
    {
        $user = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->postJson('api/users', [
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => 'password',
            'address' => 'user address name'
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'user@example.com',
        ]);
    }
    public function test_none_admin_cannot_create_user(): void
    {
        $user = User::create(
            [
                'name' => 'Role',
                'email' => 'role@example.com',
                'role' => 'role',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($user);

        $response = $this->postJson('api/users', [
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => 'password',
            'address' => 'user address name'
        ]);
        $response->assertStatus(403);
    }
    public function test_user_can_update_own_profile(): void
    {
        $user = User::create(
            [
                'name' => 'Role',
                'email' => 'role@example.com',
                'role' => 'role',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->putJson("api/users/{$user->id}", [
            'name' => 'Role Edit',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'name' => 'Role Edit',
        ]);
    }
    public function test_user_cannot_update_another_user(): void
    {
        $user1 = User::create(
            [
                'name' => 'Role',
                'email' => 'role@example.com',
                'role' => 'role',
                'password' => 'password'
            ]
        );
        $user2 = User::create(
            [
                'name' => 'Role2',
                'email' => 'role2@example.com',
                'role' => 'role',
                'password' => 'password'
            ]
        );

        Sanctum::actingAs($user1);
        $response = $this->putJson("api/users/{$user2->id}", [
            'name' => 'Role Edit',
        ]);
        $response->assertStatus(403);
    }

    public function test_admin_can_update_another_user(): void
    {
        $admin = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'password' => 'password'
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'role',
                'password' => 'password'
            ]
        );

        Sanctum::actingAs($admin);
        $response = $this->putJson("api/users/{$user->id}", [
            'name' => 'Edit User',
        ]);
        $response->assertStatus(200);
    }

    public function test_admin_can_update_user_role(): void
    {
        $admin = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'password' => 'password'
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'role',
                'password' => 'password'
            ]
        );

        Sanctum::actingAs($admin);
        $response = $this->patchJson("api/users/{$user->id}/role", [
            'role' => 'admin',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'admin',
        ]);
    }

    public function test_non_admin_cannot_update_user_role(): void
    {
        $user1 = User::create(
            [
                'name' => 'user1',
                'email' => 'user1@example.com',
                'role' => 'user',
                'password' => 'password'
            ]
        );
        $user2 = User::create(
            [
                'name' => 'user2',
                'email' => 'user2@example.com',
                'role' => 'user',
                'password' => 'password'
            ]
        );

        Sanctum::actingAs($user1);
        $response = $this->patchJson("api/users/{$user2->id}/role", [
            'role' => 'admin',
        ]);
        $response->assertStatus(403);
        $this->assertDatabaseHas('users', [
            'id' => $user2->id,
            'role' => 'user',
        ]);
    }

    public function test_invalid_role_cannot_be_updated(): void
    {
        $admin = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'password' => 'password'
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'user',
                'password' => 'password'
            ]
        );

        Sanctum::actingAs($admin);
        $response = $this->patchJson("api/users/{$user->id}/role", [
            'role' => 'manager',
        ]);
        $response->assertStatus(422);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'user',
        ]);
    }

    public function test_admin_can_delete_user(): void
    {
        $user = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->deleteJson("api/users/{$user->id}");
        $response->assertStatus(204);
        $this->assertDatabaseMissing('users');
    }

    public function test_admin_can_delete_another_user(): void
    {
        $admin = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'password' => 'password'
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'role',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($admin);
        $response = $this->deleteJson("api/users/{$user->id}");
        $response->assertStatus(204);
        $this->assertDatabaseMissing('users', [
            'email' => 'user@example.com',
        ]);
    }

    public function test_non_admin_cannot_delete_user(): void
    {
        $user1 = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'normal',
                'password' => 'password'
            ]
        );
        $user2 = User::create(
            [
                'name' => 'role',
                'email' => 'role@example.com',
                'role' => 'normal',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($user1);
        $response = $this->deleteJson("api/users/{$user2->id}");
        $response->assertStatus(403);
    }

    public function test_user_not_found_returns_404(): void
    {
        $user = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'normal',
                'password' => 'password'
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->getJson("api/users/999999");
        $response->assertJson([
            'message' => 'User not found',
        ]);
    }
}
