# User Profile Specification

## 1. Overview

Introduce an authenticated User Profile experience that allows an authorized user to view a selected user's profile and enter a dedicated Edit Profile flow.

The User List currently opens Edit User directly from each row. The intended direction is:

~~~text
User List
└── View Profile
    ↓
Profile Page
├── Personal Information
├── Edit Profile
└── Change Password (separate feature boundary)
~~~

The Profile feature must:

- Replace the User List's direct Edit action with View Profile.
- Display the selected user's Photo, Name, Email, Address, and an appropriate Role label.
- Allow editing Photo, Name, Email, and Address only when Laravel authorization allows it.
- Keep Password and Confirm Password out of Edit Profile.
- Keep Change Password and Admin Password Reset separate.
- Preserve Delete, Change Role, Login, Logout, search, pagination, and existing error behavior.
- Use the existing React, Material UI, fetch, App-level state, and plain CSS architecture.
- Avoid React Router, a form library, a state-management library, an i18n dependency, and an additional upload dependency.

This document defines the intended feature. It does not implement source or backend changes.

## 2. Current Architecture Findings

### 2.1 Frontend

The frontend is a React/Vite application using Material UI, browser fetch, and plain CSS. It has:

- App.jsx as the authenticated gate and top-level page-state owner.
- UserListPage.jsx as the User List container.
- App-level state instead of React Router.
- No global state library, form library, or localization dependency.
- authApi.js for login/logout requests.
- usersApi.js for User List and user mutation requests.
- UsersApiError in apiError.js for normalized API failures.

App.jsx stores only the bearer token under localStorage key token. It keeps a sanitized currentUser in memory with id, name, email, and role. It does not persist the user object and does not restore currentUser from /api/me after a browser refresh.

### 2.2 Current page and action state

UserListPage.jsx owns:

- Search input and query state.
- Pagination state.
- Fetch result, loading, retry, and error state.
- Selected user and dialog-open state.
- Logout state.
- Frontend authorization feedback state.

UserTable.jsx currently renders Photo, Name, Email, Role, Address, and Actions columns. The Actions column contains Edit, Delete, and Change Role buttons.

The existing dialogs are:

- UserEditDialog.jsx: edits Name, Email, and Address; synchronizes draft state when the selected user changes.
- UserDeleteDialog.jsx: confirms and deletes a user.
- UserRoleDialog.jsx: changes a user's role between user and admin.
- UserAuthorizationDialog.jsx: explains blocked frontend actions.

There is no profile page, profile-specific component, profile-specific API function, or router route.

### 2.3 Current API conventions

usersApi.js uses VITE_API_BASE_URL, reads the token from localStorage, sends Accept: application/json, and normalizes network and HTTP failures as UsersApiError.

Current mutation helpers:

- updateUser(userId, data): JSON PUT /api/users/{userId}.
- deleteUser(userId): DELETE /api/users/{userId}.
- updateUserRole(userId, role): JSON PATCH /api/users/{userId}/role.

The existing update helper does not support multipart requests or photo fields.

## 3. Existing User Management Findings

### 3.1 User List behavior

Authenticated users can load the paginated User List and search by name or email. The backend returns Laravel paginator data. The frontend preserves search and page state during normal refreshes.

The User List must continue to retain:

- Delete behavior.
- Change Role behavior.
- Search.
- Pagination.
- Loading overlays and empty states.
- 401 session-expiration handling.

Only the direct Edit action changes to View Profile.

### 3.2 Existing user detail endpoint

The existing authenticated resource route provides:

~~~text
GET /api/users/{user}
~~~

UserController::show() applies UserPolicy::view. It currently returns the raw user model rather than explicitly wrapping it in UserResource.

The endpoint is not public. It requires Sanctum authentication and returns 403 when the authenticated user is not authorized to view the selected user.

### 3.3 Existing update endpoint

The existing authenticated update route provides:

~~~text
PUT/PATCH /api/users/{user}
~~~

UserController::update() applies UserPolicy::update() and currently returns UserResource.

UpdateUserRequest currently validates Name, Email, optional Password, and Address. It does not currently validate or store Photo. The existing frontend Edit User dialog no longer exposes Password, but the backend update contract still accepts it.

For Profile Edit, this endpoint should be extended or a dedicated profile-update endpoint should be introduced only after the implementation confirms which option best preserves authorization and response conventions. The preferred direction is to reuse the existing endpoint with an explicit profile-safe contract, because the route and policy already represent user detail updates.

