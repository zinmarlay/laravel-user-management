# User Edit Password Removal Specification

## 1. Overview

Remove password editing from the existing User Edit feature while preserving the established User List Actions architecture and behavior.

The Edit User feature will continue to update:

- Name
- Email
- Address

Password Change and Admin Password Reset are separate future features. They are not part of this change and must not be added as replacement UI or new API behavior.

This is a frontend-focused change. The Laravel backend, routes, validation contract, authorization policies, response formats, authentication, and password hashing behavior remain unchanged.

## 2. Current Architecture Findings

### 2.1 Frontend application structure

- The frontend is a React 19/Vite application using Material UI, browser `fetch`, and plain CSS.
- There is no React Router, authentication context, form library, or global state library.
- `App.jsx` owns the authenticated gate, stores the bearer token under localStorage key `token`, and retains a sanitized `currentUser` object in memory after login.
- `App.jsx` clears the token and in-memory `currentUser` on logout and unauthenticated transitions.
- `UserListPage.jsx` owns the list query, result, loading, error, retry, selected-user, dialog, authorization, and refresh state.
- `UserTable.jsx` is presentational and sends row action callbacks to `UserListPage`.
- `UserEditDialog.jsx` owns the edit draft, client validation, field errors, form-level errors, saving state, and submit behavior.

### 2.2 Authentication and identity

- `LoginForm.jsx` calls `loginUser()` from `authApi.js`.
- The Laravel login response contains `message`, `user`, and `token`.
- The frontend stores only the token in localStorage and retains only `id`, `name`, `email`, and `role` from the login user object in memory.
- Passwords, tokens, and password-related fields are not part of `currentUser`.
- If a stored token exists after a browser refresh, `currentUser` may be unavailable because the frontend does not currently bootstrap identity through `/api/me`.
- Missing current-user information causes the existing frontend action guard to default-deny protected action dialogs without exposing token data.

### 2.3 API and error conventions

- `usersApi.js` owns `fetchUsers()`, `updateUser()`, `deleteUser()`, and `updateUserRole()`.
- `usersApi.js` uses `VITE_API_BASE_URL`, bearer authentication from localStorage, `Accept: application/json`, and `Content-Type: application/json` for JSON mutations.
- `UsersApiError` is defined in `apiError.js` and is used for normalized network, HTTP, validation, authorization, and malformed-response errors.
- `UserEditDialog` maps an available `payload.errors` object to field messages and keeps the dialog open on failure.
- No new dependency or notification system is required for password removal.

### 2.4 Prompt-file note

The workspace contains a zero-byte file named `frontend/docs/prompts/user-edit-password-removal.md ` with a trailing space in its filename. The requested path without the trailing space is not present. This specification is therefore based on the explicit task requirements and the inspected implementation. The prompt file is not renamed or modified.

## 3. Current Edit User Behavior

### 3.1 Authorization

The current frontend guard mirrors the Laravel `UserPolicy` rules before opening the edit dialog:

- Admins may edit any listed user.
- Non-admin users may edit only their own row.
- Unknown or unavailable current-user identity defaults to blocked.
- A blocked attempt opens the safe Material UI permission dialog and does not call the API or open `UserEditDialog`.

The backend remains authoritative. A direct or stale-client request can still receive HTTP 403 and must continue to be handled safely.

### 3.2 Edit dialog

`UserEditDialog.jsx` currently:

- Opens for the selected row after authorization succeeds.
- Initializes and synchronizes its draft when the selected user changes.
- Shows Name, Email, Password, and Address fields.
- Requires Name and Email in the client form.
- Treats Address as optional and submits an empty value as `null`.
- Treats Password as optional and validates a non-empty value as at least eight characters.
- Trims Name and Email before submission but does not trim password characters.
- Sends an update through `updateUser(user.id, payload)`.
- Shows `Saving…` and disables controls while the request is pending.
- Keeps the dialog open and preserves context on validation, authorization, network, and other errors.
- Clears transient dialog state and refreshes the User List after a successful update.
- Clears local authentication and returns to LoginPage when the API reports an unauthenticated session.

### 3.3 Current update payload

