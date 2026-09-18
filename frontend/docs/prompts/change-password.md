# Change Password Feature Prompt

We are continuing the existing User Management System.

Current branch:

feature/change-password

The User Registration and User Profile features have already been implemented and merged into main.

We are now adding a separate Change Password feature.

IMPORTANT:

- Do not implement anything until the existing backend and frontend architecture has been inspected.
- Do not assume an API endpoint already exists.
- Do not invent an authentication/token contract.
- Inspect the actual source code first.
- Do not modify unrelated features.
- Do not commit anything.

## 1. Feature Goal

Add an authenticated Change Password feature.

The intended flow is:

Profile Page
↓
Change Password
↓
Change Password Form

Fields:

- Current Password
- New Password
- Confirm New Password

The feature must allow an authenticated user to change their own password.

Admin Password Reset is NOT part of this feature.

Changing another user's password is NOT part of this feature.

Changing password through Edit Profile is NOT allowed.

## 2. Before Implementation: Inspect Existing Architecture

Before creating or modifying anything, inspect the actual project.

Backend:

- routes/api.php
- AuthController.php
- UserController.php
- User model
- authentication middleware
- Sanctum configuration
- existing Form Requests
- Login implementation
- Logout implementation
- /api/me implementation
- UserPolicy
- existing password validation
- existing authentication tests
- existing UserApiTest/AuthApiTest
- any password-related implementation

Frontend:

- App.jsx
- UserProfilePage.jsx
- UserEditDialog.jsx
- authApi.js
- usersApi.js
- apiError.js
- LoginPage.jsx
- LoginForm.jsx
- existing MUI dialog/form patterns
- App.css
- existing error handling conventions
- existing authentication state/token handling

Do not assume that Change Password does not exist.
Confirm whether an endpoint or partial implementation already exists.

## 3. Authentication Behavior

Determine how the current application handles Sanctum tokens.

Specifically inspect:

- How login creates a token.
- How the frontend stores the token.
- How logout deletes the current token.
- How protected requests authenticate.
- Whether changing a password currently invalidates tokens.
- Whether the project has any existing token-revocation convention.

Do NOT invent token behavior.

After inspecting the existing implementation, document and implement the safest behavior consistent with the current architecture.

If changing the password should invalidate the current Sanctum token:

- determine how the application should handle that,
- determine whether all tokens or only the current token should be revoked,
- determine whether the frontend should return to LoginPage,
- do not guess.

If existing architecture does not define this behavior, document the decision before implementation.

## 4. Backend API

Determine whether a Change Password endpoint already exists.

If none exists, introduce a dedicated authenticated endpoint.

Preferred direction:

POST /api/change-password

Authentication:

Authorization: Bearer <token>

Middleware:

auth:sanctum

Do not reuse the public registration endpoint.

Do not reuse Profile Edit.

Do not allow an unauthenticated request.

The endpoint must operate on the authenticated user from the Sanctum request.

The client must NOT submit a user ID to determine whose password is changed.

Backend should obtain the user using:

$request->user()

or the equivalent existing authenticated-user convention.

## 5. Validation

Laravel must remain authoritative.

Inspect the existing password validation rules first.

The final backend validation should cover:

Current Password:

- required
- string
- must match the authenticated user's current password

New Password:

- required
- string
- existing project password minimum requirements
- use the project's existing password validation convention if one exists

Confirm New Password:

- required
- must match new password

Do not reveal whether another user's password exists or expose password hashes.

If the project already uses Password::defaults() or another Laravel password rule, reuse it instead of inventing a new rule.

## 6. Current Password Verification

The backend must verify the current password using Laravel's password hashing mechanism.

Do not compare plaintext passwords with database values.

Use the existing hashing convention, for example:

Hash::check()

or the project's established equivalent.

When the current password is incorrect:

- return a safe validation-style error or appropriate authentication error based on existing API conventions.
- do not reveal password hash information.
- do not expose backend exception details.

Do not allow the password to be changed if the current password is incorrect.

## 7. Password Update

When validation succeeds:

1. Retrieve the authenticated user.
2. Verify current password.
3. Validate new password.
4. Validate confirmation.
5. Hash the new password using Laravel.
6. Save the user.
7. Apply the project's documented Sanctum token behavior.
8. Return a safe JSON response.

Never return:

- password
- password_confirmation
- password hash
- token unless the existing architecture explicitly requires a new token
- sensitive database information

Preferred response:

HTTP 200

Example shape only:

{
"message": "Password changed successfully"
}

