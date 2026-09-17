# User Logout Specification

## 1. Overview and Scope

The Logout feature signs the current user out of the User Management frontend, revokes the current Laravel Sanctum token when possible, clears the local authentication token, and returns the application to LoginPage.

This specification is based on the existing frontend login/authentication implementation and the current Laravel AuthController. It covers frontend logout behavior only. The backend already provides the required logout endpoint, so no Laravel changes are required.

The feature includes:

- A visible Logout action on the authenticated User List experience.
- A protected API request to revoke the current Sanctum token.
- Local token cleanup using the existing localStorage key, token.
- App authentication-state cleanup and rendering of LoginPage.
- Safe handling of successful, missing-token, expired-token, network, and other API outcomes.
- Protection against duplicate logout requests.

Registration, login, password reset, user management actions, and router-based navigation are out of scope.

## 2. Current Authentication Architecture

### 2.1 React frontend

The frontend is a Vite React application using React 19 and Material UI. It does not use React Router, an authentication context, or a global state library.

The current authentication-related files are:

- src/App.jsx: owns the authenticated boolean state and chooses LoginPage or UserListPage.
- src/pages/LoginPage.jsx: renders the login page and passes authentication success to LoginForm.
- src/components/auth/LoginForm.jsx: owns controlled login fields, validation, loading, and login errors.
- src/services/authApi.js: owns login API communication and login-specific error normalization.
- src/services/apiError.js: defines the shared UsersApiError class.
- src/services/usersApi.js: owns protected User List and mutation APIs and re-exports UsersApiError for compatibility.
- src/pages/UserListPage.jsx: renders the protected User List and currently receives an onUnauthenticated callback from App.
- src/App.css: contains the existing responsive User List and Login styles.

### 2.2 Login flow

The existing login flow is:

1. App initializes authenticated state from the presence of a non-empty localStorage token.
2. If no token exists, App renders LoginPage.
3. LoginForm validates the email and password and calls authApi.loginUser.
4. loginUser sends POST /api/login to the configured VITE_API_BASE_URL and returns the direct Laravel response containing message, user, and token.
5. App stores response.token under localStorage key token.
6. App sets authenticated to true and renders UserListPage without a full page reload.
7. User List requests and mutations read the same token key and send it as a Bearer token.

### 2.3 Authentication token handling

The authoritative token key is:

~~~text
token
~~~

The existing App.jsx reads and writes window.localStorage.getItem('token'), setItem('token', response.token), and removeItem('token'). The API services use the same key when creating Authorization: Bearer headers.

The token must not be copied to a second key, placed in a URL, rendered in the UI, or logged. Logout must clear the local token even when the remote logout request cannot be completed.

### 2.4 App authentication state and session expiration

App.jsx owns the in-memory authenticated state. It currently provides an onUnauthenticated callback to UserListPage. Protected fetches and User List action dialogs use that callback when an API response is normalized as code unauthenticated, which removes token and renders LoginPage.

Logout must use the same state transition rather than introducing a second authentication mechanism. After logout, UserListPage must be unmounted and LoginPage must be rendered.

## 3. Logout User Flow

### 3.1 Logout action location

The authenticated User List page is currently the only protected page. Add the Logout action to its page header, alongside the Users heading or in an equivalent clearly visible header area.

The action must be available only while the user is authenticated. It must not appear on LoginPage.

The action should use an accessible Material UI Button with a clear label, Logout, and must be keyboard accessible.

### 3.2 Click behavior

When the user clicks Logout:

1. Prevent the click from creating another request if logout is already pending.
2. Capture or read the current token using the existing token key.
3. If a non-empty token exists, call the frontend logout service, which sends the authenticated backend request.
4. Disable the Logout control while the request is pending and show progress text or a CircularProgress indicator.
5. Regardless of remote success or failure, remove localStorage key token before completing the local sign-out transition.
6. Set App authenticated state to false.
7. Unmount protected UserListPage and render LoginPage without a full page reload.

The implementation must not retry logout automatically. A user can sign in again from LoginPage if needed.

### 3.3 Successful logout

For a successful backend response, the frontend must:

- Remove the token from localStorage.
- Set authenticated state to false.
- Return to LoginPage.
- Avoid displaying protected User List data after the transition.
- Avoid displaying the token or raw backend response.

The existing backend response is a direct JSON object:

~~~json
{
  "message": "Logout successful"
}
~~~

The frontend does not need to display this backend message.

### 3.4 Render behavior after logout

