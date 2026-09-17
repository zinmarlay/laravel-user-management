We are continuing the existing Laravel User Management System project.

We want to improve the User List UI and user-action behavior before starting the Profile feature.

Please read the existing project architecture and implement the following requirements in the specification.

Create the specification:

frontend/docs/specs/user-list-actions-ui.md

IMPORTANT:

- Do NOT implement any code yet.
- Do NOT modify existing source files.
- Do NOT commit anything.
- Read the existing User List Actions, authentication/login, logout, API services, and user authorization implementation before writing the specification.
- Base the specification on the actual existing project.
- Do not invent API behavior.

==================================================

1. # USER LIST ACTION BUTTONS

Currently the User List Actions are displayed as text-style actions:

- EDIT
- DELETE
- CHANGE ROLE

Change the UI design so that these actions are displayed as proper Material UI buttons.

Requirements:

- Edit → Button
- Delete → Button
- Change Role → Button
- Use existing Material UI components.
- Use a compact button size suitable for table rows.
- Keep the Actions column readable and compact.
- Edit and Change Role should use a normal/outlined button style.
- Delete should use a clearly distinguishable destructive/error style.
- Keep clear text labels.
- Do not introduce unnecessary icons or dependencies.
- Preserve keyboard accessibility and visible focus states.

Existing behavior must remain unchanged:

- Edit opens UserEditDialog.
- Delete opens UserDeleteDialog.
- Change Role opens UserRoleDialog.
- Existing loading/disabled behavior must continue to work.

# ================================================== 2. UNAUTHORIZED ACTION ALERT

Inspect the existing authentication and authorization implementation.

When a logged-in non-admin User attempts to perform an action that they are not authorized to perform on another user, show a clear Material UI Alert/Dialog instead of immediately performing the action.

The specification must define:

- Which roles are allowed to perform Edit.
- Which roles are allowed to perform Delete.
- Which roles are allowed to perform Change Role.
- What happens when a normal User clicks another user's action.
- What happens when an Admin clicks the same action.
- The exact intended user flow.
- Alert/Dialog title and safe message.
- How the user closes the Alert/Dialog.
- Keyboard accessibility.
- Whether the action should be blocked before opening the existing Edit/Delete/Role dialog.

IMPORTANT:

Do not rely only on frontend authorization.

The backend API authorization remains the final security boundary.

If the backend already provides authorization behavior, inspect it and document how the frontend should work with it.

Do not invent a new backend permission system unless the existing project requires it.

# ================================================== 3. CURRENT LOGGED-IN USER DISPLAY

The authenticated User List header currently contains:

Users Logout

Improve the header so the currently logged-in user's information is displayed beside the Logout button.

Example:

Users Admin • admin@example.com Logout

or an equivalent clean Material UI layout.

The specification must define:

- Which user information should be displayed.
- Name.
- Email.
- Role.
- Whether role should be shown as Admin/User.
- Responsive behavior.
- Mobile behavior.
- Accessibility.
- What happens if user information is unavailable.

Inspect the existing login response and authentication state.

The existing login API response contains user information.

Determine whether the current App authentication state already keeps the logged-in user information.

If the current implementation only stores the token, specify the smallest clean architectural change required to preserve the logged-in user's information without duplicating sensitive information unnecessarily.

Do not store passwords.

Do not display authentication tokens.

# ================================================== 4. AUTHENTICATION AND LOGOUT COMPATIBILITY

The existing application already supports:

- Login
- Token storage
- Authentication state
- Logout
- User List
- User List Actions

The new changes must not break:

- Login
- Logout
- User List loading
- Search
- Pagination
- Edit
- Delete
- Change Role

The Logout button must remain visible and usable.

The currently logged-in user's information must disappear when the user logs out.

After logout, LoginPage must be displayed as before.

# ================================================== 5. RESPONSIVE UI

Define responsive behavior for:

- Desktop
- Tablet
- Mobile

The User List table must remain usable.

The Actions column must not become excessively wide.

The logged-in user information beside Logout must not cause the header to overflow.

If necessary, specify appropriate wrapping, stacking, or responsive layout behavior.

# ================================================== 6. ACCESSIBILITY

All new buttons and Alert/Dialog components must:

- Have clear accessible names.
- Be keyboard accessible.
- Have visible focus states.
- Support Enter/Space activation where appropriate.
- Use appropriate Material UI accessibility behavior.
- Not expose sensitive authentication information.

# ================================================== 7. SECURITY

The specification must explicitly address:

- Frontend authorization is only a UX layer.
- Backend authorization is the final security boundary.
- Never expose passwords.
- Never expose authentication tokens.
- Never place tokens in URLs.
- Never log tokens.
- Unauthorized users must not be allowed to bypass frontend restrictions to perform protected actions.
- API 401/403 responses must continue to be handled safely.

# ================================================== 8. FILE SCOPE

Identify the files that will likely need to change.

Likely candidates include:

- frontend/src/App.jsx
- frontend/src/pages/UserListPage.jsx
- frontend/src/components/users/UserTable.jsx
- frontend/src/App.css

Inspect the actual project and determine whether additional files are necessary.

Do NOT modify:

- Backend Laravel files unless the existing backend authorization is insufficient.
- Login behavior unnecessarily.
- Logout behavior unnecessarily.
- usersApi.js unless required by the actual implementation.
- authApi.js unless required to preserve/display the logged-in user information.

# ================================================== 9. ACCEPTANCE CRITERIA

Define clear acceptance criteria for:

- Action buttons.
- Edit behavior.
- Delete behavior.
- Change Role behavior.
- Unauthorized user behavior.
- Admin behavior.
- Logged-in user display.
- Logout behavior.
- Responsive layout.
- Accessibility.
- Security.
- Existing functionality preservation.

# ================================================== 10. TEST SCENARIOS

Define test scenarios for:

1. Admin login.
2. User login.
3. Admin sees Edit/Delete/Change Role buttons.
4. User attempts unauthorized action.
5. Unauthorized Alert/Dialog appears.
6. Unauthorized action does not open the protected action dialog.
7. Admin action continues to work.
8. Edit button opens UserEditDialog.
9. Delete button opens UserDeleteDialog.
10. Change Role button opens UserRoleDialog.
11. Logged-in name/email/role are displayed correctly.
12. Logout removes the displayed user information.
13. Logout returns to LoginPage.
14. Refresh after logout does not show authenticated user information.
15. Desktop layout.
16. Tablet layout.
17. Mobile layout.
18. Keyboard interaction.
19. API 401 behavior.
20. API 403 behavior.

Also define the existing project checks:

npm run lint
npm run build
git diff --check

# ================================================== 11. IMPLEMENTATION PLAN

At the end of the specification, include:

- Current architecture findings.
- Required changes.
- Files to modify.
- Files that should remain unchanged.
- Step-by-step implementation plan.
- Any open questions or assumptions.

IMPORTANT FINAL INSTRUCTION:

Only create/update:

frontend/docs/specs/user-list-actions-ui.md

Do not implement the UI.
Do not modify source code.
Do not commit anything.
