<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Throwable;

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

        $users->getCollection()->transform(
            fn (User $user) => (new UserResource($user))->toArray($request),
        );

        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {

        Gate::authorize('create', User::class); // create မှာ target User မရှိသေးလို့ User::class သုံး

        $validated = $request->validated(); // StoreUserRequest ပုံစံနဲ့ Validationကိုပြောင်း၇ေး

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'address' => $validated['address'] ?? null,
        ]);

        return response()->json(
            new UserResource($user),
            201
        );
    }

    /**
     * Display the specified resource.
     * Error ထည့်ချင်၇င် ဒီပုံစံထည့်
     */
    public function show(User $user)
    {
        try {
            Gate::authorize('view', $user);

            return new UserResource($user);
        } catch (AuthorizationException $e) {
            return response()->json([
                'message' => 'You cannot view this user.',
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
        $oldPhotoPath = $user->photo;
        $newPhotoPath = null;
        $removePhoto = (bool) ($validated['remove_photo'] ?? false);

        try {
            $updatedUser = DB::transaction(function () use (
                $request,
                $validated,
                $user,
                $removePhoto,
                &$newPhotoPath,
            ) {
                if ($request->hasFile('photo')) {
                    $newPhotoPath = $request->file('photo')->store(
                        'profile-photos',
                        'public',
                    );

                    if (! is_string($newPhotoPath) || $newPhotoPath === '') {
                        throw new \RuntimeException('The profile photo could not be stored.');
                    }
                }

                $profileFields = array_intersect_key(
                    $validated,
                    array_flip(['name', 'email', 'address']),
                );
                $user->fill($profileFields);

                if ($newPhotoPath !== null) {
                    $user->photo = $newPhotoPath;
                } elseif ($removePhoto) {
                    $user->photo = null;
                }

                $user->save();

                return $user->fresh();
            });

            if (
                $oldPhotoPath !== null
                && $oldPhotoPath !== ''
                && ($newPhotoPath !== null || $removePhoto)
                && $oldPhotoPath !== $updatedUser->photo
            ) {
                Storage::disk('public')->delete($oldPhotoPath);
            }

            return new UserResource($updatedUser);
        } catch (Throwable $exception) {
            if ($newPhotoPath !== null) {
                Storage::disk('public')->delete($newPhotoPath);
            }

            throw $exception;
        }
    }

    /**
     * Undocumented function
     *
     * @return void
     */
    public function updateRole(Request $request, User $user)
    {
        // ① Login user က role ပြောင်းခွင့်ရှိလား စစ်မယ်
        Gate::authorize('updateRole', $user);
        // ② role ကို validation လုပ်မယ်
        $validated = $request->validate([
            'role' => 'required|in:admin,user',
        ]);
        // ③ role update လုပ်မယ်
        $user->update([
            'role' => $validated['role'],
        ]);

        // ④ Updated user ကို response ပြန်မယ်
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
