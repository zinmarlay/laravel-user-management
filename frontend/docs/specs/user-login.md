# User Login Specification

## 1. Overview

The User Login feature authenticates users against the existing Laravel Sanctum API and gates access to the protected User List experience.

The feature must:

- Render a responsive login page when no authentication token is available.
- Authenticate with POST /api/login using the existing API base URL configuration.
- Store the returned Sanctum token under the existing localStorage key, token.
- Show the existing protected User List after successful authentication.
- Return the user to the login page when an authenticated API request receives a 401 response.
- Preserve the existing User List search, pagination, Edit User, Delete User, and Change User Role behavior.

This specification covers frontend behavior only. No backend changes are required.

## 2. Existing Project and API Findings

### 2.1 Frontend structure

The frontend is a Vite React application using React 19, Material UI, and Emotion. It currently has no React Router, authentication context, or global state library.

Relevant existing files are:

- src/App.jsx: application entrypoint that currently renders CssBaseline and UserListPage.
- src/pages/UserListPage.jsx: protected User List page with loading, error, search, pagination, and user actions.
- src/services/authApi.js: login API service using VITE_API_BASE_URL and the shared UsersApiError behavior.
- src/services/usersApi.js: protected User List and mutation API service using the localStorage token key.
- src/main.jsx: React StrictMode entrypoint.
- src/App.css: existing User List layout and responsive styling.

The existing API service reads the bearer token with localStorage.getItem('token') and sends it as an Authorization header for protected requests. No alternate token key may be introduced.

### 2.2 Backend login endpoint

The Laravel route is:

~~~text
POST /api/login
~~~

AuthController::login validates email and password, looks up the user by email, checks the hashed password, and creates a Sanctum personal access token with createToken('api-token').plainTextToken.

The successful response is returned directly, without a data wrapper:

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

The exact user values and timestamps are data-dependent. The User model hides password and remember_token, so those fields must not be expected or displayed by the frontend.

Invalid credentials return HTTP 401 with:

~~~json
{
  "message": "Invalid email and password"
}
~~~

Laravel validation failures return HTTP 422 with a standard validation payload containing an errors object, for example:

~~~json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
~~~

The frontend must use the actual token property from this response and must not look for response.data.token or another token field.

### 2.3 Existing authenticated endpoints

The backend protects /api/me, /api/logout, /api/users, and the user mutation endpoints with auth:sanctum. The existing usersApi.js service sends a bearer token from the token localStorage key for User List and mutation requests.

The logout endpoint is:

~~~text
POST /api/logout
~~~

It deletes the current token and returns a success message. Login implementation must remain compatible with this existing token convention.

## 3. Functional Requirements

1. When no non-empty token exists in localStorage under token, App must render LoginPage instead of UserListPage.
2. When a token exists, App must render the existing UserListPage.
3. LoginPage must submit email and password to loginUser in authApi.js.
4. The email value must be trimmed before it is sent to the API.
5. The password value must be sent exactly as entered; it must not be trimmed.
6. A successful login must store response.token under localStorage key token and switch the application to the protected User List state.
7. A successful login must not expose the token in the UI, URL, console, or application error text.
8. Failed login must keep the email value available for correction and must clear the password field after the failed submission.
9. A protected API 401 response must remove token, clear authenticated application state, and show LoginPage without repeatedly retrying the failed request.
10. Login must not modify the existing User List API, search, pagination, or action semantics except to notify App when authentication has expired.

## 4. UI and UX Requirements

### 4.1 Login page layout

The page must use the existing Material UI design system and present a polished, centered login panel or card.

The panel must include:

- A clear product or page identity using existing project branding where available.
- If no logo asset exists, a text-based User Management brand heading must be used instead of adding a remote image.
- A concise heading such as Sign in.
- A short supporting description explaining that the user must sign in to manage users.
- Email and password fields.
- A primary Sign in button.
- A clear location for validation and request errors.

The page must not introduce a new visual language that conflicts with the existing User List styling.

### 4.2 Email field

- Use a semantic label, such as Email address.
- Use email input behavior and an appropriate autocomplete value.
- The field is required.
- Validate a reasonable email format before submitting.
- Trim leading and trailing whitespace for validation and submission.
- Show field-level validation text near the field.
- Preserve the entered email after an unsuccessful login.

### 4.3 Password field

- Use a semantic Password label.
- Use password input type by default.
- The field is required.
- Do not trim the password.
- Include an accessible show/hide control implemented as a non-submit button.
- The control must expose an appropriate aria-label, such as Show password or Hide password.
- The password must not be preserved after an unsuccessful submission.

### 4.4 Submit behavior

- The form must submit when the user presses Enter in a field.
- The submit button must be disabled while the request is pending.
- Inputs and the password visibility control must not allow conflicting edits during submission.
- The button must show a CircularProgress indicator and the text Signing in… while pending.
- Duplicate submissions must be prevented.
- On success, the login panel must transition to the protected User List without requiring a full page reload.

