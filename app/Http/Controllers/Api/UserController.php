<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;
use App\Http\Resources\UserResource;

class UserController extends Controller
{
    /**
     * login၀င်တဲ့ user တိုင်းကိုuserlistပြမယ်
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', User::class);

        $users = User::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })->paginate(5);

        if ($users->isEmpty()) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {

        Gate::authorize('create', User::class); //create မှာ target User မရှိသေးလို့ User::class သုံး

        $validated = $request->validated(); //StoreUserRequest ပုံစံနဲ့ Validationကိုပြောင်း၇ေး

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'address' => $validated['address'] ?? null,
        ]);

        return (new UserResource($user)
            ->response()
            ->status(201));
    }

    /**
     * Display the specified resource.
     * Error ထည့်ချင်၇င် ဒီပုံစံထည့်
     */
    public function show(User $user)
    {
        try {
            Gate::authorize('view', $user);
            return response()->json($user);
        } catch (AuthorizationException $e) {
            return response()->json([
                'message' => 'You cannot view this user.'
            ], 403);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        /* Before Policy */
        // $user = User::findorFail($id);

        /* after policy */
        Gate::authorize('update', $user);

        $validated = $request->validated();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }
        $user->update($validated);
        return new UserResource($user);
    }

    /**
     * $user က ဖျက်ခံ၇မယ့် User ပါ
     * Gate::authorize('delete', $user); delete က policy က delete
     */
    public function destroy(User $user)
    {
        // $user = User::findorFail($id);
        Gate::authorize('delete', $user); // login ၀င်ထားတဲ့သူက delete route က $user ကိုဖျက်ခွင့်၇ှိလားစစ်
        $user->delete();

        return response()->noContent();
    }
}