## 4. Existing Authorization Findings

Laravel UserPolicy is the authoritative security boundary.

Current rules:

- viewAny: any authenticated user may view the User List.
- view: a user may view themselves; an admin may view any user.
- update: a user may update themselves; an admin may update any user.
- create: admin only.
- delete: admin only.
- updateRole: admin only.

The current frontend mirrors update/delete/role rules before opening dialogs, but backend policy checks remain mandatory.

Profile viewing must not be public. The frontend should show a profile only after the authenticated detail request succeeds. A normal user viewing another user's profile must receive a safe 403 state, and the frontend must not bypass or infer permission from a row's presence in the User List.

Edit Profile authorization should reuse the existing Laravel UserPolicy::update() rule. The frontend may provide early feedback, but a direct API request must still be rejected by Laravel when unauthorized.

## 5. Existing Photo Handling Findings

### 5.1 Storage and model

- users.photo is a nullable string column.
- User includes photo in its fillable configuration.
- The public filesystem disk uses storage/app/public.
- The public URL is based on APP_URL/storage.
- Laravel's configured symbolic link maps public/storage to storage/app/public.

### 5.2 Registration implementation

Registration currently:

- Accepts an optional photo upload.
- Validates it as an image with JPEG, PNG, or WebP MIME/extension rules.
- Limits the file to 2 MB using Laravel's max:2048 rule.
- Stores it under profile-photos on the public disk.
- Uses Laravel-generated storage filenames.
- Persists the relative storage path.
- Returns a public URL through UserResource.

Registration performs storage and database work inside a transaction and deletes the stored photo if a later operation fails.

### 5.3 Frontend display

UserAvatar.jsx accepts a photo URL, displays it in a Material UI Avatar, and falls back to generated initials if no URL exists or the image fails to load.

### 5.4 Required reuse

Profile Edit must reuse this same storage architecture. It must not introduce a second directory, path format, filename strategy, or URL format.

Existing update currently has no photo replacement/removal support. The implementation must add an explicit, validated contract for replacement and removal, including safe cleanup of old files.

## 6. Existing Authentication Findings

Authentication uses Laravel Sanctum bearer tokens.

Existing flow:

1. Login posts credentials to POST /api/login.
2. The response contains message, user, and token.
3. App.jsx stores only the token in localStorage.
4. A sanitized current user remains in memory.
5. Protected API calls send Authorization: Bearer <token>.
6. A normalized 401 clears local authentication and returns to LoginPage.

Existing authentication endpoints:

- POST /api/register
- POST /api/login
- GET /api/me
- POST /api/logout

There is no Change Password endpoint. Password Change must therefore remain a separate future feature and must not be placed inside Edit Profile.

## 7. Profile User Flow

### 7.1 Open profile

1. The user signs in through the existing login flow.
2. The User List loads normally.
3. The user selects View Profile for a row.
4. The frontend checks whether the selected user may be viewed using the retained current-user identity.
5. If the frontend cannot safely establish permission, it must default-deny the profile request and show a safe permission message.
6. If allowed, App-level page state changes to the Profile Page with the selected user ID.
7. The Profile Page requests GET /api/users/{id} with the bearer token.
8. The page renders the returned profile only after a valid response is received.

### 7.2 Back navigation

The Profile Page must provide an accessible Back to Users action. Returning to the User List must preserve the existing search and pagination state where the App-level state allows it.

### 7.3 Edit profile

1. An authorized user selects Edit Profile from the Profile Page.
2. The Profile Page opens the Edit Profile UI using the loaded profile as its initial draft.
3. The edit UI validates fields locally.
4. The frontend submits the supported profile fields using the specified update contract.
5. On success, the page updates from the returned resource or refetches the profile.
6. The edit UI closes and shows a safe success confirmation.

### 7.4 Change Password boundary

The Profile Page may show a Change Password action only when the feature has a separately implemented and authorized contract. Until then, it must not render a non-functional password action that implies support.

## 8. Profile Page UI/UX Specification

### 8.1 Layout

Use the existing Material UI design language:

- A page-level main container consistent with UserListPage.
- A clear page header containing the profile title and selected user's display name.
- A Back to Users button.
- A profile surface/card with the avatar/photo area and personal information.
- An Edit Profile button when authorized.
- A safe loading, empty, forbidden, not-found, and retryable error state.

### 8.2 Information displayed

