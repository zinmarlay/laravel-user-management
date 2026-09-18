# Change Password Specification

## 1. Overview

Add an authenticated Change Password feature for the currently signed-in user. The feature is separate from Edit Profile and must never accept a target user ID. It includes current-password verification, new-password validation, confirmation validation, secure hashing, a focused Material UI dialog, safe error handling, and tests.

Admin Password Reset, changing another user's password, Forgot Password, email reset, password history, MFA/2FA, React Router, and new state-management or form libraries are out of scope.

This specification is based on the inspected implementation on branch `feature/change-password`.

## 2. Current Authentication Architecture

### 2.1 Backend authentication

The Laravel API uses Sanctum personal access tokens. The protected routes are inside `auth:sanctum` middleware in `backend/routes/api.php`:

- `GET /api/me`
- `POST /api/logout`
- `/api/users` resource routes
- `PATCH /api/users/{user}/role`

Public authentication routes are:

- `POST /api/register`
- `POST /api/login`

`AuthController::login()` looks up the user by email, verifies the submitted password with `Hash::check()`, creates a token using `$user->createToken('api-token')->plainTextToken`, and returns HTTP 200 with `message`, `user`, and `token`.

`AuthController::register()` hashes the password with `Hash::make()`, creates a token using the same token name, and returns HTTP 201 with `message`, a `UserResource` user, and `token`.

`AuthController::logout()` calls `$request->user()->currentAccessToken()->delete()` and returns HTTP 200 with `message`. This revokes only the token used by the request.

There is no existing password-change route, controller method, FormRequest, service, migration, password history, or token-expiration implementation.

### 2.2 User model and authorization

`backend/app/Models/User.php` uses `HasApiTokens`, so the authenticated user has a Sanctum `tokens()` relationship. Password and remember-token fields are hidden from model serialization. The model stores a casted/hashed password and currently allows password assignment for registration and existing model operations.

`UserPolicy` governs User List profile, edit, delete, and role actions. It does not define password-change authorization. Change Password authorization must come from `auth:sanctum` and `$request->user()`, not from `UserPolicy` or a user ID.

### 2.3 Frontend authentication

The frontend is a Vite React application using React 19 and Material UI. It does not use React Router, an authentication context, or a global state library.

- `frontend/src/App.jsx` owns the in-memory authenticated gate and sanitized `currentUser` state.
- `App.jsx` reads and writes the only token key, `localStorage['token']`.
- `LoginForm.jsx` calls `loginUser()` and clears the password after failed submission.
- `RegisterForm.jsx` calls `registerUser()` with `FormData` and clears password fields after failure.
- `authApi.js` owns login, registration, and logout API calls.
- `usersApi.js` owns protected User List/profile APIs and imports the shared `UsersApiError`.
- `apiError.js` defines `UsersApiError`, including `status`, `code`, and an internal `payload`.
- Protected services send `Authorization: Bearer <token>` from the existing localStorage key.
- A normalized `401` uses the existing App unauthenticated transition, which removes the token and renders LoginPage.

## 3. Current Password Handling Findings

The existing authoritative password rules are in `RegisterRequest`:

~~~php
'password' => ['required', 'string', 'min:8'],
'password_confirmation' => ['required', 'same:password'],
~~~

`UpdateUserRequest` explicitly prohibits `password` and `role`, so Edit Profile must remain password-free. The existing Login endpoint requires a password string but does not establish a reusable password rule object.

The inspected project does not use `Password::defaults()`, a custom password rule, password history, reuse tracking, or a Change Password implementation. The Change Password feature must therefore reuse the existing minimum length of 8 and Laravel hashing conventions.

## 4. Existing Backend Findings

There is currently no `POST /api/change-password` route. The recommended implementation is a dedicated method on `AuthController` with a new `ChangePasswordRequest`, because the operation belongs to authenticated account/authentication behavior rather than User CRUD.

The endpoint must be placed inside the existing `auth:sanctum` route group. It must obtain the user from `$request->user()` and must not accept a user ID, role, profile fields, or token in the request body.

The existing API commonly returns JSON validation responses with HTTP 422 and uses safe messages for authentication failures. The new endpoint must return only a safe success message and must never serialize a password, password hash, password confirmation, token, or raw exception details.

## 5. Existing Frontend Findings

`UserProfilePage.jsx` already displays a profile and opens `UserEditDialog`. `UserEditDialog.jsx` contains only Photo, Name, Email, and Address and must remain that way.

The existing login password field uses a controlled `TextField`, `InputAdornment`, keyboard-accessible `IconButton`, `type="password"` by default, and a text Show/Hide control. RegisterForm uses the same approach for password and confirmation fields. Change Password should follow this pattern without sharing password state with LoginForm or UserEditDialog.