The current frontend sends:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "address": "Updated Address",
  "password": "optional-password"
}
```

The `password` property is currently included only when the user enters a non-empty new password.

## 4. Current Password Handling

### 4.1 Edit User password behavior

The existing Edit dialog has a password draft field, password-specific client validation, password helper text, and conditional password payload construction. This is the only password behavior that this feature removes.

After this change, User Edit must not:

- Render a Password input.
- Keep a password value in its React draft state.
- Validate a password as part of Edit User.
- Include a `password` property in the Edit User request body.
- Describe blank password behavior because there will be no password field.

### 4.2 Backend password behavior that remains

The backend currently accepts password in `UpdateUserRequest` as an optional nullable string with a minimum length of eight characters. `UserController::update()` hashes a supplied password before updating the model.

That backend behavior remains unchanged for compatibility and for a future dedicated password feature. This specification does not expose or invoke it from the Edit User UI.

### 4.3 Authentication password behavior

- `AuthController::login()` continues to accept the login password and uses it to authenticate the user.
- `LoginForm.jsx` continues to collect and submit the login password unchanged.
- `authApi.js` login and logout behavior is unchanged.
- Laravel hides `password` and `remember_token` from serialized User responses.
- No password is stored in `currentUser`, localStorage, URLs, logs, or UI identity display.

### 4.4 Separate future features

The following remain separate future features with their own specification, authorization, UI, and API decisions:

- Password Change: a user changes their own password through a dedicated flow.
- Admin Password Reset: an authorized administrator resets another user's password through a dedicated flow.

Neither feature should be implemented, implied by the Edit dialog, or added to the current User List Actions API in this change.

## 5. Required UI Changes

### 5.1 Edit dialog fields

Remove only the Password field and its related behavior from `UserEditDialog`.

The dialog must retain:

- Name: required text field.
- Email: required email field.
- Address: optional multiline field.
- Cancel action.
- Save changes action.

The title remains `Edit user` or the existing equivalent. The dialog must continue using the existing MUI `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Stack`, `TextField`, `Alert`, and progress components.

### 5.2 Form copy and layout

- Remove password helper text and any copy suggesting that leaving a password blank preserves the existing password.
- Keep the existing field labels, spacing, autofocus behavior, and responsive dialog layout unless removing the field requires a small layout adjustment.
- Do not add a Password Change link, reset control, visibility toggle, or password explanation to this dialog.
- Keep accessible labels and focus behavior for Name, Email, Address, Cancel, and Save changes.

### 5.3 Submit behavior

The Edit User request body must contain only the supported fields currently edited by this feature:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "address": "Updated Address"
}
```

Name and Email are trimmed as before. Address remains nullable. No `password`, `role`, `photo`, `id`, timestamp, or unknown property may be added.

## 6. Frontend Files to Modify

### Required application file

- `frontend/src/components/users/UserEditDialog.jsx`
  - Remove the password property from the draft initializer.
  - Remove password validation.
  - Remove the Password `TextField` and password helper text.
  - Remove conditional password payload construction.
  - Preserve all other edit state synchronization, validation, API, loading, error, and success behavior.

### Documentation file

- `frontend/docs/specs/user-edit-password-removal.md`
  - Record this approved implementation scope and acceptance criteria.

### Possible verification-only changes

If a frontend test harness exists in a later implementation task, tests may be added or updated to verify the payload and absence of the password field. No test dependency or application architecture change is required by this specification.

## 7. Files That Should Remain Unchanged

The following files should not be modified for this focused change:

- `frontend/src/App.jsx`
- `frontend/src/pages/UserListPage.jsx`
- `frontend/src/components/users/UserTable.jsx`
- `frontend/src/components/users/UserAuthorizationDialog.jsx`
- `frontend/src/components/users/UserDeleteDialog.jsx`
- `frontend/src/components/users/UserRoleDialog.jsx`
- `frontend/src/components/auth/LoginForm.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/services/usersApi.js`
- `frontend/src/services/authApi.js`
- `frontend/src/services/apiError.js`
- `frontend/src/App.css`, unless a purely necessary dialog spacing correction is discovered during implementation
- All Laravel backend files
- `package.json` and lockfiles

