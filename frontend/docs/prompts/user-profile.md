We are continuing the existing User Management System project.

We are starting a new User Profile feature.

Before creating the specification, inspect the actual existing frontend and Laravel backend implementation.

Do not assume that any API, route, controller, policy, component, or profile functionality exists.

The current Git branch is:

feature/user-profile

The working tree is clean.

## Important Existing Product Direction

The User List currently has user actions such as Edit, Delete, and Change Role.

We have decided to change the User List experience:

Current direction:

User List
└── Edit User

New direction:

User List
└── View Profile
↓
Profile Page
├── Personal Information
│ ├── Photo
│ ├── Name
│ ├── Email
│ └── Address
│
├── Edit Profile
│ ├── Photo
│ ├── Name
│ ├── Email
│ └── Address
│
└── Change Password

The User List should eventually use "View Profile" instead of the existing direct "Edit" action.

The Profile Page should display the selected user's information.

From Profile Page, an authorized user can enter Edit Profile.

Edit Profile must support editing:

- Photo
- Name
- Email
- Address

Password editing must NOT be part of Edit Profile.

Password Change must be a separate feature/action with its own API, validation, authorization, and UI decisions.

Admin Password Reset is also separate and must not be silently implemented as part of Edit Profile.

## Important Security / Authorization Direction

Do not assume that every logged-in user can edit every profile.

Inspect the existing Laravel authorization policy and current frontend authorization behavior.

Determine:

- What an admin can view.
- What a normal user can view.
- Whether a normal user can view another user's profile.
- What an admin can edit.
- What a normal user can edit.
- Whether Profile viewing should be public or authenticated.
- Whether Edit Profile authorization should reuse the existing UserPolicy.
- Whether the backend or frontend currently enforces these rules.

Laravel must remain the authoritative security boundary.

The frontend must not be treated as the security boundary.

## Photo Direction

The registration feature already introduced real image upload support.

Inspect the actual current implementation and determine:

- User.photo database type
- User model fillable configuration
- UserResource photo serialization
- Public storage disk configuration
- storage:link configuration
- Existing photo upload validation
- Existing photo URL generation
- Existing UserAvatar/photo display implementation
- Existing photo cleanup behavior

Profile Edit should reuse the existing photo architecture where appropriate.

Do not invent a second photo storage system.

Determine how an existing photo should be replaced.

Determine what should happen when a user removes an existing photo.

Determine whether the old stored photo should be deleted after successful replacement/removal.

Document safe cleanup behavior.

## Password Direction

The existing Edit User feature no longer edits passwords.

Do not add password fields to Edit Profile.

Instead, document Change Password as a separate future/current feature depending on what already exists in the backend.

Inspect:

- Existing authentication controller
- Existing login implementation
- Existing User model
- Password hashing behavior
- Existing validation conventions
- Existing Sanctum authentication
- Existing authorization middleware/policies

Determine whether a Change Password API already exists.

If it does not exist, document the required backend endpoint and validation contract in the specification.

Do not implement Change Password while creating this specification.

## Frontend Architecture

Inspect the actual frontend architecture before writing the specification.

At minimum inspect:

- frontend/src/App.jsx
- frontend/src/pages/UserListPage.jsx
- frontend/src/components/users/UserTable.jsx
- frontend/src/components/users/UserEditDialog.jsx
- frontend/src/components/users/UserDeleteDialog.jsx
- frontend/src/components/users/UserRoleDialog.jsx
- frontend/src/services/usersApi.js
- frontend/src/services/authApi.js
- frontend/src/services/apiError.js
- frontend/src/App.css
- existing photo/avatar components
- existing authentication and authorization behavior

The frontend currently uses:

- React
- Vite
- Material UI
- browser fetch
- plain CSS
- no React Router
- no global state library
- no form library
- no i18n dependency

Do not introduce React Router, a state-management library, a form library, or another dependency unless the actual project already uses one.

Because there is currently no router, determine how Profile Page navigation should be implemented consistently with the existing architecture.

Possible approaches include App-level page state or another existing project pattern.

Do not assume URL routing exists.

## Backend Architecture

Inspect the actual Laravel implementation.

At minimum inspect:

- User routes
- UserController
- AuthController
- UserResource
- User model
- UserPolicy
- Form Requests
- users migration
- Sanctum authentication middleware
- existing user API endpoints
- existing registration implementation
- existing photo implementation
- existing tests

Determine:

- Existing user detail/show endpoint
- Existing user update endpoint
- Existing authorization rules
- Existing validation rules
- Existing photo handling
- Existing UserResource response
- Whether a dedicated profile endpoint is needed
- Whether existing user endpoints can safely support Profile Page
- Whether backend changes are required

Do not invent an endpoint if an appropriate existing endpoint already exists.

## Product Requirements

The Profile feature should eventually support:

### User List

Replace the direct Edit action with:

- View Profile

Keep existing:

- Delete
- Change Role

unless the actual architecture or authorization requirements indicate otherwise.

### Profile Page

Display:

- Photo
- Name
- Email
- Address
- Role if appropriate based on the existing UI/security design

The page should clearly identify the selected user.

Provide:

- Back to Users / User List
- Edit Profile action when authorized
- Change Password action when authorized and when the feature exists

Do not display:

- Password
- Password hash
- Access token
- Raw API payload
- Sensitive backend information

### Edit Profile

Edit Profile should support:

- Photo
- Name
- Email
- Address

It should NOT contain:

- Password
- Confirm Password
- Role
- Token
- Internal IDs as editable fields
- Timestamps

Photo should use the existing real image upload architecture.

Determine whether the UI should be a dialog or a dedicated page based on the current project architecture and usability.

Document the decision and its reasoning.

## Photo Editing Requirements

Inspect the existing registration photo implementation first.

Profile Edit should support:

1. Existing photo display.
2. Selecting a replacement image.
3. Previewing the replacement.
4. Removing the existing photo if the product design allows it.
5. JPEG, PNG, WebP validation consistent with registration.
6. Maximum 2 MB consistent with registration.
7. Safe object URL lifecycle.
8. Safe replacement behavior.
9. Safe old-file cleanup.
10. No base64 persistence.
11. No localStorage persistence of image data.
12. No filesystem path exposure to the frontend.

If removing an existing photo is not yet supported by the backend, document the required backend contract.

## API Design

Inspect existing endpoints before deciding the API contract.

Document:

- Profile/detail endpoint
- Edit Profile endpoint
- HTTP methods
- Request body format
- Multipart requirements if photo is included
- Response format
- Authentication requirements
- Authorization behavior
- Validation behavior
- Error behavior

If the existing PUT/PATCH user endpoint can safely support the Profile Edit use case, document how it should be reused.

If a dedicated endpoint is more appropriate, explain why and document it.

Do not implement any API during specification creation.

## Error Handling

Follow the existing UsersApiError and frontend API error conventions.

Document safe handling for:

- 401
- 403
- 404
- 409 if applicable
- 422
- 500
- network failure
- malformed success response

Never expose:

- stack traces
- SQL errors
- raw backend exceptions
- passwords
- tokens
- filesystem paths
- raw API payloads

Determine whether:

- 401 should return to LoginPage
- 403 should show a safe permission message
- 404 should show a user-not-found state
- 422 should map field-level validation errors

Base these decisions on the existing project behavior.

## English / Japanese

The project is planned to support:

- English
- Japanese

There is currently no i18n system unless the inspected project has introduced one.

Do not add i18n dependencies while creating the specification.

All new Profile-related UI copy should be documented so it can later be translated without changing component behavior.

## UI/UX

Use the existing Material UI design language.

Document:

- Profile page layout
- Photo/avatar area
- Personal information section
- Role display
- Edit Profile action
- Change Password action
- Back navigation
- Loading state
- Empty/null address behavior
- No-photo behavior
- Error states
- Success feedback
- Responsive behavior
- Keyboard accessibility
- Focus behavior
- Mobile layout

The UI should remain consistent with the existing User List and Login/Register design.

## Scope

In scope:

- User List Edit → View Profile direction
- Profile Page
- User information display
- Profile navigation
- Edit Profile
- Photo editing architecture
- Name editing
- Email editing
- Address editing
- Existing authorization analysis
- Existing API reuse analysis
- Safe error handling
- Accessibility
- Responsive design
- English/Japanese compatibility

Potentially in scope if required by the actual existing architecture:

- Backend profile/detail endpoint
- Backend profile update endpoint
- Photo replacement/removal support

Out of scope for this specification implementation:

- Admin Password Reset implementation
- Password Change implementation unless an existing implementation already exists
- Forgot Password
- Password Reset
- Email verification
- New role-management functionality
- Unrelated User List changes
- New dependencies
- React Router
- i18n implementation

## Specification Task

Based on the actual source code discovered during inspection, create:

frontend/docs/specs/user-profile.md

Do NOT implement the Profile feature.

Do NOT modify existing source files.

Do NOT modify Laravel source files.

Do NOT add dependencies.

Do NOT commit anything.

The specification must describe the actual current architecture and clearly distinguish:

- Existing functionality
- Required changes
- Future features
- Open questions
- Assumptions

Do not claim that an endpoint or component exists unless it was actually found in the repository.

## Specification Structure

Create a detailed specification with exactly these sections:

1. Overview
2. Current Architecture Findings
3. Existing User Management Findings
4. Existing Authorization Findings
5. Existing Photo Handling Findings
6. Existing Authentication Findings
7. Profile User Flow
8. Profile Page UI/UX Specification
9. Edit Profile Specification
10. Photo Management Specification
11. Change Password Boundary
12. API Contract
13. Validation Rules
14. Authorization Rules
15. Error Handling
16. Security Considerations
17. Frontend File Structure
18. Backend Impact
19. Acceptance Criteria
20. Test Scenarios
21. Implementation Plan
22. Open Questions / Assumptions

## Acceptance Criteria for the Specification

The resulting specification must:

- Be based on actual source inspection.
- Clearly explain the current User List action architecture.
- Define the transition from Edit → View Profile.
- Define Profile Page responsibilities.
- Define Edit Profile responsibilities.
- Keep Password out of Edit Profile.
- Reuse the existing photo architecture where possible.
- Define photo replacement/removal behavior.
- Define authorization based on the existing Laravel policy.
- Define API reuse versus new endpoint decisions.
- Define safe error handling.
- Preserve existing authentication behavior.
- Preserve Delete and Change Role behavior.
- Remain compatible with future English/Japanese localization.
- Avoid introducing unnecessary dependencies.
- Avoid implementation changes.

After creating the specification, report:

1. Which existing files were inspected.
2. Which existing endpoints were found.
3. Which backend changes are required.
4. Which frontend files are expected to be created/modified later.
5. Any important open questions.

Do not implement anything yet.
Do not commit anything.
