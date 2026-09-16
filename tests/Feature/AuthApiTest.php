<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;
    /**
     * A basic feature test example.
     */
    public function test_user_can_register(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password'
        ]);

        // 201 ရလား
        $response->assertStatus(201);

        //DB ထဲ User တကယ်ဝင်လား
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
        ]);
    }

    public function test_register_requires_email(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'Test User1',
            'email' => '',
            'password' => 'password'
        ]);
        // 422 ရလား
        $response->assertStatus(422);

        //email validation error တကယ်ပါလား
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_valid_password(): void
    {
        $response = $this->postJson('api/register', [
            'name' => 'Test User2',
            'email' => 'password-test@example.com',
            'password' => '123'
        ]);

        // 422 ရလား
        $response->assertStatus(422);

        //Password 8 လုံးမပြည့်ရင် error တကယ်ပါလား
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::create([
            'name' => 'Test User3',
            'email' => 'test3@example.com',
            'password' => 'password'
        ]);

        $response = $this->postJson('api/register', [
            'name' => 'Test User3',
            'email' => 'test3@example.com',
            'password' => 'password'
        ]);

        // 422 ရလား
        $response->assertStatus(422);

        // email duplicate စစ်ထားလား
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login(): void
    {
        User::create([
            'name' => 'loginuser',
            'email' => 'loginuser@example.com',
            'password' => 'password'
        ]);

        $response = $this->postJson('api/login', [
            'email' => 'loginuser@example.com',
            'password' => 'password'
        ]);

        // 200 ရလား
        $response->assertStatus(200);

        //token ပါလား
        $response->assertJsonStructure([
            'token',
        ]);
    }

    public function test_login_rejects_invalid_password(): void
    {
        User::create([
            'name' => 'loginuser1',
            'email' => 'loginuser1@example.com',
            'password' => 'password'
        ]);

        $response = $this->postJson('api/login', [
            'email' => 'loginuser1@example.com',
            'password' => 'wrongpassword'
        ]);

        // 401 ရလား
        $response->assertStatus(401);
    }

    public function test_login_rejects_unknown_email(): void
    {

        $response = $this->postJson('api/login', [
            'email' => 'unknownemail@example.com',
            'password' => 'password'
        ]);

        // 401 ရလား
        $response->assertStatus(401);
    }

    public function test_user_can_logout(): void
    {
        $user = User::create([
            'name' => 'loginuser2',
            'email' => 'loginuser2@example.com',
            'password' => 'password'
        ]);

        //test request ကို $user က authenticated ဖြစ်ပြီး ပို့လာတယ်
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