## 5. API Integration

### 5.1 API base URL

The service must use the existing API base URL pattern:

~~~text
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
~~~

The login request URL must be ${API_BASE_URL}/api/login. The backend host must not be hardcoded. An empty API base URL must continue to support the existing same-origin behavior.

### 5.2 loginUser service function

Add loginUser(email, password) to src/services/authApi.js following the existing service conventions.

The request must:

- Use POST /api/login.
- Send JSON body { email, password }.
- Set Accept: application/json.
- Set Content-Type: application/json.
- Not send a bearer token for the login request.
- Parse the JSON response.
- Return the successful response object containing message, user, and token.

Non-2xx responses must use the existing UsersApiError type or the same normalized error convention, including HTTP status, error code where appropriate, and parsed payload. Network failures must remain distinguishable from HTTP failures.

The service must treat a successful response without a non-empty token as an invalid API response rather than storing undefined or an empty value.

### 5.3 Error normalization

The login UI must translate service errors into safe, user-facing messages:

| Condition | User-facing behavior |
| --- | --- |
| HTTP 401 | Show Invalid email or password. Do not expose the backend wording or identify whether the email exists. |
| HTTP 422 with errors | Show the first relevant validation message next to each matching field, with a safe fallback if a field message is unavailable. |
| Network failure | Show a clear message such as We could not connect to the server. Check your connection and try again. |
| Other HTTP or parsing failure | Show a generic message such as Sign-in failed. Please try again. |
| Unexpected response without token | Show a generic sign-in failure and do not authenticate. |

Raw response bodies, stack traces, tokens, passwords, and sensitive implementation details must not be rendered.

## 6. Form Validation and State Behavior

The login form should validate before calling the API:

- Empty or whitespace-only email: show a required message.
- Invalid email format: show a valid email message.
- Empty password: show a required message.
- A valid form sends the trimmed email and original password.

Field errors should be cleared or revalidated as the corresponding field is edited. A submission-level error should be cleared when the user makes a new login attempt or edits a relevant field, while preserving enough feedback to make correction understandable.

After a failed API submission:

- Keep the email in the form.
- Clear the password.
- Keep the user on LoginPage.
- Return the submit button to its idle state.
- Keep the error visible until the next relevant correction or submission.

After a successful API submission:

- Store the token before changing authenticated state.
- Do not retain the password in application state beyond the form lifecycle.
- Clear transient login errors.
- Render the protected User List.

## 7. Authentication Flow and Token Storage

The application must use a minimal auth gate in App.jsx because the project currently has no router or authentication provider.

Recommended flow:

1. App checks localStorage key token during initial render or initialization.
2. If the key is absent or empty, App renders LoginPage.
3. LoginPage calls loginUser on a valid submit.
4. loginUser returns the direct Laravel response containing token and user.
5. LoginPage or App stores response.token with localStorage.setItem('token', response.token).
6. App updates authenticated state and renders UserListPage.
7. User List requests continue to read the same token key through usersApi.js.
8. If an authenticated request receives 401, UserListPage notifies App through a callback or equivalent existing pattern.
9. App removes localStorage key token and renders LoginPage. The failed request must not be retried automatically in a loop.

The implementation must not add a second token key, put tokens in query strings or URLs, or log tokens. Persistent localStorage behavior is required because it matches the existing project convention; use HTTPS in deployed environments through VITE_API_BASE_URL.

## 8. Loading, Error, and Success States

### Initial authentication state

The app must avoid rendering protected content when no token is present. A brief initialization state may be used if token inspection is asynchronous or guarded, but no unnecessary loading screen is required for synchronous localStorage inspection.

### Login loading state

While loginUser is pending:

- Disable the form controls and submit button.
- Show CircularProgress and Signing in… in the submit button.
- Prevent Enter or click from creating another request.
- Keep the layout stable so the form does not jump.

### Login error state

Errors must be visible, readable, and associated with the relevant fields when applicable. Use Material UI Alert for a submission-level error and helper text for field-level errors, or the equivalent existing project pattern.

### Successful state

On success, transition directly to UserListPage. The User List may show its existing loading state while it fetches users with the newly stored token.

### Auth-expiration state

When a protected request returns 401:

- Remove the token.
- Stop treating the user as authenticated.
- Show LoginPage.
- Avoid showing stale protected data as if it were still current.
- Do not repeatedly retry the failed request.

## 9. Responsive and Accessibility Requirements

The login page must be usable on desktop, tablet, and mobile widths.

- Keep the panel centered with comfortable spacing on large screens.
- Allow the panel to use nearly the available width on small screens with safe horizontal padding.
- Keep controls at a comfortable touch size.
- Avoid horizontal overflow.
- Preserve readable text and visible focus indicators at all supported widths.
- Use a semantic form and associated labels.
- Support keyboard navigation and Enter-to-submit.
- Ensure the password visibility control is keyboard accessible and has an accessible name.
- Associate validation messages with fields using Material UI or equivalent aria attributes.
- Do not rely on color alone to communicate errors.