Because the project has no router, logout must be implemented through App state rather than navigation to a URL. LoginPage should render immediately after local auth state is cleared.

After a browser refresh, App must again find no token and render LoginPage. A previously rendered UserListPage must not remain accessible through stale in-memory state.

## 4. Backend Behavior

### 4.1 Existing endpoint

The Laravel backend already defines:

~~~text
POST /api/logout
~~~

The route is inside the auth:sanctum middleware group. The request therefore requires a valid Sanctum bearer token in:

~~~text
Authorization: Bearer <token>
~~~

No request body is required. The frontend should send Accept: application/json. Content-Type is not required when no body is sent.

### 4.2 AuthController implementation

AuthController::logout calls:

~~~php
$request->user()->currentAccessToken()->delete();
~~~

It deletes the current access token and returns HTTP 200 with:

~~~json
{
  "message": "Logout successful"
}
~~~

The endpoint is not public. Missing or invalid authentication is handled by the Sanctum middleware and must be treated by the frontend as an unauthenticated session.

No new backend route, controller method, migration, or Laravel configuration is required.

## 5. Frontend Behavior

### 5.1 Logout API service

Add logoutUser to src/services/authApi.js so authentication API code remains separate from usersApi.js.

The service must:

- Use POST /api/logout.
- Use the configured VITE_API_BASE_URL and the same trailing-slash normalization as login.
- Read the current token from localStorage key token or receive it through the existing auth flow without introducing another storage key.
- Send Accept: application/json.
- Send Authorization: Bearer <token> when a non-empty token exists.
- Parse the direct JSON response when present.
- Preserve the shared UsersApiError shape and distinguish network failures from HTTP failures.
- Avoid logging or returning the token in a user-facing result.

If no non-empty token exists, logoutUser must not send an unauthenticated request. It should return a local no-op result or an equivalent signal so App can complete local sign-out.

### 5.2 Logout UI

The User List header should include:

- A visible Logout button.
- An accessible label and keyboard interaction.
- A pending state using the existing Material UI loading pattern.
- A disabled state while the API request is pending.

The button must not expose token values or backend implementation details.

### 5.3 Authentication state

App should own the logout callback, parallel to the existing login success and unauthenticated callbacks. The recommended responsibilities are:

- UserListPage invokes the callback after the logout request resolves or fails.
- App removes localStorage key token.
- App sets authenticated to false.
- App renders LoginPage.

The callback must be safe if localStorage removal throws. In that case, App must still set in-memory authenticated state to false so protected content is not shown in the current session.

### 5.4 Loading and duplicate-click prevention

While logout is pending:

- Disable the Logout button.
- Show CircularProgress and a status such as Signing out… or Logging out….
- Prevent keyboard activation and pointer clicks from starting another request.
- Keep the User List layout stable.

Once local sign-out begins, abort or ignore stale protected-page updates so a completed User List request cannot restore protected content after logout.

## 6. Error Handling

Local sign-out is the security boundary for the browser. The frontend must remove the local token and return to LoginPage for every logout outcome, including remote failures.

| Condition | Expected behavior |
| --- | --- |
| HTTP 200 success | Remove token, set authenticated false, render LoginPage, and show no sensitive response data. |
| Missing token before click | Skip the API call, remove any stale token defensively, set authenticated false, and render LoginPage. |
| HTTP 401 expired or invalid token | Treat the session as already unauthenticated. Remove token, render LoginPage, and do not retry. A safe session-expired notice may be shown. |
| Network failure | Remove token and render LoginPage. Show a safe notice that local sign-out completed but the server could not be reached if the UX provides a notification channel. Do not expose network details or retain protected access. |
| Other HTTP failure | Remove token and render LoginPage. Show a generic non-sensitive notice if supported, and do not retry automatically. |
| Unexpected or malformed response | Remove token and render LoginPage. Treat the local session as signed out and show a generic safe notice if supported. |
| localStorage read failure | Treat the token as unavailable, skip the API call, and clear in-memory authentication. |
| localStorage remove failure | Still clear in-memory authentication and render LoginPage; do not keep protected content visible. |

The implementation must not show raw payloads, stack traces, bearer tokens, or backend exception text. A failed remote logout must not leave the user on a usable protected User List page.

## 7. Security Considerations

