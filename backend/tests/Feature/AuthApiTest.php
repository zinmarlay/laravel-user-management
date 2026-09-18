<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic feature test example.
     */
    public function test_user_can_register_with_photo_and_address(): void
    {
        Storage::fake('public');

        $response = $this->post('api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'address' => '123 Test Street',
            'photo' => UploadedFile::fake()->image('avatar.jpg'),
        ]);

        $response->assertCreated();
        $response->assertJsonStructure([
            'message',
            'token',
            'user' => ['id', 'name', 'email', 'address', 'photo', 'role'],
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'address' => '123 Test Street',
            'role' => 'user',
        ]);

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('password', $user->password));
        $this->assertNotNull($user->photo);
        Storage::disk('public')->assertExists($user->photo);
        $response->assertJsonPath(
            'user.photo',
            Storage::disk('public')->url($user->photo),
        );
    }

    public function test_register_requires_email(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'Test User1',
            'email' => '',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        // 422 ရလား
        $response->assertStatus(422);

        // email validation error တကယ်ပါလား
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_valid_password(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'Test User2',
            'email' => 'password-test@example.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        // 422 ရလား
        $response->assertStatus(422);

        // Password 8 လုံးမပြည့်ရင် error တကယ်ပါလား
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::create([
            'name' => 'Test User3',
            'email' => 'test3@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response = $this->postJson('api/register', [
            'name' => 'Test User3',
            'email' => 'test3@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        // 422 ရလား
        $response->assertStatus(422);

        // email duplicate စစ်ထားလား
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_password_confirmation(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'Confirmation User',
            'email' => 'confirmation@example.com',
            'password' => 'password',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['password_confirmation']);
    }

    public function test_register_rejects_mismatched_password_confirmation(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'Mismatch User',
            'email' => 'mismatch@example.com',
            'password' => 'password',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['password_confirmation']);
    }

    public function test_register_rejects_invalid_photo_type(): void
    {
        Storage::fake('public');

        $response = $this->post('api/register', [
            'name' => 'Invalid Photo User',
            'email' => 'invalid-photo@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'photo' => UploadedFile::fake()->create('document.pdf', 10, 'application/pdf'),
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['photo']);
        Storage::disk('public')->assertDirectoryEmpty('profile-photos');
    }

    public function test_register_rejects_oversized_photo(): void
    {
        Storage::fake('public');

        $response = $this->post('api/register', [
            'name' => 'Large Photo User',
            'email' => 'large-photo@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'photo' => UploadedFile::fake()->create('large.jpg', 2049, 'image/jpeg'),
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['photo']);
        Storage::disk('public')->assertDirectoryEmpty('profile-photos');
    }

    public function test_register_rejects_client_role_without_storing_photo(): void
    {
        Storage::fake('public');

        $response = $this->post('api/register', [
            'name' => 'Role Injection User',
            'email' => 'role-injection@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
            'photo' => UploadedFile::fake()->image('role-injection.jpg'),
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['role']);
        $this->assertDatabaseMissing('users', [
            'email' => 'role-injection@example.com',
        ]);
        Storage::disk('public')->assertDirectoryEmpty('profile-photos');
    }

    public function test_register_persists_null_address_and_null_photo(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'No Photo User',
            'email' => 'no-photo@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('user.address', null);
        $response->assertJsonPath('user.photo', null);
        $this->assertDatabaseHas('users', [
            'email' => 'no-photo@example.com',
            'address' => null,
            'photo' => null,
            'role' => 'user',
        ]);
    }

    public function test_user_can_login(): void
    {
        User::create([
            'name' => 'loginuser',
            'email' => 'loginuser@example.com',
            'password' => 'password',
        ]);

        $response = $this->postJson('api/login', [
            'email' => 'loginuser@example.com',
            'password' => 'password',
        ]);

        // 200 ရလား
        $response->assertStatus(200);

        // token ပါလား
        $response->assertJsonStructure([
            'token',
        ]);
    }

    public function test_login_rejects_invalid_password(): void
    {
        User::create([
            'name' => 'loginuser1',
            'email' => 'loginuser1@example.com',
            'password' => 'password',
        ]);

        $response = $this->postJson('api/login', [
            'email' => 'loginuser1@example.com',
            'password' => 'wrongpassword',
        ]);

        // 401 ရလား
        $response->assertStatus(401);
    }

    public function test_login_rejects_unknown_email(): void
    {

        $response = $this->postJson('api/login', [
            'email' => 'unknownemail@example.com',
            'password' => 'password',
        ]);

        // 401 ရလား
        $response->assertStatus(401);
    }

    public function test_user_can_logout(): void
    {
        $user = User::create([
            'name' => 'loginuser2',
            'email' => 'loginuser2@example.com',
            'password' => 'password',
        ]);

        // test request ကို $user က authenticated ဖြစ်ပြီး ပို့လာတယ်
        Sanctum::actingAs($user);

        $response = $this->postJson('api/logout');

        // 200 ရလား
        $response->assertStatus(200);
    }

    public function test_guest_cannot_logout(): void
    {
        $response = $this->postJson('api/logout');

        $response->assertStatus(401);
    }
}
