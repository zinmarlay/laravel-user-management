# User List Actions UI Specification

## 1. Overview

Improve the authenticated User List presentation and action behavior before the Profile feature while preserving the existing User List Actions, Login, Logout, search, pagination, and API contracts.

This specification covers:

- Compact Material UI buttons for Edit, Delete, and Change Role.
- Client-side authorization feedback before an unauthorized action dialog opens.
- Display of the currently logged-in user's name, email, and role beside Logout.
- Responsive and accessible behavior for the User List header, table, actions, and authorization dialog.
- Compatibility with the existing Laravel policy and API authorization behavior.

No backend authorization system, route, response format, router, or state-management library is required.

## 2. Current Architecture Findings

### 2.1 Frontend authentication and logout

The frontend is a React 19/Vite application using Material UI, browser fetch, and plain CSS. It has no React Router, authentication context, or global state library.

Current authentication flow:

1. App.jsx initializes an authenticated boolean from localStorage key token.
2. LoginForm calls authApi.loginUser and receives the direct Laravel response containing message, user, and token.
3. App currently stores only response.token under localStorage key token and sets authenticated to true. It does not currently retain response.user in React state.
4. App renders UserListPage when authenticated and LoginPage otherwise.
5. UserListPage and its action dialogs use usersApi.js for protected requests. A normalized 401 calls App's unauthenticated callback, which removes token and renders LoginPage.

Current logout flow:

- UserListPage already renders a Logout button in its header.
- authApi.logoutUser reads localStorage key token, skips the request when no usable token exists, and otherwise sends POST /api/logout with Accept and a Bearer token.
- UserListPage catches logout errors and always calls App's onLogout callback.
- App removes token and sets authenticated to false, including when localStorage removal throws.
- LoginPage is rendered after logout and the authenticated User List is unmounted.

The existing login response contains the user information required for the header:

~~~json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Jane User",
    "email": "jane@example.com",
    "address": "123 Main Street",
    "photo": null,
    "role": "user",
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  },
  "token": "1|sanctum-plain-text-token"
}
~~~

The password and remember_token fields are hidden by the Laravel User model and must never be stored or displayed by this UI.

### 2.2 User List and action components

- UserListPage.jsx owns query, result, loading, error, retry, refresh, selected-user, and dialog-open state.
- UserTable.jsx renders Photo, Name, Email, Role, Address, and Actions columns.
- UserTable currently uses compact MUI Button components with visible labels Edit, Delete, and Change Role. Edit and Change Role use the normal button treatment; Delete uses the error color.
- UserListPage opens UserEditDialog, UserDeleteDialog, or UserRoleDialog from the row callbacks.
- Selecting a user disables other row actions while the selected dialog is active.
- UserEditDialog synchronizes its draft and transient errors when the selected user changes, validates editable fields, and calls updateUser.
- UserDeleteDialog requires confirmation and calls deleteUser.
- UserRoleDialog restricts choices to user and admin and calls updateUserRole.
- Successful actions close their dialog and refresh the list while preserving the current query/page behavior.

### 2.3 API and error conventions

usersApi.js owns:

- fetchUsers()
- updateUser()
- deleteUser()
- updateUserRole()
- Protected-request headers, bearer-token lookup, mutation response parsing, and UsersApiError normalization.

apiError.js defines UsersApiError and usersApi.js re-exports it for compatibility. authApi.js owns login/logout API calls and uses the same error class.

Existing mutation endpoints are:

~~~text
PUT   /api/users/{userId}
DELETE /api/users/{userId}
PATCH /api/users/{userId}/role
~~~

Existing normalized behavior includes:

- 401: code unauthenticated; App must clear authentication and show LoginPage.
- 403: action-specific authorization error; the UI must preserve context and must not claim success.
- 404: selected user not found.
- 422: validation error with payload errors when provided.
- Network and other failures: safe retryable UsersApiError.

## 3. Laravel Authorization Findings

All User routes are inside the auth:sanctum middleware group. The frontend must continue treating backend authorization as the final security boundary.

### 3.1 Existing policy rules

UserPolicy currently defines:

- viewAny: any authenticated user may view the User List.
- update: an admin may edit any user; a non-admin may edit only their own user record.
- delete: only an admin may delete a user, including another user or the admin's own record.
- updateRole: only an admin may change a user's role.

These are the rules the frontend UX guard must mirror. The frontend must not create a different permission model.

### 3.2 Controller and response behavior

UserController applies Gate::authorize before update, delete, and updateRole. The backend therefore remains authoritative even if a client bypasses or alters frontend state.

- Edit uses PUT /api/users/{user} and returns the updated UserResource on success.
- Delete uses DELETE /api/users/{user} and returns 204 No Content on success.
- Change Role uses PATCH /api/users/{user}/role, validates role as exactly admin or user, and returns the updated UserResource on success.
- Unauthorized authenticated requests return HTTP 403 through Laravel authorization handling.
- Missing or invalid authentication returns HTTP 401 through auth:sanctum.

No backend changes are required for this UI feature.

## 4. User List Action Button UI

### 4.1 Button design

Render one compact Material UI Button for each action in every table row:

- Edit: compact normal or outlined button with visible text Edit.
- Delete: compact contained or outlined button using color error with visible text Delete.
- Change Role: compact normal or outlined button with visible text Change Role.

Do not add icons, icon dependencies, or another UI library. Keep clear text labels and preserve MUI focus indicators, keyboard activation, and disabled behavior.

Each button must have an accessible name that identifies its row target, for example Edit Jane User, Delete Jane User, and Change role for Jane User. If the name is unavailable, use a safe fallback such as Edit user.

### 4.2 Actions column layout

- Keep the Actions column readable and compact on desktop and tablet.
- Use a horizontal compact button group where space allows.
- Allow wrapping within the cell when necessary.
- On narrow screens, retain all actions and allow the existing table container to scroll horizontally rather than hiding required controls.
- Do not change the row data columns or action semantics.

### 4.3 Existing action behavior

The button click must continue to open the existing dialog only after the frontend authorization check allows it:

- Edit opens UserEditDialog.
- Delete opens UserDeleteDialog.
- Change Role opens UserRoleDialog.

The existing selected-user, loading, disabled, refresh, search, and pagination behavior must remain intact.

## 5. Frontend Authorization UX

Frontend authorization is a usability and early-feedback layer only. It must never replace backend policy enforcement.

### 5.1 Allowed actions

Use the retained authenticated user and selected target user:

| Action | Admin | Non-admin on own row | Non-admin on another row |
| --- | --- | --- | --- |
| Edit | Allowed | Allowed | Blocked |
| Delete | Allowed | Blocked | Blocked |
| Change Role | Allowed | Blocked | Blocked |

The role comparison must use the actual role value returned by the login response. Display labels may be Admin and User, but permission logic must use the backend values admin and user.

### 5.2 Unauthorized click flow

When a non-admin clicks a blocked action:

1. Do not call usersApi.js.
2. Do not open UserEditDialog, UserDeleteDialog, or UserRoleDialog.
3. Set local authorization-alert state for the selected action and target.
4. Open a dedicated Material UI Alert/Dialog explaining why the action is unavailable.
5. Keep the User List and its data unchanged.

Recommended messages:

- Editing another user: You can edit your own profile, but only administrators can edit another user.
- Delete: Only administrators can delete users.
- Change Role: Only administrators can change user roles.

Use a safe title such as Permission required. Do not include tokens, passwords, raw API payloads, or sensitive backend details.

### 5.3 Authorization dialog behavior

A dedicated UserAuthorizationDialog component is preferred to keep UserListPage focused. It should use MUI Dialog, DialogTitle, DialogContent, and DialogActions, with:

- Title: Permission required.
- A concise safe message selected for the attempted action.
- One Close button.
- Close on the Close button, Escape, or the standard accessible dialog close interaction when not blocked by loading; there is no API request or loading state for this dialog.
- Focus moved into the dialog according to MUI behavior and returned to the triggering action after close where supported.
- A clear accessible dialog label and keyboard activation through Enter/Space on the triggering button.

### 5.4 Admin flow

When the retained current user has role admin, the frontend authorization check permits all three action types and opens the existing action dialog. The existing API call, validation, loading, success refresh, and 401/403 handling continue unchanged.