## 10. React Component and File Structure

Use the existing project structure and keep the feature focused:

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
    authApi.js
    usersApi.js
~~~

Responsibilities:

- App.jsx: owns the minimal authenticated/unauthenticated gate and token-expiration transition.
- LoginPage.jsx: page-level layout and login form placement.
- LoginForm.jsx: controlled form fields, validation, password visibility, loading, and login error presentation.
- UserListPage.jsx: existing protected User List behavior, plus a callback to notify App when authentication expires if needed.
- authApi.js: loginUser request and login-specific error normalization.
- usersApi.js: protected User List and mutation requests, shared API error behavior, and existing token conventions.
- App.css or a focused auth stylesheet: responsive login layout without disrupting existing User List styles.

Do not add React Router, a state-management dependency, or an authentication library unless the existing project structure proves that it is necessary.

## 11. State Management and Data Flow

Use local React state and existing props/callback patterns.

LoginForm state should include:

- email
- password
- showPassword
- fieldErrors
- loginError
- loading

App should own authenticated state because it decides whether LoginPage or UserListPage is rendered. App may initialize this state from the presence of localStorage token. LoginForm should report successful authentication to App rather than duplicating protected-page routing.

UserListPage should report an authentication failure to App when its existing fetch or mutation handling receives a 401. App is responsible for clearing the token and changing the rendered page.

The authenticated user object may be retained only if a later UI needs it; the User List feature does not require a global current-user store. Do not store passwords in persistent storage.

## 12. Testing and Verification Requirements

### Service and integration verification

- Verify authApi.loginUser sends POST /api/login with the exact JSON fields email and password.
- Verify Accept and Content-Type headers.
- Verify the API base URL comes from VITE_API_BASE_URL and trailing slashes are handled consistently.
- Verify a successful direct response stores response.token under localStorage key token.
- Verify the service handles the direct Laravel response shape and does not expect a data wrapper.
- Verify 401, 422, network, malformed-response, and other HTTP failures normalize safely.
- Verify protected requests continue using the same token key and bearer format.

### UI verification

- Render LoginPage when token is absent.
- Render UserListPage when token is present.
- Verify required and invalid email validation without making a request.
- Verify required password validation.
- Verify email trimming and password non-trimming.
- Verify password show/hide behavior and accessible labels.
- Verify loading disables controls and prevents duplicate submissions.
- Verify failed login preserves email, clears password, and shows a safe message.
- Verify 422 field errors appear next to the correct fields.
- Verify successful login transitions to the existing User List.
- Verify User List search, pagination, Edit User, Delete User, and Change User Role remain functional after login.
- Verify a protected 401 clears the token and returns to LoginPage without a retry loop.
- Verify the page at desktop, tablet, and mobile widths.

### Project checks

Run the available frontend checks after implementation:

~~~text
npm run lint
npm run build
~~~

If no frontend test runner exists, document manual verification and service-level coverage rather than adding an unrelated testing framework as part of this feature.

## 13. Acceptance Criteria

1. With no token key in localStorage, the app displays a responsive, accessible login page instead of protected user content.
2. The login form uses the existing Material UI conventions and contains labeled email and password controls, an accessible password toggle, and a submit button.
3. Client-side validation prevents invalid submissions and displays useful field-level messages.
4. Email is trimmed before submission and password is not trimmed.
5. POST /api/login is sent to the configured API base URL with the required JSON body and headers.
6. The frontend correctly consumes the Laravel response shape { message, user, token } and stores the actual token property under localStorage key token.
7. A successful login displays the existing User List without a full-page reload and preserves its existing functionality.
8. Invalid credentials show a safe generic message, preserve the email, clear the password, and do not expose backend-sensitive details.
9. Laravel validation errors, network failures, malformed responses, and unexpected HTTP failures have clear safe handling.
10. Loading state disables controls, shows progress, and prevents duplicate submissions.
11. Any protected-request 401 removes the token, returns the user to LoginPage, and does not repeatedly retry.
12. The implementation does not introduce a second token key, expose secrets in URLs or logs, or modify backend files.
13. The feature works at desktop, tablet, and mobile widths and supports keyboard and screen-reader-oriented interaction.
14. Frontend lint and production build checks pass, or any remaining issue is explicitly reported.

## 14. Scope Exclusions and Assumptions

- Backend routes, AuthController behavior, Sanctum configuration, and backend validation are not changed.
- Registration, password reset, multi-factor authentication, social login, and role-specific login screens are out of scope.
- A new router is not required because the current application has a single protected page and no routing dependency.
- The existing localStorage token convention is authoritative for this feature, even though a production deployment may later choose a different storage strategy.
- The backend currently returns the raw authenticated user fields exposed by the User model; the frontend must not depend on password or remember_token fields.
- No remote logo or image asset is required. Text branding is the fallback when no local project logo exists.