Display:

- Photo or initials fallback.
- Name.
- Email.
- Address, using a neutral placeholder such as — when null or empty.
- Role using a human-readable label such as Admin or User when the value is recognized.

Do not display:

- Password.
- Password hash.
- Access token.
- Raw API payloads.
- Filesystem paths.
- Internal editable IDs.
- Backend exception details.

### 8.3 Edit action

Show Edit Profile only when frontend identity and target-user data indicate that the action is allowed:

- Admin: any selected profile.
- Non-admin: own profile only.
- Missing or unknown identity: default-deny.

The backend must enforce the same rule.

### 8.4 Photo and no-photo states

Use the existing UserAvatar behavior or a focused profile equivalent:

- Show the returned public photo URL when available.
- Show initials when no photo exists.
- Use a safe fallback if the image fails.
- Never expose the stored relative path to the user.

### 8.5 Loading and success states

- Show a page-level loading state while fetching the profile.
- Disable or prevent duplicate Edit Profile submissions.
- Show a progress state while saving.
- After a successful save, show a short safe success message such as Profile updated.
- Refresh or replace the displayed profile with the returned canonical resource.

### 8.6 Responsive and accessible behavior

- Support desktop, tablet, and mobile widths.
- Stack profile information and actions vertically on narrow screens.
- Keep Back and Edit Profile controls usable without horizontal overflow.
- Use semantic headings, labeled buttons, and readable contrast.
- Ensure all actions work with keyboard activation.
- Use normal Material UI focus behavior for dialogs.
- Return focus to the originating action after Edit Profile closes where practical.
- Use an accessible live region or Alert for loading/error/success feedback.

### 8.7 English/Japanese compatibility

Keep all visible Profile copy in component-level message constants or clearly isolated strings so it can later be translated without changing behavior. Do not add an i18n dependency in this feature.

## 9. Edit Profile Specification

### 9.1 Editable fields

Edit Profile contains exactly:

- Photo.
- Name.
- Email.
- Address.

It must not contain:

- Password.
- Confirm Password.
- Role.
- Token.
- Internal ID as an editable field.
- Created or updated timestamps.

### 9.2 UI form

The preferred implementation is a focused Profile Edit dialog or sheet opened from the Profile Page, reusing the existing dialog conventions. A dedicated edit page is acceptable only if the final App-level navigation state makes the flow clearer without introducing a router.

The UI must:

- Initialize from the selected profile.
- Reset draft and transient errors when the selected profile changes.
- Keep Photo, Name, Email, and Address in one coherent form.
- Keep the dialog/page open on validation or API failure.
- Prevent duplicate submissions.
- Preserve the existing refresh and selected-user behavior.

### 9.3 Request behavior

Because Photo is a real upload, a request containing a new photo must use multipart/form-data through FormData. The browser must set the multipart boundary; frontend code must not manually set Content-Type.

The request must contain only:

- name
- email
- address
- Optional photo file.
- An explicit photo-removal signal when the user removes an existing photo, according to the final backend contract.

The request must not contain password, role, token, raw user object, timestamps, or filesystem paths.

### 9.4 Success behavior

On HTTP 200 success:

- Use the returned UserResource as the canonical displayed profile.
- Close the edit UI.
- Show safe success feedback.
- Preserve Profile Page context.
- Ensure the updated photo URL is displayed.

If the edited profile is the current user, update only the in-memory current-user fields that are already permitted by App's sanitized identity model. Do not persist a full user object or photo file in localStorage.

## 10. Photo Management Specification

### 10.1 Selection and validation

Reuse registration constraints:

- Accepted types: JPEG, PNG, WebP.
- Maximum size: 2 MB, or 2,097,152 bytes.
- Validate on the client for immediate feedback.
- Validate authoritatively on Laravel.
- Show field-level photo errors without exposing backend internals.

### 10.2 Preview lifecycle

- Use URL.createObjectURL(file) for an in-memory preview.
- Revoke the prior object URL when replacing a selected file.
- Revoke the URL when removing a selected replacement.
- Revoke the URL when the edit component unmounts or is cancelled.
- Do not convert the file to base64.
- Do not persist the File object or object URL in localStorage.

### 10.3 Replacement

When a replacement is selected, the UI shows the replacement preview while retaining the existing photo until the update succeeds. The backend should:

1. Validate the new upload.
2. Store the new file with a generated filename under profile-photos.
3. Persist the new relative path.
4. Commit the database update.
5. Delete the old stored file only after the new file and database update succeed.