### 5.5 Missing current-user information

The current implementation does not retain response.user after login and does not call /api/me on application initialization. The smallest clean change is:

- Add currentUser state in App.jsx.
- Set currentUser to response.user on successful login.
- Pass currentUser to UserListPage.
- Clear currentUser alongside token on logout or unauthenticated transition.
- Keep currentUser in memory only; do not persist a second user object or any password/token data.

If a token exists after a browser refresh but currentUser is unavailable, do not guess permissions. Show a neutral fallback header and block protected action dialogs with a safe message such as User permissions are unavailable. Please sign in again. The backend remains authoritative if any request is attempted, but default-deny is the safe frontend UX while identity/role is unknown.

Fetching /api/me to restore identity may be considered later, but it is not required for this focused UI change because the endpoint is not currently used by App and the login response already includes user information.

## 6. Current Logged-In User Display

### 6.1 Header content

The authenticated User List header must display, beside the existing Logout button:

- Current user's name.
- Current user's email.
- Current user's role as a human-readable Admin or User label.

Recommended layout:

~~~text
Users    Jane User • jane@example.com • User    Logout
~~~

Use a responsive MUI layout such as Box/Stack and optionally a Chip for the role. Do not display the token, password, timestamps, or unrelated profile fields.

### 6.2 Role presentation

Map backend role values as follows:

- admin → Admin
- user → User

If the backend or current user object contains another role value, show a neutral Unknown role label and default action gating to blocked until permissions are known. Do not invent new role permissions.

### 6.3 Missing information

If currentUser is unavailable:

- Keep the Logout button visible and usable.
- Show a neutral identity fallback such as Signed-in user rather than fabricating a name or email.
- Show Role unavailable or omit the role chip.
- Do not show token data as a fallback.
- Block action dialogs until the current identity and role are known, with the safe authorization message described above.

### 6.4 Responsive behavior

- Desktop: place Users, identity details, role label, and Logout in one aligned header row when space permits.
- Tablet: allow identity text to wrap while keeping Logout visible and reachable.
- Mobile: stack or wrap the identity block and Logout button; keep the button at a comfortable touch size and prevent horizontal overflow.
- Long names and emails must wrap or truncate with accessible full text; they must not force the table or page wider than the viewport.
- Logging out clears currentUser through App state, so the identity display disappears when LoginPage renders.

## 7. Authentication and Logout Compatibility

The implementation must preserve:

- LoginForm validation and loginUser behavior.
- Token storage under exactly localStorage key token.
- App authentication gating.
- Logout API behavior and local token cleanup.
- User List initial loading, search, pagination, and retry behavior.
- Edit, Delete, and Change Role dialog behavior.

The logout flow must remain:

1. UserListPage calls authApi.logoutUser.
2. On success, 401, network failure, other API failure, malformed response, or missing token, UserListPage invokes App's local logout callback.
3. App removes token, clears currentUser, sets authenticated false, and renders LoginPage.

No login or logout API relocation is required. authApi.js remains the authentication service; usersApi.js remains the User List service.

## 8. Error and Security Behavior

### 8.1 API outcomes

- 401: remove local authentication through the existing App callback and render LoginPage; do not retry.
- 403: keep the relevant existing action dialog open when already open, show a safe action-specific authorization Alert, and do not claim success.
- 404: show the existing selected-user-not-found error and preserve context.
- 422: map field errors where available and preserve form/dialog state.
- Network or other errors: show safe retryable action errors and preserve context.

The new frontend authorization dialog must prevent the request before opening a protected action dialog for known unauthorized users, but it must not suppress backend 403 handling for race conditions, stale role data, or tampered clients.

### 8.2 Security requirements

- Frontend role checks are UX only; Laravel policies remain the final boundary.
- Never store passwords.
- Never display or log authentication tokens.
- Never put tokens in URLs or query strings.
- Never expose raw response payloads, stack traces, or backend exception text.
- Do not persist currentUser as a second authentication store; keep only the non-sensitive login user object in App memory.
- Remove currentUser when token/authentication is cleared so identity details cannot remain visible after logout.
- Do not allow disabled/hidden UI controls to be treated as sufficient backend protection.

