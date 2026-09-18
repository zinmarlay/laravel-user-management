# User Registration Specification

## 1. Overview

Add a public registration flow using the existing React, Vite, Material UI, and Laravel authentication architecture.

The form supports Name, Photo as an optional real image file, Email, Password, Confirm Password, and Address. Role is never user-controlled. New accounts receive the normal user role.

The existing Laravel registration endpoint returns a token and user object, so successful registration will automatically sign the user in and render the protected User List. The complete feature requires both frontend work and backend work for multipart image handling and authoritative password confirmation. This document is specification only; no code is implemented here.

Password Change, Admin Password Reset, profile management, email verification, forgot password, and password reset are out of scope.

## 2. Current Architecture Findings

### 2.1 Frontend

- React 19, Vite, Material UI, browser fetch, and plain CSS are used.
- There is no React Router, auth context, global store, form library, or i18n dependency.
- App.jsx owns the authentication gate, localStorage token key token, and in-memory sanitized currentUser.
- LoginPage.jsx renders the existing branded card; LoginForm.jsx owns controlled fields, validation, loading, password visibility, and errors.
- authApi.js owns authentication calls and shares UsersApiError from apiError.js.
- App.css contains the existing responsive Login and User List visual language.

### 2.2 Existing form conventions

Registration should match LoginForm.jsx:

- Controlled React state.
- MUI TextField, Stack, Alert, Button, and CircularProgress.
- noValidate with explicit validation.
- Field-level errors and safe form-level errors.
- Disabled controls and duplicate-submit prevention while pending.
- Email is trimmed; passwords are not trimmed.
- Password values are cleared after failed submission.

No English/Japanese i18n system exists. Use English strings now, but keep new labels and messages replaceable by a future translation layer without changing behavior.

### 2.3 Existing image conventions

No existing registration upload or image validation exists.

- The users table has nullable string photo.
- User is fillable for photo.
- UserAvatar consumes a raw photo string and falls back to initials.
- No FormData, UploadedFile, Storage::store, image validation, or upload endpoint is currently used.
- Laravel already defines a public disk at storage/app/public and a public/storage symbolic-link target.
- The inspected working tree does not contain the public/storage link.

This specification defines the new image contract as JPEG, PNG, or WebP, maximum 2 MB.

## 3. Existing Backend Registration Findings

### 3.1 Current route and response

The public route is:

```text
POST /api/register
```

It is outside auth:sanctum. AuthController::register currently validates name, email, and password, hashes the password, creates a Sanctum token, and returns HTTP 201:

```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "name": "New User",
        "email": "new@example.com",
        "address": null,
        "photo": null,
        "role": "user",
        "created_at": "2026-01-01T00:00:00.000000Z",
        "updated_at": "2026-01-01T00:00:00.000000Z"
    },
    "token": "1|sanctum-plain-text-token"
}
```

The exact values are data-dependent. User hides password and remember_token from serialization.

### 3.2 Current backend validation and gaps

Current rules are:

```text
name:     required|string|max:255
email:    required|email|unique:users,email
password: required|string|min:8
```

There is no authoritative password_confirmation, address, or photo rule in AuthController::register.

Address is nullable in the database and StoreUserRequest, but current registration does not persist it. Photo is a nullable string column, but current registration does not accept or store it. Extra request fields are not effective registration fields.

### 3.3 Role

The users migration defines role as a string with default user. The current registration controller does not accept role, so the database default applies. The new implementation must preserve this behavior or explicitly force user. A client-provided role must be ignored or rejected and must never create an administrator.

### 3.4 Storage configuration

The public disk is configured with root storage/app/public and URL based on APP_URL/storage. The implementation must use this public disk, generated Laravel storage names, and the standard storage:link setup. It must not trust the original filename or expose a filesystem path.

### 3.5 Existing tests

AuthApiTest covers successful registration, required email, minimum password, duplicate email, login, and logout. It does not cover multipart images, image limits/types, confirmation, address/photo persistence, public photo URLs, cleanup, or role injection.