`UserProfilePage` already displays an Edit Profile action and should add a separate Change Password action in the same action area. The page already has safe profile error handling and an `onUnauthenticated` callback.

## 6. Authentication and Token Behavior

### 6.1 Observed behavior

- Login and registration create a new Sanctum token on each successful authentication.
- The frontend stores only the returned token in `localStorage['token']`.
- Protected requests use that token as a bearer token.
- Logout revokes only the current Sanctum token.
- No existing code revokes tokens after a password change because the feature does not exist.

### 6.2 Decision for this feature

Changing a password is a security-sensitive event. After a successful password change, revoke all Sanctum tokens for the authenticated user through the existing `HasApiTokens` relationship (`$user->tokens()->delete()`). This invalidates the current browser token and any other active sessions without introducing a new token format or refresh contract.

The current browser must then:

1. Clear `localStorage['token']`.
2. Clear in-memory authenticated/current-user state through the existing App unauthenticated transition.
3. Render LoginPage.
4. Show a safe notice such as “Password changed successfully. Please sign in again.”

The backend must revoke tokens only after the password has been validated and persisted successfully. If validation or persistence fails, the existing password and existing tokens remain unchanged. This decision is explicit because the current architecture does not otherwise define password-change token behavior.

## 7. Change Password User Flow

1. An authenticated user opens their own Profile Page.
2. The user selects Change Password, separate from Edit Profile.
3. A modal dialog opens with Current Password, New Password, and Confirm New Password.
4. The user enters opaque password values without trimming or normalizing them.
5. Client validation prevents obviously invalid submissions.
6. The frontend sends the three password fields to `POST /api/change-password` with the existing bearer token.
7. Laravel authenticates the request, verifies the current password, validates the new password and confirmation, hashes the new password, persists it, and revokes all Sanctum tokens.
8. On HTTP 200, the dialog clears its fields, closes, and calls the App session-expiration/sign-out transition with a safe success notice.
9. App clears local authentication and renders LoginPage. The user can sign in with the new password.

## 8. UI/UX Specification

### 8.1 Profile Page action

Add a `Change Password` Material UI button beside `Edit Profile`. It must be clearly separate from profile editing and must not appear as a field inside `UserEditDialog`.

The action is available only on an authenticated profile page that the existing frontend authorization permits. The backend remains the final authentication boundary.

### 8.2 ChangePasswordDialog