If storage or database work fails, delete the newly stored file and retain the old database path and old file whenever possible.

### 10.4 Removal

The UI should support removing an existing photo if the backend contract supports it. Removal must:

1. Send an explicit, unambiguous removal signal.
2. Set the database photo path to null.
3. Delete the old stored file after the database update succeeds.
4. Leave the old file and database reference intact if the update fails.

The removal signal must not rely on an empty file path supplied by the client.

### 10.5 Response and display

The API must return photo: null when no photo exists, or a public URL when one exists. The relative storage path must remain backend-only.

## 11. Change Password Boundary

No Change Password endpoint currently exists.

Change Password is separate from Edit Profile and must not be implemented as part of this feature. It will require its own future specification covering:

- Authenticated user authorization.
- Current-password verification.
- New password and confirmation validation.
- Password hashing.
- Session/token behavior after a change.
- Rate limiting and error handling.
- Dedicated UI and API tests.

Admin Password Reset is also separate and must not be added to Profile Page or Edit Profile.

## 12. API Contract

### 12.1 Profile/detail endpoint

Reuse the existing authenticated endpoint:

~~~text
GET /api/users/{user}
~~~

Headers:

~~~text
Accept: application/json
Authorization: Bearer <token>
~~~

Success:

- HTTP 200.
- A UserResource-shaped object containing id, name, email, address, photo, role, created_at, and updated_at.
- photo is null or a public URL.

The implementation should update UserController::show() to return the same UserResource contract used by update responses, avoiding inconsistent raw-model serialization.

### 12.2 Profile update endpoint

Preferred endpoint:

~~~text
PUT /api/users/{user}
~~~

The endpoint remains authenticated by Sanctum and authorized by UserPolicy::update.

When no file is included, JSON may be retained for compatibility if the final request helper can distinguish the two forms. When a file or removal signal is included, use multipart FormData.

The backend contract must define:

- name: required string, max 255.
- email: required valid email, unique except for the selected user.
- address: nullable string.
- photo: nullable image upload, JPEG/PNG/WebP, max 2 MB.
- An explicit photo-removal field, such as a documented boolean, only if the implementation chooses to support removal through the existing endpoint.

The update contract must reject or ignore client-controlled role, password, timestamps, and unknown sensitive fields. The preferred profile-specific behavior is to reject unsupported password and role fields rather than silently applying them.

Success:

- HTTP 200.
- Updated UserResource.

### 12.3 Error contract

Expected behavior:

- HTTP 401: unauthenticated session.
- HTTP 403: authenticated but not allowed to view or update the selected user.
- HTTP 404: selected user does not exist.
- HTTP 422: validation errors with field-level errors.
- HTTP 500: safe generic server failure; no exception details.

No new endpoint is required for Change Password in this feature.

## 13. Validation Rules

### 13.1 Frontend

- Name is required after trimming and must be no longer than 255 characters.
- Email is required after trimming and must pass the existing client email format check.
- Address is optional; blank address is submitted as null or the backend-equivalent nullable value.
- Photo is optional.
- Photo must be JPEG, PNG, or WebP and no larger than 2 MB.
- Name and Email are trimmed before submission.
- Address may be trimmed for consistency with existing Edit User behavior.
- No password validation is present in Edit Profile.

### 13.2 Backend

Laravel remains authoritative and must repeat all validation:

- name: required|string|max:255.
- email: required|email|unique excluding the selected user.
- address: nullable|string.
- photo: nullable|image|mimes:jpeg,png,webp|max:2048.
- Explicit removal field: boolean when used.

The profile update request must not allow the profile form to change role, password, token data, or timestamps.

## 14. Authorization Rules

| Action | Admin | Non-admin viewing own profile | Non-admin viewing another profile |
| --- | --- | --- | --- |
| View Profile | Allowed | Allowed | Blocked |
| Edit Profile | Allowed | Allowed | Blocked |
| Delete | Allowed | Existing admin-only rule | Existing admin-only rule |
| Change Role | Allowed | Existing admin-only rule | Existing admin-only rule |

Frontend checks are only early UX guards. Laravel policy checks must remain on every protected endpoint.

When currentUser is unavailable or its role is unknown:

- Do not guess the role.
- Default-deny View Profile and Edit Profile actions.
- Show a neutral permission message.
- Do not expose token information.