## 4. Existing Frontend Authentication Findings

authApi.js currently provides loginUser and logoutUser. Login sends JSON to POST /api/login without a bearer token. A successful response must contain a non-empty token.

App.jsx stores the token only under localStorage key token, sanitizes user to id/name/email/role, and renders UserListPage. Logout and protected-request 401 responses clear authentication and render LoginPage.

Registration must reuse the existing onAuthenticated callback and token convention. It must not create another token key, persist passwords, or change protected User List behavior.

## 5. Registration User Flow

1. App renders LoginPage when no usable token exists.
2. LoginPage exposes an accessible Register link/button.
3. App switches between LoginPage and RegisterPage with local unauthenticated-screen state; no router or reload is required.
4. RegisterPage collects Name, Photo file, Email, Password, Confirm Password, and Address.
5. The frontend validates fields, image type/size, and password equality.
6. authApi.js sends a multipart/form-data request to POST /api/register.
7. Laravel validates all fields, stores the image, hashes the password, creates a user with role user, validates password confirmation, creates a token, and returns the existing response shape.
8. App stores the token through the existing authentication callback, retains safe identity fields, and renders UserListPage.
9. Failed registration stays on RegisterPage, clears passwords, preserves safe values, and does not change authentication.

## 6. UI/UX Specification

### 6.1 Page and navigation

Create RegisterPage.jsx using the existing LoginPage card, branding, spacing, and responsive behavior. Include a heading such as Create account, supporting text, RegisterForm, and an accessible Already have an account? Sign in action.

LoginPage receives an onRegister callback or equivalent App-owned navigation callback. RegisterPage receives an onLogin callback. Do not add a router.

### 6.2 Fields

| Field            | Control                           | Required | Behavior                                  |
| ---------------- | --------------------------------- | -------- | ----------------------------------------- |
| Name             | MUI TextField                     | Yes      | Trim for validation/submission; max 255.  |
| Photo            | MUI button plus native file input | No       | Real file; JPEG, PNG, WebP; maximum 2 MB. |
| Email            | MUI email TextField               | Yes      | Trim before validation/submission.        |
| Password         | MUI password TextField            | Yes      | Do not trim; minimum 8 characters.        |
| Confirm Password | MUI password TextField            | Yes      | Must exactly match Password.              |
| Address          | Multiline MUI TextField           | No       | Nullable/blank.                           |

No role selector, hidden role input, admin option, or role FormData field is allowed.

### 6.3 File picker, validation, and preview

The Photo field must not be a URL/path text field.

- Use a visible Choose photo or Select image MUI button associated with a native input type=file.
- Set accept to image/jpeg,image/png,image/webp.
- Allow zero or one file.
- Validate MIME type and size in JavaScript; maximum is 2 MB or 2,097,152 bytes.
- The accept attribute is only a picker hint; Laravel repeats validation.
- Show the filename and a preview using URL.createObjectURL.
- Provide an accessible, keyboard-usable Remove photo action.
- Replacing a file replaces the preview and revokes the prior object URL.
- Revoke object URLs on replacement, removal, cancellation, and component unmount.
- Do not convert to base64 or persist File objects, object URLs, or image bytes.
- Keep a valid file/preview for retry after a recoverable server error; clear it on successful completion or explicit reset.
- Invalid files must not trigger an API request.

Use helper text such as Choose a JPEG, PNG, or WebP image up to 2 MB.

### 6.4 Loading, success, and accessibility

While submitting, disable fields, file picker, Remove photo, password toggles, navigation, and submit activation. Show CircularProgress and Creating account….

Use explicit labels, associated helper/error text, visible focus, Enter submission, keyboard file selection, and role=alert or MUI Alert for form errors. Keep the card and long filenames/messages within the viewport on mobile.

On success, do not show password, confirmation, token, or raw response data. Invoke App's existing authentication callback and render UserListPage without a full reload.

## 7. Validation Rules

### 7.1 Laravel authoritative rules

The registration request must enforce:

