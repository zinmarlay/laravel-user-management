# User List — Codex Prompt

## Role

You are a senior React developer working on a production-style User Management System.

## Project Context

- Frontend: React + Vite
- Backend: Laravel 13 REST API
- Authentication: Laravel Sanctum
- Repository structure:
  - `backend/` — Laravel API
  - `frontend/` — React application
- Current branch: `feature/user-list`
- UI library: Material UI (MUI)

Before creating the specification, inspect the existing frontend code and Laravel backend/API implementation. Do not assume API behavior that is not present in the project.

## Task

Create a technical specification for the **User List** feature only.

Write the specification to:

`frontend/docs/specs/user-list.md`

Do not implement the feature yet. This task is specification/design only.

## User List Requirements

The specification must cover:

1. Display a list/table of users.
2. Display the user's photo/avatar when a photo is available.
3. Display:
   - Name
   - Email
   - Role
   - Address
4. Provide a search box above the user list.
5. Allow users to search by name or email.
6. Support pagination based on the existing Laravel API response.
7. Define loading-state behavior.
8. Define empty-result-state behavior.
9. Define API/error-state behavior.
10. Respect the existing authentication and authorization rules.
11. Use the existing backend API without inventing a new endpoint or response format.

## UI Requirements

The specification must define the User List UI, including:

- Page layout
- Page title
- Search box
- Search input placeholder
- Search action
- User list/table
- User avatar/photo
- Name
- Email
- Role
- Address
- Pagination controls
- Loading state
- Empty state
- Error state
- Responsive behavior for different screen sizes

The UI should follow the existing frontend project's structure and styling approach.

Do not introduce a new UI library unless the existing project already uses it or the specification clearly justifies it.

## Scope Exclusions

Do not include:

- Edit user
- Delete user
- Role management/select box
- User Profile page
- Photo upload
- Register/Login UI
- Laravel backend changes

These features will be handled separately.

## API Investigation

Inspect the existing Laravel backend and document the actual API information required by the User List:

- Endpoint
- HTTP method
- Authentication requirement
- Query parameters
- Search behavior
- Pagination parameters
- Response structure
- Available user fields
- Relevant authorization behavior

If something is unclear, record it as an assumption or open question instead of inventing behavior.

## React Architecture

Describe an appropriate React-side structure based on the existing project.

Consider:

- Components
- Pages
- API/service layer
- State management
- Reusable UI elements
- Loading/error/empty states

Use Material UI (MUI) for the User List UI.

Prefer existing MUI components where appropriate, such as:

- TextField
- Button
- Table
- TableContainer
- TableHead
- TableBody
- TableRow
- TableCell
- Avatar
- Pagination
- CircularProgress
- Alert
- Paper
- Typography

Do not introduce another UI library.
Do not introduce additional dependencies unless the existing project already uses them or the specification clearly justifies them.

## Specification Format

Create `frontend/docs/specs/user-list.md` with these sections:

1. Overview
2. Existing Project/API Findings
3. Functional Requirements
4. UI Requirements
5. API Integration
6. Search Behavior
7. Pagination Behavior
8. Loading / Empty / Error States
9. Authentication and Authorization
10. React Component / File Structure
11. Data Flow
12. Acceptance Criteria
13. Assumptions / Open Questions

## Important Rules

- Inspect the actual codebase before writing the specification.
- Do not write React implementation code.
- Do not modify Laravel backend code.
- Do not install packages.
- Do not create files other than `frontend/docs/specs/user-list.md`.
- Do not expand the scope beyond User List.
- Base technical decisions on the existing project whenever possible.
- Make the specification detailed enough that another developer can implement the feature without guessing.
