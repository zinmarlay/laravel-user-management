# User Login — Implementation Prompt

## Feature

User Login

## Goal

Add a polished, production-style Login page to the existing React frontend so users can authenticate through the existing Laravel Sanctum API and then access the authenticated User List and User List Actions.

The Login page should have a clean, modern, professional UI using Material UI (MUI), with responsive behavior for desktop, tablet, and mobile.

Do not change the existing Laravel backend API or authentication rules.

---

## 1. Existing API

Use the existing backend endpoint:

`POST /api/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Use the existing frontend API configuration:

- `VITE_API_BASE_URL`
- `API_BASE_URL`

Do not hard-code a backend host.

Inspect the existing backend `AuthController` before implementation so the frontend matches the actual login response format.

---

## 2. Login UI

Create a dedicated Login page.

The design should be visually polished and professional.

Use a centered authentication layout with a modern card/panel.

Suggested visual structure:

- Application identity/logo
- Welcome back heading
- Short subtitle
- Email field
- Password field with show/hide control
- Primary Sign in button
- Clear error area

### Requirements

- Use MUI components.
- Use `TextField` for email and password.
- Use a password visibility toggle.
- Use a clear primary Login button.
- Show a loading indicator while login is processing.
- Disable inputs and Login button while submitting.
- Use accessible labels and keyboard navigation.
- Show a clear error message when authentication fails.
- Preserve entered email when login fails.
- Do not preserve the password after a failed login.

---

## 3. Visual Design

The Login page should look intentional rather than like a default MUI form.

Use:

- MUI Paper/Card
- Typography hierarchy
- Appropriate spacing
- Rounded corners
- Subtle elevation
- Responsive layout
- A visually appealing application background
- Consistent primary action styling
- Clear focus states
- Good contrast and readability

If an application logo or brand name already exists, reuse it.

If no logo exists, use a simple text-based application identity rather than adding an external asset dependency.

Do not use remote images or external image URLs.

Follow the existing project's styling conventions.

---

## 4. Form Fields

### Email

- Required.
- Trim leading/trailing whitespace before submission.
- Validate that the value is a reasonable email address.
- Show an inline validation message.
- Preserve the value after failed login.

### Password

- Required.
- Use `type="password"` by default.
- Provide a show/hide password control.
- Do not trim password characters.
- Do not preserve password after a failed login.

---

## 5. Login API Service

Add a dedicated authentication service to the existing frontend API/service structure.

Suggested function:

`loginUser(email, password)`

The function should live in `src/services/authApi.js`, separate from the protected User List API service.

The service must:

1. Send `POST /api/login`.
2. Send `Accept: application/json`.
3. Send `Content-Type: application/json`.
4. Send email and password as JSON.
5. Parse the backend response.
6. Normalize non-2xx responses using the existing `UsersApiError` pattern where appropriate.
7. Return the authentication result to the Login page.

Inspect the actual backend response before deciding the exact token field name.

Do not guess the response shape.

---

## 6. Token Storage

After successful login:

- Store the returned authentication token using the existing frontend token storage convention.
- The current User List service already reads `localStorage.getItem('token')`.
- Use this same key unless inspection of the existing project shows a deliberate replacement is required.
- Do not create multiple token keys.
- Do not expose the token in the UI.

---

## 7. Authentication Flow

Expected flow:

```text
Login Page
    ↓
POST /api/login
    ↓
Successful authentication
    ↓
Store token
    ↓
Show User List
    ↓