Create `frontend/src/components/users/ChangePasswordDialog.jsx` only if no existing component can provide this focused behavior. The dialog must use MUI `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `TextField`, `Alert`, `Button`, `CircularProgress`, `InputAdornment`, and `IconButton` patterns already used in the project.

The dialog contains exactly three password fields:

1. Current Password (`current_password`)
2. New Password (`password`)
3. Confirm New Password (`password_confirmation`)

Each field:

- Uses `type="password"` by default.
- Has a separate accessible show/hide control or an equivalent accessible control.
- Uses `autoComplete="current-password"` for Current Password and appropriate new-password autocomplete values for the two new-password fields.
- Does not trim, transform, log, or expose its value.
- Is disabled while submission is pending.

Actions:

- Cancel closes the dialog when not submitting.
- Change Password submits the form.
- During submission, all fields, visibility controls, Cancel, and duplicate submissions are disabled.
- The submit button shows `CircularProgress` and a label such as `Changing password…`.
- The dialog has a labelled title, normal MUI focus trapping, keyboard support, and focus return to the Change Password button.

### 8.3 Success and failure states

On success, clear all three local field values and close the dialog before invoking the App authentication transition. LoginPage displays the safe re-authentication notice; it must not display any password or API payload.

On failure, clear password values after a submitted request, preserve only safe validation state, keep the dialog open for retry, and show field-level or form-level errors. Do not show raw backend messages, exception text, hashes, or request values.

## 9. Validation Rules

### 9.1 Client validation

- Current Password: required.
- New Password: required and at least 8 characters.
- Confirm New Password: required and exactly equal to New Password.
- Password values must not be trimmed.
- Client validation must prevent the request when these checks fail.

Client validation is an early UX aid only; Laravel remains authoritative.

### 9.2 Backend validation

`ChangePasswordRequest` should define:

~~~php
'current_password' => ['required', 'string'],
'password' => ['required', 'string', 'min:8'],
'password_confirmation' => ['required', 'same:password'],
~~~

The controller must retrieve `$request->user()` and verify the current password with `Hash::check($validated['current_password'], $user->password)`. If it does not match, return HTTP 422 with a safe validation error on `current_password` such as `The current password is incorrect.`

The implementation should reject a new password that matches the current password as a safe no-op prevention. This check must use hashing (`Hash::check`) and must not reveal the stored hash. Return a safe validation error on `password`.

After all validation succeeds, hash the new password with `Hash::make()` and persist it. Never accept or persist client-controlled role, user ID, token, or profile fields.

## 10. API Contract

### 10.1 Endpoint

~~~text
POST /api/change-password
Authorization: Bearer <current Sanctum token>
Accept: application/json
Content-Type: application/json
~~~

The route is inside `auth:sanctum`. The body is:

~~~json
{
  "current_password": "current secret",
  "password": "new secret",
  "password_confirmation": "new secret"
}
~~~

No user ID is accepted or required.

### 10.2 Success response

Return HTTP 200 with a safe direct JSON object:

~~~json
{
  "message": "Password changed successfully"
}
~~~

Do not return a token. The frontend must re-authenticate after all tokens are revoked.

### 10.3 Service behavior

Add `changePassword(currentPassword, newPassword, passwordConfirmation, signal)` to `frontend/src/services/authApi.js`. It must:

- Use the configured `VITE_API_BASE_URL` and existing endpoint normalization.
- Read the existing `token` localStorage key for the bearer header.
- Send JSON with the three fields and no user ID.
- Send `Accept: application/json` and `Content-Type: application/json`.
- Normalize network and HTTP failures into `UsersApiError`.
- Validate the response shape enough to reject malformed success responses.
- Never log or return password values, token values, raw payloads, or exception details.

## 11. Error Handling

Use the existing `UsersApiError` architecture. The service may retain the parsed payload internally for safe field-error mapping, but UI code must render only allowlisted/sanitized messages.

| Condition | Expected behavior |
| --- | --- |
| HTTP 200 | Clear fields, close dialog, revoke-token session transition, and show safe re-authentication notice. |
| HTTP 401 | Treat the session as expired; call existing `onUnauthenticated`, clear local token, and render LoginPage. |
| HTTP 403 | Keep dialog open and show a safe permission message; do not expose backend details. |
| HTTP 422 | Map `current_password`, `password`, and `password_confirmation` validation errors to the matching fields. Use safe fallback messages. |
| HTTP 404 | Show a generic “Password change is currently unavailable. Please try again later.” message. Do not expose route details. |
| HTTP 500/other HTTP error | Show “Password change failed. Please try again.” |
| Network error | Show a safe retryable connection message and keep the dialog open. |
| Malformed success response | Treat as failure, keep the session state unchanged until the result is known, and show a generic safe error. |
| Client validation failure | Do not send a request; show field-level errors. |

After a successful response, the frontend must not attempt protected requests with the revoked token. The App transition must clear the token and unmount protected content.

## 12. Security Considerations

- Verify the current password server-side with `Hash::check()`.
- Hash the new password server-side with `Hash::make()`.
- Never compare plaintext values with the stored hash directly.
- Never return password values or password hashes.
- Never store passwords in localStorage, `currentUser`, URLs, logs, or analytics.
- Keep password values only in the dialog state required for submission.
- Clear password fields after submission and before unmount where practical.
- Do not accept a user ID to select another password target.
- Always operate on `$request->user()`.
- Do not permit role changes or profile updates through this endpoint.
- Revoke all Sanctum tokens only after a successful password persistence operation.
- Do not expose raw Laravel payloads, stack traces, SQL errors, or backend exception details.
- Preserve the existing `auth:sanctum` middleware and bearer-token flow.
- Do not weaken UserPolicy or add Admin Password Reset behavior.

## 13. Authorization

| Action | Admin | Normal User |
| --- | --- | --- |
| Change own password | Allowed | Allowed |
| Change another user's password | Not supported | Not supported |
| Admin Password Reset | Future feature | Future feature |

The endpoint has no target-user authorization branch because it has no target user ID. Authentication is required, and the only password changed is the authenticated request user’s password.

Existing UserPolicy behavior for profile viewing/editing, Delete, and Change Role remains unchanged.

## 14. Frontend File Structure

Expected focused changes:

~~~text
frontend/src/
  App.jsx                         # optional notice/session transition support
  App.css                         # focused dialog/profile action styling if needed
  pages/
    LoginPage.jsx                 # optional safe re-authentication notice
    UserProfilePage.jsx           # Change Password action/dialog integration
  components/users/
    ChangePasswordDialog.jsx      # new focused dialog
  services/
    authApi.js                    # changePassword API function
    apiError.js                   # unchanged shared error class unless required
~~~

`UserEditDialog.jsx`, `usersApi.js`, User List search/pagination/actions, RegisterForm, and backend UserPolicy should remain behaviorally unchanged.

## 15. Backend Impact

Expected focused backend changes:

~~~text
backend/routes/api.php                         # add protected POST route
backend/app/Http/Controllers/Api/AuthController.php
                                                # add changePassword method
backend/app/Http/Requests/ChangePasswordRequest.php
                                                # new authoritative request validation
backend/tests/Feature/AuthApiTest.php           # change-password coverage
~~~

No migration, model-field change, storage change, UserPolicy change, or token-format change is required. The existing `HasApiTokens` relation is sufficient for revoking all tokens.

## 16. Test Scenarios

### Backend feature tests

Add tests covering:

1. Authenticated user can change their own password.
2. Guest receives 401 and cannot change a password.
3. Incorrect current password returns 422 on `current_password`.
4. Missing current password returns 422.
5. Missing new password returns 422.
6. New password shorter than 8 characters returns 422.
7. Missing confirmation returns 422.
8. Mismatched confirmation returns 422.
9. Reusing the current password is rejected safely.
10. The stored hash changes and verifies with the new password.
11. The old password no longer authenticates.
12. The new password authenticates successfully.
13. The response contains no password, password hash, confirmation, or token.
14. No user ID is required and a body user ID cannot redirect the operation to another user.
15. Successful password change revokes all Sanctum tokens, including the current token.
16. Invalid validation does not change the password or revoke tokens.
17. Existing Login, Register, Logout, Profile, Delete, and Change Role tests remain green.

### Frontend verification

Verify:

1. Profile Page shows Change Password separately from Edit Profile.
2. The dialog contains exactly three password fields.
3. Password visibility controls are keyboard accessible and disabled while submitting.
4. Client validation prevents invalid requests and does not trim passwords.
5. Duplicate submission is prevented and loading state is visible.
6. Safe 422 messages map to the correct fields.
7. 401 uses the existing unauthenticated transition.
8. Success clears fields, closes the dialog, clears local authentication, and returns to LoginPage with a safe notice.
9. Passwords are never written to localStorage/currentUser or rendered after submission.
10. Existing Profile Edit and User List behavior remains unchanged.

The frontend currently has no test script or test runner in `frontend/package.json`; do not add a test dependency solely for this feature. Use lint, production build, and focused manual/component verification consistent with the project setup.

## 17. Acceptance Criteria

1. Only authenticated users can call `POST /api/change-password`.
2. The endpoint operates only on `$request->user()` and accepts no target user ID.
3. Current password verification is authoritative and uses Laravel hashing.
4. New password and confirmation follow the existing 8-character minimum and matching convention.
5. Password reuse is rejected safely.
6. The new password is hashed before persistence.
7. Success returns HTTP 200 with only a safe message.
8. All Sanctum tokens are revoked after successful persistence, and the frontend requires sign-in again.
9. The Profile Page exposes a separate Change Password action.
10. The dialog has exactly three accessible password fields and safe loading/error states.
11. The existing UserEditDialog contains no password fields.
12. 401, 403, 404, 422, 500, network, and malformed-response cases are handled without sensitive disclosure.
13. Existing Login, Register, Logout, User Profile, User List, Delete, and Change Role behavior remains intact.
14. `npm run lint`, `npm run build`, `php artisan test`, and `git diff --check` pass.
15. No application changes are committed as part of specification creation.

## 18. Implementation Plan

1. Add `ChangePasswordRequest` with the authoritative validation rules and safe confirmation/reuse behavior.
2. Add `POST /api/change-password` inside the existing Sanctum middleware group.
3. Implement `AuthController::changePassword()` using `$request->user()`, `Hash::check()`, `Hash::make()`, persistence, and post-success token revocation.
4. Add backend tests for validation, hashing, response safety, authentication, and token behavior.
5. Add `changePassword()` to `authApi.js` with existing `UsersApiError` normalization.
6. Create `ChangePasswordDialog.jsx` with controlled fields, visibility controls, validation, loading, focus, and safe errors.
7. Integrate the dialog and Change Password button into `UserProfilePage.jsx`.
8. Add the minimal App/LoginPage notice/session transition required by the token-revocation decision.
9. Confirm UserEditDialog still contains only Photo, Name, Email, and Address.
10. Run backend tests, frontend lint/build, and `git diff --check`; inspect the final diff and status.

## 19. Open Questions / Assumptions

- The specification assumes the intended security behavior is revoking all Sanctum tokens and requiring re-login after a password change. This is the recommended decision because password changes invalidate existing credentials and the current project issues multiple independent tokens. If product requirements instead require keeping the current browser signed in, the token decision and success flow must be changed before implementation.
- The existing backend uses direct JSON responses for login/logout and resource responses for profile data; the Change Password response is specified as a direct JSON message to match the authentication-controller convention.
- The existing frontend has no automated test runner. Automated frontend tests are not added by this specification; lint/build plus focused manual verification are the available project-convention checks.
- Laravel Boost installation was attempted during repository setup but could not reach Packagist because DNS/network access was unavailable. This does not change the application architecture described here.