## 15. Error Handling

Use UsersApiError and existing frontend conventions.

- 401: clear local authentication using the existing App callback and render LoginPage.
- 403: keep the User List/Profile context where safe and show a safe permission message.
- 404: show a user-not-found state with a Back to Users action.
- 409: if returned for an email conflict, show a safe conflict message and keep the form open.
- 422: map payload.errors to Name, Email, Address, Photo, and removal fields without rendering the raw payload.
- 500: show a generic retryable message.
- Network failure: show a safe connection message and retry action.
- Malformed success response: treat it as an invalid response, show a generic error, and do not update the profile with untrusted data.

Never display:

- Stack traces.
- SQL or backend exception details.
- Raw API payloads.
- Passwords or password hashes.
- Bearer tokens.
- Filesystem paths.

## 16. Security Considerations

- Sanctum authentication is required for profile detail and update requests.
- Laravel policy checks are mandatory and authoritative.
- Do not make profiles public.
- Do not trust frontend authorization checks.
- Do not accept client-controlled role changes through Profile Edit.
- Do not accept password changes through Profile Edit.
- Do not store passwords, File objects, object URLs, raw API payloads, or profile objects containing sensitive fields in localStorage.
- Store only the existing token under the existing token key.
- Use generated storage filenames and the configured public disk.
- Return public URLs, not relative storage paths.
- Delete old photos only after successful replacement/removal persistence.
- Clean up newly uploaded files when database or later storage work fails.
- Do not log tokens, passwords, raw payloads, or local filesystem paths.

## 17. Frontend File Structure

Expected files to create or modify during implementation:

### Create

- frontend/src/pages/UserProfilePage.jsx
- A focused profile display component if the page becomes too large.
- A focused Profile Edit component/dialog, depending on the final UI decision.

### Modify

- frontend/src/App.jsx: add App-level Profile Page state and selected-user navigation without React Router.
- frontend/src/pages/UserListPage.jsx: replace Edit action wiring with View Profile and preserve Delete/Change Role.
- frontend/src/components/users/UserTable.jsx: rename the Edit action to View Profile and update accessible labels.
- frontend/src/services/usersApi.js: add profile detail/update helpers while preserving existing list, delete, and role behavior.
- frontend/src/App.css: add responsive Profile Page and edit UI styles.
- frontend/src/components/users/UserAvatar.jsx: modify only if the existing avatar needs a reusable profile-sized variant.

The existing LoginPage, RegisterPage, LoginForm, RegisterForm, authApi.js, UserDeleteDialog, UserRoleDialog, and logout behavior should remain unchanged unless a compatibility-only adjustment is required.

No React Router, form library, state-management library, i18n dependency, or upload dependency should be added.

## 18. Backend Impact

Required or likely backend changes:

- Update UserController::show() to return UserResource consistently.
- Extend the profile update contract to support multipart photo replacement and explicit removal.
- Add or update a dedicated FormRequest for profile updates.
- Keep UserPolicy::view() and UserPolicy::update() as the authorization rules.
- Add transactional photo replacement/removal and cleanup behavior.
- Ensure the response returns public photo URLs through UserResource.
- Reject or ignore unsupported role/password fields in the Profile Edit contract.
- Preserve existing Delete and Change Role endpoints and behavior.

No new profile route is required unless implementation testing shows the existing detail/update routes cannot safely support the contract.

No backend Change Password or Admin Password Reset implementation is in scope.

## 19. Acceptance Criteria

- The User List shows View Profile instead of direct Edit.
- Delete and Change Role remain available with their existing behavior and authorization.
- An authenticated authorized user can open a selected profile.
- Unauthorized profile viewing is blocked by Laravel and shown safely in the frontend.
- Profile Page displays photo/avatar, name, email, address, and appropriate role information.
- Null or empty address and missing photos have neutral fallbacks.
- Profile Page provides accessible Back to Users behavior.
- Authorized users can enter Edit Profile.
- Edit Profile contains Photo, Name, Email, and Address only.
- Password and Confirm Password are absent from Profile Edit.
- Profile update supports multipart photo upload.
- Photo validation matches registration: JPEG, PNG, WebP, maximum 2 MB.
- Replacement creates a generated stored filename and safely cleans up the old file after success.
- Removal clears the database reference and safely deletes the old file after success.
- Failed photo/database operations do not leave orphaned files or destroy the prior valid photo reference.
- Profile responses return a public photo URL or null, never a filesystem path.
- Backend authorization remains authoritative.
- 401, 403, 404, 409, 422, 500, network, and malformed-response states are handled safely.
- Existing Login, Register, Logout, User List, search, pagination, Delete, and Change Role behavior remains intact.
- No new dependency or router is introduced.
- The UI remains keyboard accessible, responsive, and compatible with future English/Japanese localization.

