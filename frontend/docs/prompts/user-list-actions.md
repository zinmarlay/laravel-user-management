# User List Actions — Implementation Prompt

## Feature

User List Actions

## Goal

Extend the existing User List feature by adding actions for:

- Edit User
- Delete User
- Change User Role

The existing User List, search, pagination, authentication, and backend APIs must continue working without regression.

## Existing Project

The project has:

- Laravel backend
- React frontend
- Material UI (MUI)
- Laravel Sanctum authentication
- Existing User List page
- Existing `UserTable` component
- Existing `usersApi.js` service
- Existing User Policy and API tests

Follow the existing project structure and coding style.

---

## 1. Edit User

### UI

Add an `Edit` action to each row in the User List.

When the user clicks `Edit`:

1. Open an MUI Dialog or appropriate edit form.
2. Display the selected user's current information.
3. Allow editing:
   - name
   - email
   - password (optional)
   - address
4. Do not allow the role to be changed from the normal Edit form.
5. Show a loading state while saving.
6. Prevent duplicate submissions while saving.

### API

Use the existing backend endpoint:

`PUT /api/users/{user}`

Request body:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "password": "optional-password",
  "address": "Updated Address"
}
```

Use the existing `updateUser()` function in:

`frontend/src/services/usersApi.js`

### Success

After a successful update:

- Close the Edit dialog.
- Refresh the User List.
- Preserve the current search query.
- Preserve the current pagination page where possible.
- Show an appropriate success indication if consistent with the existing UI.

### Error

If the API request fails:

- Keep the dialog open.
- Display an appropriate error message.
- Do not lose the user's entered data.

---

## 2. Delete User

### UI

Add a `Delete` action to each User List row.

When Delete is clicked:

1. Show a confirmation dialog.
2. Display enough information to identify the target user.
3. Do not immediately delete the user without confirmation.
4. Show a loading state while deleting.
5. Prevent duplicate delete requests.

### API

Use the existing backend endpoint:

`DELETE /api/users/{user}`

Use the existing authentication token.

### Authorization

The backend is the source of truth for authorization.

The existing backend policy allows:

- Admin → delete user
- Non-admin → forbidden

The frontend must correctly handle a `403` response.

Do not rely on hiding the button as the only security mechanism.

### Success

After successful deletion:

- Close the confirmation dialog.
- Refresh the User List.
- Preserve the current search query.
- Handle the case where the deleted user was the last item on the current page.

### Error

If deletion fails:

- Keep the UI stable.
- Show an appropriate error message.
- Do not incorrectly remove the user from the UI.

---

## 3. Change User Role

### UI

Add a role action to each User List row.

The UI should allow an authorized administrator to change the selected user's role.

Supported roles:

- `user`
- `admin`

Do not allow arbitrary role values.

The role change UI should clearly indicate:

- Current role
- New role
- Save/update action
- Loading state
- Error state

### API

Use the existing backend endpoint:

`PATCH /api/users/{user}/role`

Request body:

```json
{
  "role": "admin"
}
```

or:

```json
{
  "role": "user"
}
```

Use the existing frontend API service pattern.

### Authorization

The backend policy allows:

- Admin → change user role
- Non-admin → forbidden

The frontend must correctly handle `403`.

Do not treat frontend visibility as a security boundary.

### Validation

Only these values are valid:

- `admin`
- `user`

Invalid values must not be sent by the UI.

The backend remains responsible for final validation.

### Success

After successful role change:

- Close the role dialog/control if applicable.
- Refresh the User List.
- Preserve the current search query.
- Preserve the current pagination page where possible.

---

## 4. User List Actions UI

The existing table currently displays:

`Photo | Name | Email | Role | Address`

Extend it to:

`Photo | Name | Email | Role | Address | Actions`

The Actions area should provide:

- Edit
- Delete
- Change Role

Use MUI components consistently with the existing project.

Avoid introducing a new UI library.

---

## 5. API Service

Update:

`frontend/src/services/usersApi.js`

Add/reuse functions for:

- `updateUser()`
- `deleteUser()`
- `updateUserRole()`

Follow the existing `fetchUsers()` authentication and error-handling conventions.

Do not hard-code the backend URL if `API_BASE_URL` already exists.

Use the existing `VITE_API_BASE_URL` configuration through `API_BASE_URL`.

---

## 6. State Management

Keep state local to the User List feature unless the existing project requires otherwise.

Possible states include:

- `selectedUser`
- edit dialog open/closed
- delete confirmation open/closed
- role dialog/control open/closed
- `saving`
- `deleting`
- `changingRole`
- action error

Avoid unnecessary global state.

---

## 7. Existing Functionality Must Not Regress

Do not break:

- User List
- Search
- Pagination
- Loading state
- Empty state
- Error state
- Authentication
- Existing API behavior

After actions are completed, the User List should remain synchronized with the backend.

---

## 8. Constraints

- Do not modify the Laravel backend unless explicitly required.
- The required backend APIs already exist.
- Do not change existing authorization rules.
- Do not modify unrelated components.
- Reuse existing components and utilities where possible.
- Follow the existing React/MUI coding style.
- Keep components reasonably small and maintainable.
- Do not introduce unnecessary dependencies.
- Do not implement features outside User List Actions.

---

## 9. Testing / Verification

After implementation:

1. Run the frontend lint/build checks available in the project.
2. Verify User List still loads.
3. Verify search still works.
4. Verify pagination still works.
5. Verify Edit.
6. Verify Delete confirmation and deletion.
7. Verify Role Change.
8. Verify API errors such as:
   - 401
   - 403
   - 422
   - network error
9. Verify loading states.
10. Verify the list refreshes correctly after each successful action.

---

## 10. Implementation Rules

Before modifying files:

1. Inspect the existing components and API service.
2. Follow existing patterns instead of creating duplicate utilities.
3. Keep the implementation focused on this feature.

Do not rewrite unrelated existing code.

After implementation, report:

- Files changed
- What was implemented
- Any assumptions made
- Tests/checks performed
- Any remaining issues