```text
name:                  required|string|max:255
email:                 required|email|unique:users,email
password:              required|string|min:8
password_confirmation: required|same:password
address:               nullable|string
photo:                 nullable|image|mimes:jpeg,png,webp|max:2048
```

Laravel max:2048 is kilobytes and corresponds to 2 MB. Role is not an accepted request field.

### 7.2 Frontend early validation

- Name is non-empty after trimming and at most 255 characters.
- Email is non-empty, trimmed, and reasonably formatted.
- Photo is optional, but selected files must be JPEG, PNG, or WebP and no larger than 2 MB.
- Password is non-empty and at least 8 characters.
- Confirm Password is non-empty and equals the untrimmed Password.
- Address may be blank.
- Role is never represented or client-controlled.

Laravel repeats security-sensitive validation and is authoritative. Password confirmation must no longer be frontend-only.

## 8. API Contract

### 8.1 Multipart request

Use public POST API_BASE_URL/api/register with Accept: application/json and a FormData body. Do not manually set Content-Type; the browser must add the multipart boundary. Do not send a bearer token.

FormData fields:

```text
name:                  string
photo:                 optional image File
email:                 string
password:              string
password_confirmation: string
address:               optional string or nullable-compatible blank value
```

Trim name/email. Do not trim password or confirmation. Append photo only when a valid File exists. Never append role, token, preview URL, object URL, timestamps, or unknown state.

### 8.2 Service

Add registerUser() to authApi.js beside loginUser and logoutUser. It must use the existing base URL helper, FormData, safe JSON parsing, UsersApiError normalization, and non-empty-token response validation. It must not alter usersApi.js or existing login/logout behavior.

### 8.3 Response and photo URL

Preserve HTTP 201 and the message/user/token response. When a file exists, UserResource must return a safe public URL:

```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "name": "New User",
        "email": "new@example.com",
        "address": "Optional address",
        "photo": "http://localhost:8000/storage/profile-photos/generated-name.webp",
        "role": "user",
        "created_at": "2026-01-01T00:00:00.000000Z",
        "updated_at": "2026-01-01T00:00:00.000000Z"
    },
    "token": "1|sanctum-plain-text-token"
}
```

When absent, photo is null. Store a relative generated path such as profile-photos/generated-name.webp in the database, then serialize it through the public disk URL, for example Storage::disk('public')->url(photo). The frontend consumes the returned URL as-is.

## 9. Authentication Behavior

Automatic sign-in is selected because the current endpoint already returns a token and user object.

App.jsx needs local unauthenticated-screen state such as login/register. It renders the selected page, passes the existing authentication callback to RegisterPage, and resets to LoginPage after logout/session expiration. It continues using localStorage key token and the existing safe currentUser sanitizer.

Registration failure or malformed success must not write a token or set authenticated state. Password, confirmation, File objects, and previews must not enter localStorage or currentUser.

## 10. Error Handling and Cleanup

### 10.1 API errors

- 422: map safe payload.errors to Name, Email, Photo, Password, Confirm Password, and Address. Keep the form open.
- Duplicate email: show a safe field message such as This email is already registered.
- Invalid image or oversized image: show a Photo error and allow replacement.
- Confirmation mismatch: show a Confirm Password error from Laravel.
- 401/403: do not authenticate; show a safe generic registration error.
- 404: show Registration is currently unavailable. Please try again later.
- Network: show a retryable connection message and clear passwords while preserving a valid retryable photo.
- 500/other: show Registration failed. Please try again.
- Malformed 201 without a non-empty token: treat as invalid-response, do not authenticate, and do not retry automatically.

Never display raw payloads, backend exception text, stack traces, passwords, tokens, image bytes, or local paths.

### 10.2 Client preview cleanup

Revoke the previous object URL on replacement, removal, cancellation, and unmount. Do not revoke before the preview no longer needs it. Cleanup failure must not prevent form reset.

### 10.3 Backend file cleanup

Validate before storing. If storage fails, do not create the user. If user creation, token creation, or response preparation fails after storage, delete the stored file and roll back database work where possible. Do not leave orphaned files. Log only safe server-side diagnostics; never return filesystem paths or exception details.