No API helper, endpoint, route, response contract, dependency, or global state change is required.

## 8. Backend/API Impact

### 8.1 No backend changes

Do not modify Laravel controllers, requests, models, policies, routes, resources, migrations, or tests for this feature.

The existing backend remains responsible for:

- Bearer-token authentication through `auth:sanctum`.
- Edit authorization through `UserPolicy::update()`.
- Name, email, password, and address validation through `UpdateUserRequest`.
- Password hashing in `UserController::update()` when a password is supplied by a future supported flow.
- Returning the existing `UserResource` response.

### 8.2 Existing endpoint remains in use

The frontend continues to call:

```text
PUT {API base}/api/users/{userId}
```

The endpoint and `updateUser()` service function remain unchanged. The only contract change in this feature is that the Edit User frontend stops sending the optional password property and sends the existing editable fields only.

### 8.3 Authorization remains authoritative

The frontend must preserve the existing authorization guard for known users, but it must not be treated as security. Laravel remains the final authority and existing HTTP 401/403 handling remains unchanged.

## 9. Validation and Error-Handling Considerations

### 9.1 Client validation after removal

Retain the existing validation for the remaining fields:

- Name is required after trimming and must be no longer than 255 characters.
- Email is required after trimming and must pass the existing reasonable email format check.
- Address may be blank and is submitted as `null` when blank.
- There is no password validation in Edit User.

Do not add client validation for fields that the form no longer collects.

### 9.2 Backend validation

Backend validation remains authoritative. `UpdateUserRequest` currently permits `name`, `email`, optional `password`, and nullable `address`; the frontend will submit only `name`, `email`, and `address`.

Email uniqueness must continue to be evaluated by Laravel while ignoring the selected user's existing record. The frontend must continue mapping a returned `errors` object to Name, Email, and Address where available.

### 9.3 Request and response outcomes

Preserve the existing behavior:

- 200 success: close the dialog and refresh the current User List query.
- 401: invoke the existing unauthenticated transition and render LoginPage.
- 403: keep the dialog context, show the existing safe authorization error, and do not claim success.
- 404: show the selected-user-not-found error and keep context.
- 422: preserve the edited values, show field/form errors, and keep the dialog open.
- Network or other failures: show the existing safe retryable error and keep the dialog open.
- Malformed success response: preserve the existing normalized API error behavior.

Removing password must not change loading, duplicate-submit prevention, refresh, stale-response protection, or error normalization.

## 10. Security Considerations

- The Edit User UI must never collect, display, store, log, or submit a password.
- Do not retain a password in `currentUser`, localStorage, session state, URLs, query strings, or error messages.
- Do not expose bearer tokens or raw API payloads.
- Keep Laravel policy enforcement and backend validation unchanged.
- Do not infer that removing a UI field removes backend password-update capability; a future dedicated feature must define its own authorization and validation.
- Do not silently repurpose Edit User as Password Change or Admin Password Reset.
- Preserve the existing 401 session-clearing behavior and 403 authorization behavior.
- The existing LoginForm password field and authentication request are outside this change and remain necessary.

## 11. Acceptance Criteria

### Edit User UI

1. UserEditDialog no longer renders a Password field.
2. UserEditDialog contains Name, Email, and Address fields with their existing labels and behavior.
3. No password helper text, password validation, or password-related Edit copy remains.
4. Cancel and Save changes continue to work with the existing MUI dialog behavior.
5. Existing selected-user draft synchronization remains correct when the dialog is reused for another user.

### API and state behavior

6. A successful Edit User request sends only `name`, `email`, and `address`.
7. The request never includes a `password` property, even when the dialog is submitted after editing other fields.
8. `updateUser()`, its endpoint, headers, token behavior, response handling, and `UsersApiError` behavior remain unchanged.
9. Saving disables controls, prevents duplicate submissions, and shows the existing loading state.
10. Successful edits close the dialog and refresh the list while preserving existing query/page behavior.

### Validation and authorization