## 9. Likely File Scope

### Files likely to change

- frontend/src/App.jsx: retain response.user in memory, pass currentUser to UserListPage, and clear it on logout/unauthenticated transitions.
- frontend/src/pages/UserListPage.jsx: accept currentUser, add action authorization guards, render the current-user header, and manage authorization-dialog state.
- frontend/src/components/users/UserTable.jsx: refine button variants, compact layout, accessible labels, and action callback inputs if needed.
- frontend/src/App.css: style the header identity block, role display, responsive wrapping, and any authorization-dialog-adjacent layout without disturbing existing Login/User List styles.

### File likely to be created

- frontend/src/components/users/UserAuthorizationDialog.jsx: focused reusable MUI permission Alert/Dialog with accessible close behavior.

### Files that should remain unchanged

- frontend/src/components/auth/LoginForm.jsx: no behavior change required.
- frontend/src/pages/LoginPage.jsx: no behavior change required.
- frontend/src/services/authApi.js: existing login/logout behavior is sufficient; only adjust if current-user state integration proves necessary, without changing API behavior.
- frontend/src/services/usersApi.js: existing User List and mutation API behavior is sufficient; no endpoint changes are required.
- Laravel backend files: existing UserPolicy, UserController, auth:sanctum routes, and logout endpoint provide the required authorization/security boundary.

## 10. Acceptance Criteria

### Action buttons and existing behavior

1. Each row displays compact, readable MUI Edit, Delete, and Change Role buttons with visible labels.
2. Delete is visibly destructive; Edit and Change Role use normal/outlined styling.
3. Buttons have accessible names identifying the target user and visible focus states.
4. Edit opens UserEditDialog for an allowed action and preserves existing form/loading/error behavior.
5. Delete opens UserDeleteDialog for an allowed action and preserves explicit confirmation, loading, and refresh behavior.
6. Change Role opens UserRoleDialog for an allowed action and preserves exact user/admin validation, loading, and refresh behavior.

### Authorization

7. Admins may open Edit, Delete, and Change Role for any listed user.
8. Non-admins may edit their own row only.
9. Non-admins cannot open Delete or Change Role for any row.
10. Non-admins cannot open Edit for another user's row.
11. A blocked action opens the permission dialog, not the protected action dialog, and sends no API request.
12. Backend 403 responses remain handled safely as the final authorization result.

### Current-user display and logout

13. After login, the header displays the current user's name, email, and Admin/User role without exposing credentials or tokens.
14. If identity data is unavailable, a neutral fallback is shown and protected action dialogs are blocked by default.
15. Logout remains visible and usable.
16. Logout clears the displayed user information and returns to LoginPage as it does currently.
17. Refreshing after logout does not show authenticated user information.

### Responsive and accessibility behavior

18. Desktop, tablet, and mobile layouts keep the identity/header controls usable without overflow.
19. The table remains horizontally usable on narrow screens and does not hide required actions.
20. All new buttons and dialogs support keyboard interaction, focus management, accessible labels, and visible focus states.

### Security and preservation

21. Frontend guards do not replace backend authorization.
22. No password, token, raw payload, or stack trace is displayed or logged.
23. Existing Login, Logout, loading, search, pagination, Edit, Delete, and Change Role behavior remains functional.
24. No backend files, routes, policies, or API response formats are changed.

## 11. Test Scenarios and Verification

### Authentication and authorization scenarios

1. Log in as an admin and verify current name, email, and Admin label are retained in App and displayed.
2. Log in as a normal user and verify current name, email, and User label are retained in App and displayed.
3. Verify an admin sees Edit, Delete, and Change Role buttons for every row.
4. Verify a normal user clicking another user's Edit receives the permission dialog.
5. Verify a normal user clicking Delete receives the permission dialog.
6. Verify a normal user clicking Change Role receives the permission dialog.
7. Verify the permission dialog has the expected title/message, Close action, Escape behavior, keyboard accessibility, and no API request.
8. Verify a blocked action does not open UserEditDialog, UserDeleteDialog, or UserRoleDialog.
9. Verify an admin action continues into the existing dialog and API flow.
10. Verify a normal user can edit their own row when the backend policy permits it.