## 11. Security Considerations

- Hash passwords only on Laravel.
- Never store password or confirmation in localStorage, currentUser, URLs, logs, analytics, or displayed errors.
- Clear password fields after failure and unmount the form after success.
- Do not expose tokens.
- Do not accept or send role from the frontend; force/default user on the backend.
- Validate actual uploaded image content and size on Laravel; client checks are not a security boundary.
- Use generated storage names and restrict accepted image types.
- Store on the public disk only after validation and return a public URL, never a filesystem path.
- Keep previews temporary and never persist them.
- Preserve existing auth, logout, User List, and protected authorization behavior.

## 12. Frontend File Structure

### 12.1 Create

```text
frontend/src/pages/RegisterPage.jsx
frontend/src/components/auth/RegisterForm.jsx
```

RegisterForm owns text fields, selected File state, object URL lifecycle, validation, FormData, loading, and safe errors. RegisterPage reuses the LoginPage visual structure and provides Login navigation.

### 12.2 Modify

- frontend/src/App.jsx: Login/Register unauthenticated screen selection and callbacks.
- frontend/src/pages/LoginPage.jsx: accessible Register navigation.
- frontend/src/services/authApi.js: registerUser with FormData.
- frontend/src/App.css: registration field, picker, preview, error, and responsive styles.

LoginForm.jsx should remain behaviorally unchanged. Do not add a router, form library, i18n dependency, upload dependency, or global store.

### 12.3 Backend files in implementation scope

- backend/app/Http/Requests/RegisterRequest.php: focused multipart validation, including password_confirmation and image rules.
- backend/app/Http/Controllers/Api/AuthController.php: accept the request, store photo, persist address/photo, preserve role user, create token, and preserve response shape.
- backend/app/Http/Resources/UserResource.php: turn stored photo path into a public disk URL.
- backend/tests/Feature/AuthApiTest.php: multipart, image, confirmation, role, cleanup, persistence, and response URL tests.
- Deployment/setup: run php artisan storage:link for the configured public disk.

Do not modify usersApi.js, apiError.js, protected User List action behavior, or unrelated backend routes.

## 13. Backend Impact and Implementation Scope

### 13.1 Registration request and storage

Replace or extend inline validation with the rules in Section 7. Receive multipart/form-data, validate before storage, store the optional image under profile-photos on the public disk using a generated name, save the relative path, persist nullable address, hash the password, omit or force role=user, create the token, and return HTTP 201.

A dedicated RegisterRequest is preferred because StoreUserRequest is for the existing protected create flow and currently has no photo rule.

### 13.2 UserResource

UserResource currently returns raw photo. Change it to return null for no photo and Storage::disk('public')->url(stored path) for a stored image. Keep the field name photo and all existing non-hidden fields. Ensure APP_URL and the public storage link are configured.

### 13.3 Transaction and cleanup

Use a database transaction or equivalent failure handling. If a file is stored and a later operation fails, delete it. Roll back user/database work where possible. Do not return success with an unusable photo reference.

### 13.4 Role

The migration default user is sufficient for current behavior, but the new controller must not trust a role field. Add a regression test proving role injection cannot create an administrator.

These backend changes are part of the future implementation scope but are not performed while creating this specification.

## 14. Acceptance Criteria

1. LoginPage has an accessible Register action and RegisterPage has an accessible Sign in action.
2. RegisterPage uses the existing responsive Material UI card style.
3. The form has Name, Photo file picker, Email, Password, Confirm Password, and Address.
4. No role selector or role request field exists.
5. Photo is a real optional file, not a URL/path text field.
6. Client accepts only JPEG, PNG, WebP and rejects files over 2 MB.
7. A selected photo has an accessible preview, filename, replace behavior, and Remove photo action.
8. Preview object URLs are revoked appropriately.
9. Registration uses multipart/form-data and does not manually set the boundary.
10. No bearer token is sent to public registration.
11. Laravel validates password_confirmation authoritatively.
12. Laravel validates image type/size and stores the image on the public disk.
13. UserResource returns a public photo URL or null.
14. Stored names are generated and safe; failures clean up stored files.
15. Name, email, password, confirmation, address, and photo validation errors are safe and contextual.
16. HTTP 201 with a non-empty token automatically signs the user in.
17. Token is stored only under localStorage key token.
18. Passwords, confirmations, tokens, raw payloads, local paths, and image bytes are never exposed.
19. Public registrations always receive role user and cannot choose a role.
20. Existing Login, Logout, User List, search, pagination, and User List Actions behavior remains unchanged.
21. No Change Password or Admin Reset Password feature is added.
22. New copy remains compatible with future English/Japanese localization.

