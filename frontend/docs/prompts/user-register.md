We are continuing the existing User Management System project.

Please read and follow this prompt:

frontend/docs/prompts/user-register.md

We are adding a new User Registration feature.

Before creating the specification, inspect the actual existing frontend and Laravel backend implementation, especially:

- Existing authentication architecture
- Login implementation
- authApi.js
- LoginForm.jsx
- LoginPage.jsx
- App.jsx
- Laravel authentication routes
- AuthController
- Form Requests / validation
- User model
- User migration
- UserResource
- Existing authentication and authorization behavior
- Existing error handling conventions
- Existing Material UI form patterns

Do not assume that an API or backend implementation exists. Inspect the current project first.

Based on the actual project architecture, create:

frontend/docs/specs/user-register.md

Do not implement the feature yet.
Do not modify existing source files.
Do not modify Laravel backend files.
Do not add dependencies.
Do not commit anything.

## Registration Requirements

The application needs a public User Registration feature.

The registration form should support:

- Name
- Photo
- Email
- Password
- Confirm Password
- Address

The user must NOT be allowed to choose their role during registration.

New registrations must receive the normal `user` role according to the backend's existing architecture. If the backend currently does not enforce a default role for public registration, document the required backend change in the specification rather than implementing it.

The password must never be displayed after submission and must never be stored in frontend state beyond what is required to submit the form.

The registration flow should follow the existing frontend architecture and Material UI design patterns.

## Registration Flow

Document the expected flow based on the existing project:

1. User opens Register.
2. User enters Name, Photo, Email, Password, Confirm Password, and optional Address.
3. Frontend performs appropriate validation.
4. Frontend sends the registration request to the Laravel API.
5. Backend validates the request and creates the user.
6. The frontend handles the response according to the existing authentication architecture.
7. Decide and document whether successful registration:
    - automatically signs the user in, or
    - returns the user to LoginPage with a safe success message.

This decision must be based on the existing Laravel backend response and current authentication design. Do not invent a response contract.

## Validation

Inspect the existing Laravel validation and document the actual rules.

The specification should cover at least:

- Name required
- Photo optional/nullable if supported
- Email required and valid
- Email uniqueness
- Password required
- Password confirmation
- Password minimum requirements
- Address optional/nullable if supported
- Role must not be user-controlled

Frontend validation should provide early feedback, while Laravel remains authoritative.

## Security

The specification must explicitly address:

- Password hashing must happen on the Laravel backend.
- Password must never be stored in localStorage.
- Password must never appear in URLs.
- Password must never be logged.
- Registration errors must not expose sensitive backend details.
- Role must not be accepted from untrusted frontend input.
- Authentication token behavior must follow the existing architecture.
- Registration must not weaken existing authentication or authorization.

## UI/UX

Use the existing Material UI style and form conventions.

The specification should define:

- Register page/form location
- Link between Login and Register
- Form fields
- Required/optional indicators
- Loading state
- Submit button
- Validation messages
- API error handling
- Success behavior
- Keyboard accessibility
- Responsive behavior
- English/Japanese language support compatibility

Do not implement i18n yet unless the current project already has it. Document the requirement so the Register feature can support the planned English/Japanese language system.

## Architecture

The specification must clearly identify:

- Frontend files to create
- Frontend files to modify
- Existing services that should be reused
- Whether authApi.js should receive a registerUser() function
- Whether App.jsx requires changes
- Whether LoginPage.jsx requires changes
- Whether a new RegisterPage.jsx is appropriate
- Whether a RegisterForm.jsx component is appropriate
- Whether a backend endpoint already exists
- Whether backend files must change

Keep the implementation consistent with the current React + Vite + Material UI architecture.

## Error Handling

Document behavior for:

- 422 validation errors
- Duplicate email
- 401/403 if applicable
- Network failure
- 404 if applicable
- 500/other server errors
- Malformed API responses

Do not expose raw payloads, stack traces, passwords, tokens, or backend exception messages.

## Scope

In scope:

- Public registration UI
- Registration API integration
- Registration validation
- Registration success behavior
- Login/Register navigation
- Safe error handling
- Accessibility
- Responsive UI
- Compatibility with planned English/Japanese UI

Out of scope:

- Profile
- Change Password
- Admin Reset Password
- Email verification unless the existing backend already requires it
- Forgot Password
- Password reset
- Role management
- New authorization rules unrelated to registration

## Specification Structure

Create a detailed specification with:

1. Overview
2. Current Architecture Findings
3. Existing Backend Registration Findings
4. Existing Frontend Authentication Findings
5. Registration User Flow
6. UI/UX Specification
7. Validation Rules
8. API Contract
9. Authentication Behavior
10. Error Handling
11. Security Considerations
12. Frontend File Structure
13. Backend Impact
14. Acceptance Criteria
15. Test Scenarios
16. Implementation Plan
17. Open Questions / Assumptions

The specification must be based on the actual source code discovered during inspection.

Do not implement anything yet.
Do not commit anything.
