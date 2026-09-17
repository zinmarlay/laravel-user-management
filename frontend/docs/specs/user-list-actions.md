# User List Actions Technical Specification

## 1. Overview

Extend the existing authenticated React User List with three row actions: Edit User, Delete User, and Change User Role. The actions must use the existing Laravel APIs, MUI components, local feature state, and current User List refresh, search, and pagination behavior.

This feature does not add registration, login, profile navigation, photo upload, new endpoints, new response formats, or backend changes.

## 2. Existing Project/API Findings

### Frontend

- The frontend uses React 19, Vite 8, browser fetch, Material UI, and plain CSS.
- src/pages/UserListPage.jsx owns the current list query, result, loading, error, retry, and refresh-trigger state.
- src/components/users/UserTable.jsx renders the table and currently has an Actions column with an Edit placeholder. Extend this column rather than creating a second table.
- src/services/usersApi.js contains fetchUsers() and an existing updateUser() function. Add normalized deleteUser() and updateUserRole() functions there.
- Existing styles use user-list-page__* classes in src/App.css.
- There is no router, auth context, form library, or global state library. Keep state local to the User List feature.

### Backend/API

- All user routes are inside auth:sanctum in backend/routes/api.php.
- Edit: PUT /api/users/{user}, handled by UserController::update().
- Delete: DELETE /api/users/{user}, handled by UserController::destroy().
- Role: PATCH /api/users/{user}/role, handled by UserController::updateRole().
- UpdateUserRequest accepts name, email, optional password, and nullable address. It does not accept role or photo.
- UserController::destroy() returns 204 No Content after successful authorization and deletion.
- UserController::updateRole() validates role as admin or user and returns UserResource.
- UserPolicy::update() permits self-edit or admin cross-user edit. UserPolicy::delete() and updateRole() permit admins only.
- Existing Laravel tests cover edit authorization, delete authorization, valid role changes, invalid roles, and non-admin role-change denial.

## 3. Functional Requirements

1. Extend the table to Photo, Name, Email, Role, Address, and Actions.
2. Provide Edit, Delete, and Change Role actions for each row.
3. Edit opens a form for name, email, optional password, and address.
4. Delete always requires explicit confirmation.
5. Change Role allows only user or admin.
6. Show action-specific loading states and prevent duplicate requests.
7. Keep failed dialogs open where input or confirmation context should be preserved.
8. Refresh the User List after every successful action.
9. Preserve the current search query and pagination page where possible.
10. Do not add features outside User List Actions.

## 4. UI Requirements

Use MUI consistently with the existing User List. Do not add another UI library or form dependency.

### Actions column

- Render accessible MUI Edit, Delete, and Change Role controls.
- Use visible labels where practical; accessible labels must identify the target user.
- Do not treat button visibility as authorization. Handle backend 403 responses for every action.
- Disable the active action while its request is pending.

### Edit dialog

- Use Dialog, DialogTitle, DialogContent, and DialogActions.
- Title: Edit user.
- Pre-fill Name, Email, and Address from the selected row.
- Provide an empty Password field with helper text explaining that blank preserves the current password.
- Do not show role, photo, or the existing password.
- Use TextField components with Name and Email required, Password optional, and Address optional/multiline.
- Actions are Cancel and Save changes.
- Disable fields and actions while saving and show Saving… or CircularProgress.
- Keep the dialog open on validation, authorization, network, and other errors.

### Delete confirmation

- Use an MUI Dialog titled Delete user? or equivalent.
- Show the target user's name and email.
- Explain that deletion is irreversible.
- Actions are Cancel and destructive Delete.
- Do not send a request until Delete is explicitly confirmed.
- Disable confirmation controls and show Deleting… while pending.
- Do not optimistically remove the row.

### Change Role dialog

- Use an MUI Dialog or contained MUI control.
- Show the target user's name and current role.
- Use Select or RadioGroup with exactly user and admin options.
- Show the selected new role and a Save role action.
- Do not allow free-text or arbitrary role values.
- Disable the control and action while saving.

### Responsive behavior

- Keep the Actions column usable on desktop and tablet.
- Allow horizontal table scrolling on narrow screens instead of hiding required data or actions.
- Dialogs must fit the viewport, allow content scrolling, and keep actions reachable.
- Preserve focus indicators and accessible labels.

## 5. API Integration

### Shared conventions