## 15. Test Scenarios

### Frontend

1. Navigate Login to Register and back using keyboard.
2. Verify all six fields and no role field.
3. Verify required/name/email/password/confirmation validation.
4. Verify JPEG, PNG, and WebP at or below 2 MB are accepted.
5. Verify unsupported types and files over 2 MB are rejected before request.
6. Verify image preview, replacement, remove, cancel, unmount, and object URL cleanup.
7. Verify FormData field names and absence of role/token/preview URL.
8. Verify no manual multipart Content-Type header is set.
9. Verify 201 response authenticates through App and renders UserListPage.
10. Verify 422, duplicate email, image, confirmation, network, 404, 500, 401/403, and malformed response behavior.
11. Verify failed registration clears passwords but preserves safe retryable values.
12. Verify no sensitive values or filesystem paths appear in UI/logs.
13. Verify desktop, tablet, mobile, Enter submit, focus, labels, and alerts.
14. Verify LoginForm, logout, session expiry, and User List Actions regressions.

### Backend

15. Submit multipart registration with a valid image and verify HTTP 201, database fields, role user, and token.
16. Verify stored photo is under the public disk with a generated relative path.
17. Verify UserResource returns the public URL and null when no image exists.
18. Verify invalid MIME/content and files over 2 MB return 422.
19. Verify missing/mismatched password_confirmation returns 422.
20. Verify address is persisted when supplied and nullable when absent.
21. Verify role injection cannot create an admin.
22. Verify storage/user/token failures clean up files and do not leave inconsistent records.

Run after implementation:

```text
npm run lint
npm run build
git diff --check
```

Also run the relevant Laravel feature tests.

## 16. Implementation Plan

1. Add RegisterRequest or equivalent authoritative validation for password_confirmation, nullable address, and image type/size.
2. Implement multipart handling, public-disk storage, generated names, relative path persistence, and cleanup.
3. Update UserResource to serialize a public photo URL.
4. Ensure php artisan storage:link is available in development/deployment.
5. Add backend tests for upload, validation, confirmation, role protection, cleanup, and URL response.
6. Add registerUser() to authApi.js using FormData and existing UsersApiError conventions.
7. Add RegisterForm.jsx with controlled fields, File/preview lifecycle, validation, FormData, loading, and safe errors.
8. Add RegisterPage.jsx and Login/Register navigation.
9. Add App unauthenticated-screen state and route successful registration through onAuthenticated.
10. Preserve all existing authentication and protected User List behavior.
11. Run frontend and backend checks, inspect the final diff, and do not commit.

## 17. Open Questions / Assumptions

- No image policy existed in the repository; this specification establishes JPEG, PNG, WebP and 2 MB.
- Photo is a real file upload. URL/path text input is explicitly not acceptable.
- The database stores a generated relative path; UserResource returns a public URL from the configured public disk.
- The inspected public/storage symlink is absent and must be established with standard Laravel setup.
- Server-side password confirmation is required, not optional.
- Address and photo currently require backend changes because AuthController ignores them.
- Automatic sign-in is selected because registration returns a token and user object.
- No i18n system exists; English is initial, Japanese remains a future translation layer.
- No frontend test script currently exists; lint/build, manual checks, and Laravel feature tests are the baseline.
- This task revises documentation only. No frontend, backend, storage, dependency, or test files are implemented or modified.