### Existing action scenarios

11. Verify Edit opens UserEditDialog with the selected user's values.
12. Verify Delete opens UserDeleteDialog and still requires explicit confirmation.
13. Verify Change Role opens UserRoleDialog with only user and admin options.
14. Verify successful actions refresh the list without losing the current search/page where existing behavior supports it.
15. Verify action loading and disabled states prevent duplicate requests.

### Current-user and logout scenarios

16. Verify the header displays name, email, and human-readable role.
17. Verify missing current-user data uses the neutral fallback and blocks protected actions.
18. Verify logout removes the displayed user information and renders LoginPage.
19. Verify browser refresh after logout does not show authenticated identity information.

### Responsive and accessibility scenarios

20. Verify desktop layout keeps header identity, role, Logout, and action buttons readable.
21. Verify tablet layout wraps identity content without hiding Logout.
22. Verify mobile layout avoids horizontal header overflow and keeps the table/actions usable through horizontal scrolling.
23. Verify keyboard focus, Enter/Space activation, Escape-to-close, and visible focus states for buttons and dialogs.

### API/security scenarios

24. Verify protected API 401 still clears authentication and returns to LoginPage.
25. Verify API 403 from a race condition or stale client role shows a safe authorization error and does not claim success.
26. Verify no token, password, raw payload, or stack trace appears in UI or logs.

### Project checks

Run:

~~~text
npm run lint
npm run build
git diff --check
~~~

## 12. Implementation Plan and Open Questions

### Current architecture findings

- App currently keeps only the authenticated boolean and token persistence; it does not retain login response.user.
- The backend already supplies role-specific authorization through UserPolicy and Gate::authorize.
- Current MUI action buttons and dialogs already preserve the core User List Actions behavior.
- Current authApi.js and usersApi.js separation should remain unchanged.
- Current logout already clears local authentication and renders LoginPage.

### Required changes

1. Add currentUser state to App and set it from the existing login response.user.
2. Clear currentUser whenever App clears authentication.
3. Pass currentUser to UserListPage.
4. Add frontend action-permission evaluation using the exact backend policy rules.
5. Add a permission dialog for blocked action attempts.
6. Refine action button variants and compact responsive styling if needed.
7. Add the identity/role header display beside Logout.
8. Preserve existing API calls, dialogs, refresh, search, pagination, logout, and 401/403 handling.

### Files to modify

- App.jsx
- UserListPage.jsx
- UserTable.jsx
- App.css
- Add UserAuthorizationDialog.jsx if the focused component approach is used.

### Files to keep unchanged

- LoginForm.jsx and LoginPage.jsx, except for compatibility-only prop changes if required.
- authApi.js and usersApi.js API behavior.
- All Laravel backend files.

### Step-by-step implementation plan

1. Extend App authentication state to retain only the non-sensitive user object from the login response.
2. Clear the retained user object in both logout and unauthenticated transitions.
3. Pass currentUser and the existing auth callbacks into UserListPage.
4. Define a small pure permission check for edit-own, admin-all, admin-only delete, and admin-only role changes.
5. Guard row action callbacks before selecting a user or opening an action dialog.
6. Show UserAuthorizationDialog for blocked actions and return focus after it closes.
7. Refine UserTable button variants, labels, compact spacing, and responsive behavior.
8. Add the identity/role header layout beside the existing Logout button.
9. Add neutral fallback behavior and default-deny action behavior when currentUser is unavailable.
10. Verify that existing dialogs, API services, refresh, search, pagination, logout, and session-expiration behavior remain unchanged.
11. Run the frontend lint/build/diff checks and execute the listed UI/API scenarios.

### Open questions and assumptions

- The current implementation can have a token after browser refresh without an in-memory currentUser. This specification chooses a neutral fallback and default-deny action UX rather than adding a new /api/me bootstrapping request.
- If product requirements later require identity restoration after refresh, /api/me already exists and can be considered in a separate authentication-state enhancement.
- Permission dialog wording may be refined for product tone, but it must remain safe, concise, and action-specific.
- No success Snackbar is required because the current project has no established notification system.