11. Name, Email, and Address retain their existing client and backend validation behavior.
12. Existing edit authorization remains unchanged: admins may edit any user and non-admins may edit only their own user.
13. 401, 403, 404, 422, network, and malformed-response behavior remains safe and context-preserving.

### Scope and security

14. Password Change and Admin Password Reset are not implemented.
15. Login password handling remains unchanged.
16. No Laravel backend files, API endpoints, response contracts, dependencies, or unrelated User List functionality are changed.
17. No password or token is displayed, logged, persisted, or included in the Edit User payload.

## 12. Test Scenarios

### Edit form rendering and state

1. Open Edit User for a permitted row and verify Name, Email, and Address are prefilled.
2. Verify no Password input or password helper text is present.
3. Change the selected user and verify the draft resets to the new user's Name, Email, and Address.
4. Cancel the dialog and verify no request is sent and list data is unchanged.
5. Reopen the dialog after a validation error and verify transient errors do not leak to the next selected user.

### Client validation

6. Submit an empty Name and verify the existing required-field error.
7. Submit an invalid or empty Email and verify the existing email error.
8. Submit a valid blank Address and verify it is treated as nullable.
9. Verify no password validation is run and no password-related field error can be produced by the Edit form.

### Request payload and success

10. Edit Name, Email, and Address and verify the PUT body contains exactly those fields.
11. Verify the PUT body does not contain `password`, `role`, `photo`, `id`, timestamps, or unknown properties.
12. Verify the existing bearer token and JSON headers remain unchanged.
13. Verify a successful response closes the dialog and refreshes the current list.
14. Verify the current search term and page behavior remain unchanged after refresh.

### Loading and failures

15. Verify Save changes is disabled and shows the existing saving indicator while the request is pending.
16. Verify a second submission cannot create a duplicate request.
17. Verify HTTP 422 preserves Name, Email, and Address values and maps returned field errors.
18. Verify HTTP 403 keeps the dialog context and shows a safe authorization error.
19. Verify HTTP 401 clears authentication and returns to LoginPage.
20. Verify 404, network, generic HTTP, and malformed-response errors preserve safe dialog context.
21. Verify a successful mutation followed by a refresh failure does not repeat the mutation.

### Authorization and security

22. Verify an admin can open Edit User for any listed row.
23. Verify a non-admin can open Edit User only for their own row.
24. Verify a blocked edit attempt opens the permission dialog and does not call `updateUser()`.
25. Verify no password, token, raw payload, stack trace, or backend exception details appear in the UI or logs.
26. Verify LoginForm still accepts the login password and login behavior is unchanged.

### Regression checks

27. Verify Delete User, Change User Role, User List search, pagination, logout, and authentication gating remain unchanged.
28. Run the available frontend lint and production build checks.
29. Run `git diff --check` and confirm no backend or unrelated files changed.

## 13. Implementation Plan

1. Read this specification and inspect the current `UserEditDialog.jsx` implementation before editing.
2. Remove `password` from `getInitialDraft()` and all password-specific state usage.
3. Remove the password validation branch and Password `TextField`.
4. Remove conditional `payload.password` construction from submit handling.
5. Leave the Name, Email, Address, authorization callback, API call, loading, error, refresh, and selected-user synchronization paths unchanged.
6. Confirm `usersApi.js`, `authApi.js`, `App.jsx`, `UserListPage.jsx`, backend files, and dependency manifests were not modified.
7. Run the frontend lint/build checks and `git diff --check`.
8. Inspect the final diff and working-tree status without committing.

## 14. Open Questions and Assumptions

- The requested prompt path is not present as a normal filename in the workspace; the only matching file is an empty file with a trailing space in its name. This spec uses the explicit requirements and actual source inspection as the source of truth and does not alter that file.
- The existing `PUT /api/users/{user}` backend contract continues to support password updates, but the Edit User frontend will no longer exercise that field.
- Password Change and Admin Password Reset require separate future specifications and may use different UI, authorization, validation, and API flows.
- No `/api/me` request or authentication-state change is needed for password removal.
- No frontend test runner is currently defined in `frontend/package.json`; verification should use the available lint/build checks unless a separate test harness is introduced later.