- Use the existing VITE_API_BASE_URL and API_BASE_URL. Do not hard-code a backend host.
- Send Accept: application/json and the existing Sanctum bearer token.
- Send Content-Type: application/json for Edit and Change Role.
- Normalize non-2xx responses using the existing UsersApiError pattern.

### Edit User

~~~text
PUT {API base}/api/users/{userId}
~~~

Send only supported fields:

~~~json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "password": "optional-password",
  "address": "Updated Address"
}
~~~

- Always send name, email, and address.
- Include password only when a non-empty new password was entered.
- Never send id, role, photo, timestamps, or unknown fields.
- Use the existing updateUser() service function.

### Delete User

~~~text
DELETE {API base}/api/users/{userId}
~~~

- Send no body.
- Treat 204 No Content as success without requiring JSON parsing.
- Use the existing authentication token.
- Do not remove the row unless the request succeeds.

### Change User Role

~~~text
PATCH {API base}/api/users/{userId}/role
~~~

Allowed body:

~~~json
{
  "role": "admin"
}
~~~

or:

~~~json
{
  "role": "user"
}
~~~

- Validate against exactly user and admin before sending.
- Use an updateUserRole() service function following updateUser() conventions.
- Refresh from the server after success.

### Status handling

- 200: Edit or Change Role succeeded; close its dialog and refresh.
- 204: Delete succeeded; close confirmation and refresh.
- 401: show authentication/session-expired error and do not claim success.
- 403: show authorization error; backend policy is authoritative.
- 404: show that the target user was not found; do not remove a row locally.
- 422: map errors to fields where an errors object is available and show a form-level message for unmapped errors.
- Other non-2xx or network errors: show a safe retryable error and preserve the current UI context.

## 6. Validation and Form Behavior

### Edit

- Name is required, non-empty after trimming, and no longer than 255 characters.
- Email is required and must use reasonable email validation.
- Password may be blank; when non-empty it must contain at least 8 characters.
- Address may be blank and should be sent as a nullable value.
- Trim name and email before submit; do not trim password characters.
- Do not submit when client validation fails.
- Backend validation remains authoritative, including email uniqueness.
- Preserve entered values and show field errors after 422.

### Delete

- No form validation is needed.
- Explicit confirmation is mandatory.
- The target ID must come from the selected row, not editable text.

### Role

- Valid values are only user and admin.
- Use a controlled select/radio value.
- Do not submit an invalid or arbitrary role.
- Do not submit an unchanged value unless the implementation explicitly permits a no-op.

## 7. Loading, Error, and Success States

### Loading

- Edit shows Saving… and disables form controls.
- Delete shows Deleting… and disables confirmation controls.
- Change Role shows Saving… and disables the role control.
- Prevent duplicate and conflicting mutation requests.

### Error

- Show an MUI Alert inside the relevant dialog or confirmation surface.
- Keep Edit and Change Role dialogs open on failure.
- Keep Delete confirmation open on failure and leave the row unchanged.
- Distinguish 401, 403, 404, 422, network, and generic failures.
- Do not expose tokens, stack traces, or raw exception text.

### Success

- Edit closes, clears transient state, and refreshes.
- Delete closes, clears selected-user state, and refreshes.
- Change Role closes, clears transient state, and refreshes.
- A Snackbar success message is optional and should follow an existing UI convention if introduced.
- If refresh fails after a successful mutation, retain the successful result and use the existing User List retryable error state. Do not repeat the mutation.

## 8. Authentication and Authorization

- All three endpoints require auth:sanctum.
- Use the current bearer token and never call a public mutation endpoint.
- Backend policy is the source of truth:
  - Edit: self or admin.
  - Delete: admin only.
  - Change Role: admin only.
- A visible frontend control is not permission. Handle 403 correctly for every action.
- Do not change policies or introduce frontend-only security rules.
- Do not send role from the normal Edit form.

## 9. React Component and File Structure

Extend the current structure with focused components:

~~~text
frontend/src/
  pages/
    UserListPage.jsx              # selected user, dialogs, actions, refresh
  components/
    users/
      UserTable.jsx               # Actions column and callbacks
      UserEditDialog.jsx          # edit draft, validation, save state/errors
      UserDeleteDialog.jsx        # confirmation and delete state/errors
      UserRoleDialog.jsx          # role selection and save state/errors
      UserListStatus.jsx          # existing list states
  services/
    usersApi.js                   # fetchUsers, updateUser, deleteUser, updateUserRole
  App.css                         # action/dialog responsive styling
~~~

