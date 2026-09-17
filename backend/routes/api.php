<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/users', [ApiUserController::class, 'index']);
// Route::get('/users/{id}', [ApiUserController::class, 'show']);
// Route::post('/users', [ApiUserController::class, 'store']);
// Route::put('/users/{id}', [ApiUserController::class, 'update']);
// Route::delete('/users/{id}', [ApiUserController::class, 'destroy']);

/**
 * CRUD Route
 */
// Route::apiResource('/users', UserController::class);

/**
 * Middleware ခံပြီး login လုပ်မှ CRUD လုပ်လို့၇အောင်ကာတာ
 */
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);



Route::middleware('auth:sanctum')->group(
    function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::apiResource('/users', UserController::class);
    }

);
