<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_users(): void
    {
        $user = User::create([
            'name' => 'Test User3',
            'email' => 'test3@example.com',
            'password' => 'password',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('api/users');

        $response->assertStatus(200);

        // Response ထဲမှာ တကယ် user ပါလား ဆိုတာစစ်တာ
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
                'password' => 'password',
            ]
        );
        User::create(
            [
                'name' => 'Alice',
                'email' => 'alice@example.com',
                'password' => 'password',
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
                'password' => 'password',
            ]
        );

        for ($i = 2; $i <= 6; $i++) {
            $user = User::create(
                [
                    'name' => "User{$i}",
                    'email' => "user{$i}@example.com",
                    'password' => 'password',
                ]
            );
        }

        Sanctum::actingAs($user);
        $response = $this->getJson('api/users?page=2');
        $response->assertStatus(200);

        // pagination တကယ် 5 ယောက်ပဲ ပြန်ပေးလား စစ်မယ်။
        $response->assertJsonCount(1, 'data');
    }

    public function test_user_can_view_single_user(): void
    {
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'password' => 'password',
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->getJson("api/users/{$user->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('data.email', 'user@example.com');
    }

    public function test_user_cannot_view_single_user(): void
    {
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'password' => 'password',
            ]
        );
        $response = $this->getJson("api/users/{$user->id}");
        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_view_another_user(): void
    {
        $viewer = User::create([
            'name' => 'Viewer',
            'email' => 'viewer@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);
        $target = User::create([
            'name' => 'Target',
            'email' => 'target@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);

        Sanctum::actingAs($viewer);
        $response = $this->getJson("api/users/{$target->id}");

        $response->assertForbidden();
        $response->assertJson([
            'message' => 'You cannot view this user.',
        ]);
    }

    public function test_admin_can_view_another_user_profile_resource(): void
    {
        Storage::fake('public');
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'profile-admin@example.com',
            'role' => 'admin',
            'password' => 'password',
        ]);
        $photoPath = UploadedFile::fake()->image('profile.jpg')->store(
            'profile-photos',
            'public',
        );
        $target = User::create([
            'name' => 'Target',
            'email' => 'profile-target@example.com',
            'role' => 'user',
            'photo' => $photoPath,
            'password' => 'password',
        ]);

        Sanctum::actingAs($admin);
        $response = $this->getJson("api/users/{$target->id}");

        $response->assertOk();
        $response->assertJsonPath('data.email', 'profile-target@example.com');
        $response->assertJsonPath(
            'data.photo',
            Storage::disk('public')->url($photoPath),
        );
        $response->assertJsonMissingPath('password');
    }

    public function test_user_list_returns_public_photo_urls(): void
    {
        Storage::fake('public');
        $viewer = User::create([
            'name' => 'Viewer',
            'email' => 'list-viewer@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);
        $photoPath = UploadedFile::fake()->image('list-photo.jpg')->store(
            'profile-photos',
            'public',
        );
        $target = User::create([
            'name' => 'List Target',
            'email' => 'list-target@example.com',
            'role' => 'user',
            'photo' => $photoPath,
            'password' => 'password',
        ]);

        Sanctum::actingAs($viewer);
        $response = $this->getJson('api/users');

        $response->assertOk();
        $response->assertJsonPath(
            'data.1.photo',
            Storage::disk('public')->url($photoPath),
        );
        $response->assertJsonMissingPath('data.1.password');
        $this->assertSame($target->id, $response->json('data.1.id'));
    }

    public function test_admin_can_create_user(): void
    {
        $user = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'password' => 'password',
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->postJson('api/users', [
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => 'password',
            'address' => 'user address name',
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
                'password' => 'password',
            ]
        );
        Sanctum::actingAs($user);

        $response = $this->postJson('api/users', [
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => 'password',
            'address' => 'user address name',
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
                'password' => 'password',
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

    public function test_user_can_update_profile_with_replacement_photo(): void
    {
        Storage::fake('public');
        $user = User::create([
            'name' => 'Photo User',
            'email' => 'photo-user@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);
        $oldPhotoPath = UploadedFile::fake()->image('old.jpg')->store(
            'profile-photos',
            'public',
        );
        $user->update(['photo' => $oldPhotoPath]);

        Sanctum::actingAs($user);
        $response = $this->post("api/users/{$user->id}", [
            '_method' => 'PUT',
            'name' => 'Updated Photo User',
            'email' => 'photo-user@example.com',
            'address' => 'Updated address',
            'photo' => UploadedFile::fake()->image('new.png'),
        ]);

        $response->assertOk();
        $updatedUser = $user->fresh();
        $this->assertSame('Updated Photo User', $updatedUser->name);
        $this->assertSame('Updated address', $updatedUser->address);
        $this->assertNotSame($oldPhotoPath, $updatedUser->photo);
        Storage::disk('public')->assertMissing($oldPhotoPath);
        Storage::disk('public')->assertExists($updatedUser->photo);
        $response->assertJsonPath(
            'data.photo',
            Storage::disk('public')->url($updatedUser->photo),
        );
    }

    public function test_user_can_remove_profile_photo(): void
    {
        Storage::fake('public');
        $user = User::create([
            'name' => 'Remove Photo User',
            'email' => 'remove-photo@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);
        $oldPhotoPath = UploadedFile::fake()->image('remove.jpg')->store(
            'profile-photos',
            'public',
        );
        $user->update(['photo' => $oldPhotoPath]);

        Sanctum::actingAs($user);
        $response = $this->post("api/users/{$user->id}", [
            '_method' => 'PUT',
            'name' => $user->name,
            'email' => $user->email,
            'remove_photo' => '1',
        ]);

        $response->assertOk();
        $this->assertNull($user->fresh()->photo);
        Storage::disk('public')->assertMissing($oldPhotoPath);
        $response->assertJsonPath('data.photo', null);
    }

    public function test_profile_update_rejects_password_and_role_fields(): void
    {
        $user = User::create([
            'name' => 'Protected Fields User',
            'email' => 'protected-fields@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);

        Sanctum::actingAs($user);
        $response = $this->putJson("api/users/{$user->id}", [
            'name' => 'Changed',
            'password' => 'new-password',
            'role' => 'admin',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['password', 'role']);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Protected Fields User',
            'role' => 'user',
        ]);
    }

    public function test_profile_update_cleans_new_photo_when_database_update_fails(): void
    {
        Storage::fake('public');
        $user = User::create([
            'name' => 'Cleanup User',
            'email' => 'cleanup@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);

        User::saving(function (): void {
            throw new \RuntimeException('Simulated database failure.');
        });

        Sanctum::actingAs($user);

        try {
            $this->withoutExceptionHandling();
            $this->post("api/users/{$user->id}", [
                '_method' => 'PUT',
                'name' => 'Cleanup User',
                'email' => 'cleanup@example.com',
                'photo' => UploadedFile::fake()->image('cleanup.jpg'),
            ]);
            $this->fail('The simulated database failure should be rethrown.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Simulated database failure.', $exception->getMessage());
        } finally {
            User::flushEventListeners();
        }

        Storage::disk('public')->assertDirectoryEmpty('profile-photos');
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'photo' => null,
        ]);
    }

    public function test_profile_update_preserves_existing_photo_when_database_update_fails(): void
    {
        Storage::fake('public');
        $user = User::create([
            'name' => 'Preserve Photo User',
            'email' => 'preserve-photo@example.com',
            'role' => 'user',
            'password' => 'password',
        ]);
        $oldPhotoPath = UploadedFile::fake()->image('existing.jpg')->store(
            'profile-photos',
            'public',
        );
        $user->update(['photo' => $oldPhotoPath]);

        User::saving(function (): void {
            throw new \RuntimeException('Simulated database failure.');
        });

        Sanctum::actingAs($user);

        try {
            $this->withoutExceptionHandling();
            $this->post("api/users/{$user->id}", [
                '_method' => 'PUT',
                'name' => 'Preserve Photo User',
                'email' => 'preserve-photo@example.com',
                'photo' => UploadedFile::fake()->image('replacement.jpg'),
            ]);
            $this->fail('The simulated database failure should be rethrown.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Simulated database failure.', $exception->getMessage());
        } finally {
            User::flushEventListeners();
        }

        Storage::disk('public')->assertExists($oldPhotoPath);
        Storage::disk('public')->assertCount('profile-photos', 1);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'photo' => $oldPhotoPath,
        ]);
    }

    public function test_user_cannot_update_another_user(): void
    {
        $user1 = User::create(
            [
                'name' => 'Role',
                'email' => 'role@example.com',
                'role' => 'role',
                'password' => 'password',
            ]
        );
        $user2 = User::create(
            [
                'name' => 'Role2',
                'email' => 'role2@example.com',
                'role' => 'role',
                'password' => 'password',
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
                'password' => 'password',
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'role',
                'password' => 'password',
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
                'password' => 'password',
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'role',
                'password' => 'password',
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
                'password' => 'password',
            ]
        );
        $user2 = User::create(
            [
                'name' => 'user2',
                'email' => 'user2@example.com',
                'role' => 'user',
                'password' => 'password',
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
                'password' => 'password',
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'user',
                'password' => 'password',
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
                'password' => 'password',
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
                'password' => 'password',
            ]
        );
        $user = User::create(
            [
                'name' => 'User',
                'email' => 'user@example.com',
                'role' => 'role',
                'password' => 'password',
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
                'password' => 'password',
            ]
        );
        $user2 = User::create(
            [
                'name' => 'role',
                'email' => 'role@example.com',
                'role' => 'normal',
                'password' => 'password',
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
                'password' => 'password',
            ]
        );
        Sanctum::actingAs($user);
        $response = $this->getJson('api/users/999999');
        $response->assertJson([
            'message' => 'User not found',
        ]);
    }
}