- Always remove localStorage key token during logout, including API errors and missing/expired-token cases.
- Clear App authenticated state so protected components are unmounted immediately after local sign-out.
- Do not store the token in React UI state solely for display or duplicate it under another key.
- Do not include the token in a URL, query string, error message, console log, or analytics payload.
- Send the bearer token only over the configured API base URL; deployed environments must use HTTPS.
- Disable the action while pending to prevent concurrent revoke requests and confusing state transitions.
- Do not render or retain User List content after authenticated state is false.
- A network failure may prevent the server from revoking the token, but removing it locally still prevents this browser from using it. The UI must clearly complete local sign-out without claiming more server certainty than is known.

## 8. Component and File Structure

The likely implementation should remain within the existing architecture:

~~~text
src/
  App.jsx
  App.css
  components/
    auth/
      LoginForm.jsx
  pages/
    LoginPage.jsx
    UserListPage.jsx
  services/
    apiError.js
    authApi.js
    usersApi.js
~~~

Likely responsibilities:

- App.jsx: provide the logout callback, remove the token, clear authenticated state, and render LoginPage.
- UserListPage.jsx: render the Logout action and its loading state, then invoke the App callback for local sign-out.
- authApi.js: add logoutUser alongside loginUser and normalize logout-specific failures using UsersApiError.
- App.css: add responsive User List header/logout styling while preserving existing login and User List styles.
- LoginPage.jsx: optionally display a safe sign-out/session-expiration notice passed from App.
- usersApi.js: no logout API implementation; retain User List fetch and mutation responsibilities.

No new router, state-management package, or backend file is required.

## 9. Acceptance Criteria

1. An authenticated User List view exposes an accessible Logout action.
2. Logout sends POST /api/logout with the current bearer token when a non-empty token exists.
3. The request uses the configured API base URL and does not hardcode a backend host.
4. A successful logout removes localStorage key token, clears App authenticated state, and renders LoginPage without a full page reload.
5. The Logout control is disabled and shows progress while the request is pending.
6. Duplicate logout requests cannot be started through repeated clicks or keyboard activation.
7. Missing-token logout skips the API call and still returns the application to LoginPage.
8. Expired or invalid-token responses remove local authentication and do not trigger retry loops.
9. Network, malformed-response, and other backend failures still remove local authentication and prevent protected content access.
10. User-facing error or notice text never exposes tokens, passwords, raw payloads, or stack traces.
11. Refreshing the browser after logout renders LoginPage because the token key is absent or empty.
12. The existing login flow, User List search/pagination, and User List Actions remain functionally unchanged.
13. No Laravel backend files are modified because the existing authenticated logout endpoint is sufficient.

## 10. Test Scenarios

### Service and API tests

- Verify logoutUser sends POST /api/logout to the configured API base URL.
- Verify the request includes Accept: application/json and Authorization: Bearer <token>.
- Verify a successful direct response containing message is accepted.
- Verify a missing token skips the request.
- Verify 401, network, malformed-response, and other HTTP failures normalize into safe UsersApiError values.
- Verify logoutUser does not log or expose the token.

### UI and integration tests

- Render the authenticated User List with a Logout button.
- Click Logout with a valid token and verify the API call, token removal, and LoginPage render.
- Verify the Logout button shows loading state and prevents duplicate clicks.
- Verify logout when the token is already missing returns to LoginPage without an API request.
- Mock an expired/invalid-token 401 and verify the token is removed and no retry occurs.
- Mock a network/API failure and verify local sign-out still completes and protected content is unavailable.
- Verify a browser refresh after logout renders LoginPage.
- Verify User List search, pagination, Edit User, Delete User, and Change User Role remain functional before logout.
- Verify protected User List content cannot be accessed after logout without a new successful login.
- Verify desktop, tablet, mobile, keyboard, and screen-reader-oriented logout interactions.

### Project checks

Run the available frontend checks after implementation:

~~~text
npm run lint
npm run build
~~~

## 11. Implementation Decisions and Open Questions

- Use App state rather than React Router because the existing application has one protected page and no router dependency.
- Keep authentication API code in authApi.js, separate from usersApi.js, and reuse the existing UsersApiError class through apiError.js.
- Treat local sign-out as mandatory even when server logout fails so this browser cannot continue using a stale token.
- Treat a missing or expired token as an already completed local logout rather than an actionable retry condition.
- The current project has no notification/toast system. The implementation should use the smallest consistent approach for communicating a remote logout failure after LoginPage renders, such as a safe transient notice passed from App, or document if the product elects to remain silent.
- No confirmation dialog is required by the current prompt; adding one would introduce extra interaction without an existing project pattern.
- No backend behavior beyond the inspected POST /api/logout contract should be invented or changed.