- UserTable remains presentational and receives callbacks such as onEdit, onDelete, and onChangeRole.
- UserListPage owns selectedUser, modal visibility, and refresh coordination because it owns the list query.
- Each dialog owns its draft values, local validation, loading, and field/form errors.
- Reuse the existing API base, token helper, UsersApiError, and fetch conventions.
- Do not add Axios, a form library, a global store, or another UI library.

## 10. State Management and Data Flow

Page-level state should include selectedUser, edit-open state, delete-open state, role-open state, action errors, saving/deleting/changingRole flags, and the existing list refresh state.

1. UserListPage passes rows and action callbacks to UserTable.
2. A callback stores the selected row and opens the corresponding dialog.
3. The dialog initializes from the selected row without a detail request.
4. The dialog validates local input and calls the appropriate service function.
5. The service sends the mutation with the current token and normalizes errors.
6. On failure, the dialog remains open and preserves input or confirmation context.
7. On success, the page closes the dialog and refreshes the current list query.
8. Refresh preserves submitted search and current page where the server still has that page.
9. If deletion makes the current page invalid, move to the previous valid page, never below page 1.
10. Do not optimistically mutate rows; the refreshed server response is authoritative.

## 11. Refresh Behavior

- Refresh after Edit, Delete, and Change Role through fetchUsers().
- Preserve the current submitted search term.
- Preserve the current page where possible.
- If the deleted user was the last row on a page, request the previous page when needed.
- If an edited user no longer matches the active search, accept the server result and do not force the row into the list.
- Use existing stale-response protection so an older refresh cannot overwrite newer data.
- Do not repeat a mutation if its follow-up refresh fails.

## 12. Testing and Verification Requirements

### Frontend checks

- Run the available frontend lint and production build checks.
- Verify list loading, search, pagination, empty, error, and authentication behavior still work.
- Verify the Actions column is accessible and responsive.
- Verify each dialog opens for the correct row and Cancel closes without mutation.
- Verify action controls disable during requests.

### Edit scenarios

- Edit name, email, and address successfully.
- Set a new password successfully.
- Leave password blank and verify it is omitted.
- Reject invalid required fields and short passwords before request.
- Preserve input for 401, 403, 404, 422, network, and generic errors.
- Verify success closes and refreshes the same search/page.

### Delete scenarios

- Require confirmation; Cancel leaves the row unchanged.
- Verify successful 204 closes and refreshes.
- Verify last-row deletion handles the current page correctly.
- Verify 401, 403, 404, network, and generic errors leave the row visible.

### Role scenarios

- Show only user and admin.
- Verify both valid role changes use PATCH /api/users/{id}/role.
- Do not send invalid or unchanged values.
- Verify success closes and refreshes.
- Verify 401, 403, 404, 422, network, and generic errors.

### Backend contract

- Do not change backend code.
- Use the existing Laravel feature tests and API behavior as the contract for status codes, authorization, validation, and responses.

## 13. Acceptance Criteria

- The table displays Photo, Name, Email, Role, Address, and Actions.
- Edit, Delete, and Change Role are accessible MUI actions for each row.
- Edit uses PUT /api/users/{id} with only supported fields.
- Delete uses DELETE /api/users/{id} only after confirmation.
- Change Role uses PATCH /api/users/{id}/role and sends only user or admin.
- Loading states prevent duplicate mutation requests.
- Failed actions preserve dialog/confirmation context and do not corrupt the table optimistically.
- Successful actions close their UI and refresh while preserving search and pagination where possible.
- Admin-only Delete and Change Role handle non-admin 403 responses.
- Self-edit and admin cross-user edit match the existing policy.
- Existing list behavior does not regress.
- Lint/build and action verification scenarios pass.
- No backend files or unrelated frontend features are modified.

## 14. Scope Exclusions and Open Questions

### Exclusions

- User Profile navigation.
- Photo upload or editing.
- Register, Login, Logout, or token-acquisition UI.
- Arbitrary roles or permissions.
- Bulk actions, sorting, extra filtering, or page-size controls.
- New backend endpoints, response formats, policies, or validation rules.

### Open questions

- Confirm whether local storage key token remains the shared token source or a later auth provider will replace it.
- Confirm whether a global Snackbar convention should be used for success messages.
- Confirm whether authenticated-user identity will be available before implementation; until then, rely on backend 403 enforcement.
- Confirm the preferred UX when a mutation succeeds but the current page refresh has no results; use the existing empty state or move to the previous page when invalid.