## 20. Test Scenarios

### Frontend

- View Profile appears in place of Edit in each User List row.
- Delete and Change Role still open the existing dialogs.
- Admin can view and edit any listed profile.
- Non-admin can view and edit their own profile.
- Non-admin cannot view or edit another user's profile.
- Missing current-user identity defaults to deny without guessing a role.
- Profile loading, success, empty, 403, 404, 401, network, and malformed-response states render safely.
- Back to Users returns to the list without losing applicable search/page state.
- Profile displays a photo URL, initials fallback, null address fallback, and role label correctly.
- Edit Profile contains no password or role fields.
- Name, email, address, and photo client validation work.
- Invalid and oversized photos are rejected before submission.
- Photo preview object URLs are revoked on replace, remove, cancel, and unmount.
- Successful profile updates refresh the displayed profile.
- Failed submissions preserve safe field errors and clear no protected data.
- Duplicate submissions are prevented while saving.
- Existing User List actions and logout behavior remain unaffected.
- Keyboard navigation reaches View Profile, Back, Edit Profile, upload/remove controls, and dialog actions.

### Backend

- Authenticated users can view themselves.
- Admins can view another user's profile.
- Non-admin users receive 403 when viewing another user's profile.
- Guests receive 401 for profile detail and update.
- Authorized self/admin updates succeed.
- Unauthorized updates receive 403.
- Name, email, nullable address, unique email, and photo validation are authoritative.
- Password, role, timestamps, and unknown sensitive fields are not changed by Profile Edit.
- Multipart replacement stores JPEG, PNG, and WebP files under profile-photos.
- Files over 2 MB and invalid types return 422.
- Successful replacement returns a public URL and removes the old file after persistence.
- Explicit photo removal returns photo: null and removes the old file after persistence.
- Storage/database failure cleans up newly stored files and preserves the prior valid photo state where possible.
- Profile responses use UserResource and never expose password, token, or filesystem paths.
- Existing Delete and Change Role feature tests continue to pass.

## 21. Implementation Plan

1. Confirm current route-model binding, policy registration, resource serialization, and storage behavior with focused backend tests.
2. Normalize the existing show endpoint to UserResource.
3. Define and implement the profile update FormRequest without password or role updates.
4. Add multipart photo replacement/removal with transactional persistence and cleanup.
5. Add backend feature tests for view/update authorization, validation, response URLs, replacement, removal, and cleanup.
6. Add profile API helpers using existing UsersApiError conventions.
7. Add App-level selected-profile/page state without React Router.
8. Change User List Edit to View Profile while preserving Delete and Change Role.
9. Build the responsive Profile Page and Edit Profile UI using Material UI.
10. Add safe loading, error, success, focus, and object URL lifecycle behavior.
11. Run frontend lint/build, Laravel feature tests, and git diff --check.
12. Inspect the final diff to confirm unrelated authentication and User List behavior was preserved.

## 22. Open Questions / Assumptions

- Should Profile Page navigation use selected-user App state only, or should a future URL/query convention be introduced without adding React Router? This specification assumes App-level state for the first implementation.
- Should Edit Profile be a dialog opened from the Profile Page or a nested App-level page? This specification prefers a focused dialog because the current project already uses accessible MUI dialogs for mutations.
- Should photo removal use a boolean field such as remove_photo, or should a dedicated endpoint be used? The implementation must choose one explicit contract and test it; an empty path must not be treated as a removal signal.
- Should the existing GET /api/users/{user} response be normalized immediately to UserResource? This specification recommends yes for consistent photo URLs and safe serialization.
- Should a successful self-profile edit update the User List header identity immediately, or only after a later authenticated refresh? The implementation should update the in-memory safe identity when the returned resource is the current user.
- What exact success-notification mechanism should be used? There is no established toast system; a local MUI Alert or inline status is preferred without adding a dependency.
- The current working tree contains the untracked prompt file frontend/docs/prompts/user-profile.md; it should remain untouched while the specification is created.
- Change Password and Admin Password Reset remain future features unless separately specified and implemented.