Do not assume this exact response until the existing API conventions have been inspected.

## 8. Password Reuse

Inspect whether the existing project has a password-history or password-reuse policy.

If none exists, do not invent one unless there is a clear security requirement.

If current password and new password are identical:

- determine appropriate behavior from the existing project conventions.
- Prefer rejecting it if the project has no reason to allow a no-op password change.
- Document the decision.

## 9. Sanctum Token Behavior

This is an important architectural decision.

Inspect whether the project currently creates:

- one token per login,
- multiple tokens per user,
- currentAccessToken usage,
- token revocation behavior.

Do not automatically delete tokens without understanding the existing architecture.

Document:

- whether the current token remains valid after password change,
- whether all tokens are revoked,
- whether only the current token is revoked,
- whether the frontend remains authenticated,
- whether the user must log in again.

Choose behavior based on the actual project architecture and security requirements.

## 10. Frontend UX

Add Change Password access from the Profile Page.

The Profile Page should have:

- Edit Profile
- Change Password

Change Password must be clearly separate from Edit Profile.

Do not add password fields to UserEditDialog.

## 11. Change Password UI

Use the existing Material UI conventions.

Preferred implementation:

A dedicated MUI Dialog opened from UserProfilePage.

The dialog contains:

1. Current Password
2. New Password
3. Confirm New Password

Each password field should:

- use type=password by default
- provide accessible show/hide behavior consistent with LoginForm/RegisterForm
- never display password values after submission

Buttons:

- Cancel
- Change Password

While submitting:

- disable all fields
- disable show/hide controls
- disable Cancel
- disable duplicate submission
- show CircularProgress
- display a loading label such as Changing password…

## 12. Frontend Validation

Provide early client-side validation.

Current Password:

- required

New Password:

- required
- minimum length according to backend/project rules

Confirm New Password:

- required
- must exactly match New Password

Do not trim password values.

Passwords must be treated as opaque strings.

Do not store them outside the component state required for submission.

After successful submission:

- clear all password fields
- close the dialog
- show a safe success message

After failed submission:

- clear password fields if consistent with existing Login/Register behavior
- preserve only safe UI state
- show contextual field/form errors

## 13. API Service

Follow the existing API service architecture.

Determine whether Change Password belongs in:

authApi.js

or

usersApi.js

based on the actual architecture.

Prefer the service that owns authenticated account/authentication operations.

Create a dedicated function such as:

changePassword(currentPassword, newPassword, passwordConfirmation)

or an equivalent interface consistent with the existing code.

Requirements:

- POST to the dedicated endpoint.
- Send Authorization: Bearer <token>.
- Send Accept: application/json.
- Send JSON unless the backend architecture requires otherwise.
- Do not send user ID.
- Do not send role.
- Do not send token in the request body.
- Normalize HTTP/network failures into UsersApiError.
- Do not log request passwords.
- Do not expose raw backend payloads.

## 14. Error Handling

Follow existing UsersApiError conventions.

Handle at minimum:

### 401

The authentication session is invalid or expired.

Use the existing App unauthenticated behavior.

Do not leave the user in a falsely authenticated state.

### 403

If applicable, show a safe permission message.

Do not expose backend details.

### 422

Map safe validation errors to:

- current password
- new password
- password confirmation

Examples:

- Current password is incorrect.
- New password must be at least 8 characters.
- Passwords do not match.

Do not hard-code backend exception messages into the UI.

### 404

If the endpoint is unavailable:

- show a safe generic message.
- do not expose route details.

### 500

Show:

"Password change failed. Please try again."

Do not expose:

- stack traces
- SQL errors
- backend exception messages
- password data

### Network failure

Show a safe retryable connection message.

## 15. Security Requirements

The feature must explicitly satisfy:

- Passwords are hashed only on Laravel.
- Current password is verified server-side.
- New password is hashed before storage.
- Passwords are never stored in localStorage.
- Passwords are never stored in currentUser.
- Passwords never appear in URLs.
- Passwords never appear in logs.
- Passwords never appear in API responses.
- Password hashes never appear in API responses.
- Password fields are not persisted outside the component state required for submission.
- Do not expose raw request/response payloads.
- Do not allow client-controlled user IDs.
- Do not allow role changes through Change Password.
- Do not weaken Sanctum authentication.
- Do not bypass UserPolicy or authentication middleware.
- Do not implement Admin Password Reset.

## 16. Authorization

The final authorization should be:

| Action                         | Admin                   | Normal User             |
| ------------------------------ | ----------------------- | ----------------------- |
| Change own password            | Allowed                 | Allowed                 |
| Change another user's password | Not supported           | Not supported           |
| Admin Password Reset           | Separate future feature | Separate future feature |

The endpoint must always operate on the authenticated user.

There must be no API such as:

POST /api/users/{id}/change-password

unless inspection shows that the existing architecture requires it and there is a strong reason.

Prefer authenticated-user endpoint:

POST /api/change-password

## 17. Profile Page Integration

Modify UserProfilePage.jsx only as required.

Add:

Change Password

button/action.

Opening it should display the dedicated Change Password dialog.

Do not mix it with Edit Profile.

After successful password change:

- follow the documented token/session behavior.
- update UI state accordingly.
- show a safe success message.
- do not display the password.

## 18. App Integration

Modify App.jsx only if token/session behavior requires it.

Do not introduce a new global state library.

Do not introduce React Router.

Reuse:

- existing authentication state
- existing token storage
- existing onUnauthenticated behavior
- existing UsersApiError handling

## 19. Files

Expected files may include:

Backend:

- routes/api.php
- app/Http/Controllers/Api/AuthController.php or a dedicated controller if architecture justifies it
- app/Http/Requests/ChangePasswordRequest.php
- tests/Feature/AuthApiTest.php or a dedicated ChangePassword test file

Frontend:

- src/pages/UserProfilePage.jsx
- src/components/users/ChangePasswordDialog.jsx
- src/services/authApi.js or usersApi.js
- src/App.css

Do not create files unnecessarily.

First inspect the project and determine the smallest consistent change set.

## 20. Testing Requirements

Backend tests must cover:

1. Authenticated user can change own password.
2. Guest cannot change password.
3. Incorrect current password is rejected.
4. Missing current password is rejected.
5. Missing new password is rejected.
6. New password shorter than project minimum is rejected.
7. Missing confirmation is rejected.
8. Mismatched confirmation is rejected.
9. Password is actually hashed and changed.
10. Old password no longer works after successful change.
11. New password works after successful change.
12. Password hash is never returned.
13. No sensitive password data appears in response.
14. Token behavior matches the documented architecture.
15. No user ID is required to change own password.
16. Existing Login/Register/Logout/Profile behavior remains intact.

Frontend verification:

1. Change Password action appears on authorized Profile Page.
2. Change Password is separate from Edit Profile.
3. Dialog contains exactly three password fields.
4. Password visibility controls work.
5. Client validation prevents invalid submission.
6. Duplicate submissions are prevented.
7. Loading state works.
8. 422 errors map safely.
9. 401 uses existing session-expiration behavior.
10. Success clears fields and closes the dialog.
11. Passwords are not stored in localStorage.
12. Passwords are not displayed after submission.
13. Existing Profile/Edit/Delete/Change Role behavior remains unchanged.

Run:

npm run lint
npm run build
php artisan test
git diff --check

## 21. Scope

IN SCOPE:

- Authenticated user changing their own password.
- Current password verification.
- New password validation.
- Confirmation validation.
- Secure password hashing.
- Change Password API.
- Change Password UI.
- Profile Page integration.
- Safe error handling.
- Accessibility.
- Responsive Material UI behavior.
- Existing authentication/session behavior preservation.

OUT OF SCOPE:

- Admin Password Reset.
- Changing another user's password.
- Forgot Password.
- Password Reset via email.
- Email verification.
- Password history unless already implemented.
- MFA/2FA.
- New authorization roles.
- React Router.
- New state-management library.
- New form library.
- New upload dependency.
- i18n implementation.

## 22. Specification Requirement

Before implementation, create:

frontend/docs/specs/change-password.md

The specification must be based on actual source-code inspection.

Structure:

1. Overview
2. Current Authentication Architecture
3. Current Password Handling Findings
4. Existing Backend Findings
5. Existing Frontend Findings
6. Authentication/Token Behavior
7. Change Password User Flow
8. UI/UX Specification
9. Validation Rules
10. API Contract
11. Error Handling
12. Security Considerations
13. Authorization
14. Frontend File Structure
15. Backend Impact
16. Test Scenarios
17. Acceptance Criteria
18. Implementation Plan
19. Open Questions / Assumptions

Do not implement the feature while creating the specification.

After creating the specification, stop and report:

- Existing password-change endpoint status.
- Existing password validation rules.
- Existing Sanctum token behavior.
- Recommended endpoint.
- Files that will need modification.
- Any architectural risks or open questions.

Do not commit anything.