fetchUsers() automatically uses stored token
```

After successful login, the user should not need to manually provide a token.

---

## 8. Unauthenticated State

When no token exists:

- Show the Login page instead of the authenticated User List.
- Do not display protected user data.

If an authenticated API request returns `401`:

- Treat the session as unauthenticated.
- Remove the invalid/expired token.
- Return the user to the Login page.
- Do not repeatedly retry an unauthorized request.

If the existing project does not yet have routing, inspect the current application structure and implement the simplest maintainable approach without adding unnecessary dependencies.

Do not introduce React Router unless the existing architecture requires it and there is no simpler suitable approach.

---

## 9. Existing User List Integration

Do not rewrite the existing User List.

After login:

- User List should continue using `fetchUsers()`.
- `fetchUsers()` should obtain the token from existing local storage behavior.
- Existing search must continue working.
- Existing pagination must continue working.
- Existing Edit/Delete/Role Change actions must continue working.

Do not change the backend endpoints for these existing features.

---

## 10. Login Error Handling

Handle at least:

### 401

Show a user-friendly authentication error such as:

`Invalid email or password.`

Do not expose raw backend exception details.

### 422

Show relevant validation errors when the backend provides an `errors` object.

### Network Error

Show a clear message such as:

`We could not connect to the server. Please try again.`

### Other Errors

Show a safe generic error message.

Do not expose:

- access tokens
- stack traces
- raw exception details
- sensitive backend information

---

## 11. Loading State

While login is processing:

- Disable Email.
- Disable Password.
- Disable Login button.
- Show CircularProgress in or near the Login button.
- Prevent duplicate login requests.

Example:

`Signing in…`

After completion:

- Restore controls if login failed.
- Show the authenticated User List if login succeeded.

---

## 12. Accessibility

The Login page must:

- Use semantic form markup.
- Provide accessible labels.
- Support keyboard navigation.
- Support Enter to submit.
- Provide an accessible password visibility control.
- Provide meaningful error messages.
- Preserve visible focus states.
- Avoid relying only on color to communicate errors.

---

## 13. Responsive Design

Desktop:

- Centered authentication card/panel.
- Comfortable width.
- Balanced whitespace.

Tablet:

- Maintain readable spacing and card proportions.

Mobile:

- Full-width layout with safe horizontal padding.
- No horizontal scrolling.
- Inputs remain easy to use.
- Login button remains easily tappable.
- Error messages wrap correctly.

---

## 14. Component / File Structure

Follow the existing structure.

A reasonable structure may be:

```text
frontend/src/
  pages/
    LoginPage.jsx
    UserListPage.jsx
  components/
    auth/
      LoginForm.jsx
  services/
    authApi.js
    usersApi.js
  App.jsx
  App.css
```

The exact structure may be adjusted after inspecting the existing project.

Keep components focused and maintainable.

Do not create unnecessary abstractions.

---

## 15. State Management

Keep login state simple and local unless the existing project already has an authentication provider.

At minimum handle:

- email
- password
- showPassword
- fieldErrors
- loginError
- loading
- authenticated state

Do not introduce Redux, Zustand, React Query, or another state library for this feature unless the existing project already uses one.

---

## 16. Logout Compatibility

Inspect the existing logout implementation.

The login implementation must remain compatible with the existing logout behavior.

After logout:

- Remove the same token key used by login.
- Protected User List access should require login again.

Do not create a second authentication mechanism.

---

## 17. Security Requirements

- Never log passwords.
- Never display passwords.
- Never include tokens in console output.
- Never put tokens in URLs.
- Store the token only using the existing frontend convention.
- Use HTTPS in production configuration through the existing API base URL.
- Do not bypass backend authentication.

---

## 18. Testing / Verification

After implementation:

1. Run the available frontend lint checks.
2. Run `npm run build`.
3. Verify Login page renders.
4. Verify empty form validation.
5. Verify invalid email validation.
6. Verify password visibility toggle.
7. Verify failed login.
8. Verify successful login.
9. Verify token is stored under the existing `token` key.
10. Verify User List loads automatically after login.
11. Verify search still works.
12. Verify pagination still works.
13. Verify Edit/Delete/Role Change still work after login.
14. Verify logout removes authentication and protected access returns to Login.
15. Verify mobile/responsive layout.

---

## 19. Constraints

- Do not modify Laravel backend code.
- Do not change existing API contracts.
- Do not break User List Actions.
- Do not introduce unnecessary dependencies.
- Do not introduce another UI library.
- Do not hard-code API URLs.
- Do not create duplicate token storage mechanisms.
- Do not expose sensitive authentication information.
- Do not rewrite unrelated frontend code.
- Follow the existing project coding style.

---

## 20. Implementation Rules

Before modifying files:

1. Inspect the existing `AuthController` and `/api/login` response.
2. Inspect the existing `App.jsx`.
3. Inspect the existing User List authentication/token behavior.
4. Inspect the existing logout implementation.
5. Inspect existing CSS conventions.
6. Follow existing project patterns.

Do not guess the backend login response shape.

After implementation, report:

- Files changed
- Login API response shape discovered
- Token storage behavior
- Navigation/authentication flow
- UI components added
- Tests/checks performed
- Any remaining issues
