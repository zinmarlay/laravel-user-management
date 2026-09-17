# User List Technical Specification

## 1. Overview

Implement an authenticated User List page in the React/Vite frontend. The page displays the users returned by the existing Laravel API in a responsive MUI table, supports server-side searching by name or email, and uses the API's existing pagination metadata for navigation.

This is a read-only feature. It does not add or imply edit, delete, role-management, profile, photo-upload, registration, or login functionality.

The current frontend is the unmodified Vite starter: `src/App.jsx` renders the starter screen, and there are no existing pages, API services, routing, state-management library, MUI package, or HTTP-client package. The implementation should fit that small structure and use React state plus the browser `fetch` API unless a later feature establishes a shared convention.

## 2. Existing Project/API Findings

### Frontend

- Frontend technology is React 19 with Vite 8.
- The application entry point is `frontend/src/main.jsx`; it mounts `App` from `frontend/src/App.jsx`.
- Styling currently uses `frontend/src/index.css` and `frontend/src/App.css`, with plain CSS and responsive media queries. No component library is currently installed.
- `frontend/package.json` contains only `react` and `react-dom` as runtime dependencies. MUI is required by this specification, but adding its packages is an implementation prerequisite and must be handled separately from this documentation-only task.
- `frontend/vite.config.js` has no API proxy or other API-base configuration.

### Backend/API

- `backend/routes/api.php` registers `Route::apiResource('/users', UserController::class)` inside an `auth:sanctum` middleware group. The list endpoint is therefore `GET /api/users`.
- `UserController::index()` authorizes `viewAny` and runs a `User` query. It applies the optional `search` value to `name LIKE "%search%" OR email LIKE "%search%"`, then calls `paginate(5)`.
- The list action returns `response()->json($users)` directly. It does not wrap the paginator in `UserResource`, so the client must consume Laravel's paginator JSON as returned.
- `UserResource` documents the intended user field names (`id`, `name`, `email`, `address`, `photo`, `role`, `created_at`, and `updated_at`), and the `User` model hides `password` and `remember_token`. The list response is expected to expose the same non-hidden model fields.
- The users migration defines `address` and `photo` as nullable, `role` as a string with default `user`, and `name`/`email` as required.
- `AuthController::login()` and `register()` return a Sanctum token. The list request must send the currently authenticated token using the project's established authentication mechanism; this repository does not yet contain a frontend auth implementation.
- `UserPolicy::viewAny()` returns `true` for any authenticated user. There is no admin-only restriction on the list endpoint. The existing `AdminMiddleware` is registered but is not applied to the users resource group.
- The backend feature tests cover authenticated access, guest `401`, `search`, and five-item pagination. They use `GET api/users`, `GET api/users?search=john`, and `GET api/users?page=2`.

## 3. Functional Requirements

1. Render a User List page for an authenticated user.
2. Fetch users from the existing `GET /api/users` endpoint. Do not add or depend on a new endpoint or response format.
3. Display one table row per item in the response `data` array.
4. Display the user's available `photo` as an avatar image. If `photo` is null, empty, unavailable, or fails to load, display a deterministic fallback avatar (initials derived from the name, or a generic person fallback when no name is available).
5. Display `name`, `email`, `role`, and `address` in dedicated table columns. Render null or empty address as an em dash (`—`) so the table does not show `null` or `undefined`.
6. Provide a search input above the table. Searching must use the backend's `search` parameter; the frontend must not fetch all users and filter locally.
7. Allow pagination through the Laravel paginator metadata. A page change must request the selected page while preserving the active search term.
8. Reset to page 1 whenever a new search is submitted.
9. Show a loading state during the initial fetch and during subsequent search/page requests.
10. Show a dedicated empty-result state when the successful response contains no rows, and handle the backend's current `404` no-match response as an empty result rather than as an application failure.
11. Show an actionable error state for authentication failures, authorization failures, network failures, and other unexpected API failures.
12. Do not render controls or actions for editing, deleting, creating, or managing roles.

## 4. UI Requirements

Use Material UI components and the existing frontend's plain-CSS styling approach. Do not introduce another UI library.

### Page layout

- Render a centered, full-width page within a responsive content container. The container should have comfortable horizontal padding on desktop and reduced padding on narrow screens.
- Place the page title at the top, followed by the search area, then the user table, then pagination below the table.
- Use `Paper` (or the project's equivalent MUI surface) around the search/table area to establish the primary content surface. Use `Typography` for page and state copy.
- Keep the visual language simple and consistent with the current project: system font stack, neutral borders, readable text contrast, and responsive spacing. The current starter supports light/dark color-scheme CSS; the User List should remain legible in both modes if that behavior is retained.

### Page title

- Text: `Users`.
- Use a prominent MUI `Typography` heading with semantic heading level 1.

### Search box and action

- Place the search box above the user list, visually associated with the table.
- Use an MUI `TextField` with label `Search users` and placeholder `Search by name or email`.
- Use a text input, not a select or role filter.
- Provide an explicit MUI `Button` labeled `Search` as the primary search action. Submitting the form with Enter must trigger the same action.
- Keep the input value separate from the submitted search term so users can edit text without changing the displayed result until they submit.
- Disable the Search button while a request is in progress. The input may remain editable, but a submitted request must use a stable snapshot of the term.
- Do not add a debounce requirement; the defined search action is submit/Enter. If a later design chooses debounce, it must still use the existing `search` query parameter and reset pagination.

### User list/table

- Use `TableContainer`, `Table`, `TableHead`, `TableBody`, `TableRow`, and `TableCell`.
- Column order: `Photo`, `Name`, `Email`, `Role`, `Address`.
- Mark the header row as a table header and use accessible column labels.
- Use stable `user.id` values as row keys.
- Preserve long email and address content without causing the entire page to overflow; allow wrapping in cells where needed.
- The table is read-only. Rows and cells must not appear clickable unless a separate feature explicitly adds navigation.

### User avatar/photo

- Use MUI `Avatar` in the Photo column, with an accessible `alt` value such as `Photo of {name}`.
- Pass a usable non-empty `photo` value as the image source and fall back to initials/generic avatar when it is absent or the image emits an error.
- Do not invent a storage path prefix or a different image endpoint. The backend currently exposes the raw nullable `photo` string and does not transform it into a URL.

### Pagination controls

- Use MUI `Pagination` below the table.
- Derive the current page from the response's `current_page` and the number of pages from `last_page`; do not calculate page count from the currently loaded rows.
- Hide or omit pagination when there is only one page. When multiple pages exist, expose an accessible label such as `User list pagination`.
- Disable pagination while a request is pending to prevent overlapping page requests. After success, update the current page from the response rather than assuming the server accepted the requested page.

### Responsive behavior

- Desktop/tablet: show all five columns in the specified order; the table may scroll horizontally inside `TableContainer` if the viewport cannot accommodate the minimum readable widths.
- Mobile: keep the table usable with horizontal scrolling rather than shrinking text to an unreadable size. The search form should stack the TextField and Search button vertically when needed, with both controls at least the available content width.
- Keep avatar and name cells compact, allow email/address wrapping, and ensure focus indicators remain visible.
- Do not hide required fields without an explicit, accessible alternative. If a later responsive design replaces the table with cards, it must still expose photo, name, email, role, and address for every user.

## 5. API Integration

### Request

Use the existing endpoint:

```text
GET {API base}/api/users
```

Request query parameters:

| Parameter | When sent | Meaning |
|---|---|---|
| `search` | When the submitted search term is non-empty after trimming | Backend search value applied to `name` or `email` |
| `page` | For pages after page 1; it may also be sent consistently for all requests | Laravel paginator page number |

Do not send `per_page`: the backend currently hardcodes `paginate(5)`, and no page-size query parameter is implemented.

The request must include the authenticated Sanctum token in the `Authorization: Bearer {token}` header if the frontend auth flow stores a token. The frontend should also send `Accept: application/json`. The repository does not establish where the token is stored or the API base URL, so those values must come from the auth/configuration convention created by the surrounding application.

### Response

The controller returns Laravel's `LengthAwarePaginator` JSON directly. The client should expect a shape like:

```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "name": "Example User",
      "email": "user@example.com",
      "address": "Example address",
      "photo": null,
      "role": "user",
      "created_at": "2026-09-17T00:00:00.000000Z",
      "updated_at": "2026-09-17T00:00:00.000000Z"
    }
  ],
  "first_page_url": ".../api/users?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": ".../api/users?page=1",
  "links": [],
  "next_page_url": null,
  "path": ".../api/users",
  "per_page": 5,
  "prev_page_url": null,
  "to": 1,
  "total": 1
}
```

The `links` array is included by Laravel and may contain label, URL, and active fields; the frontend only needs `current_page` and `last_page` for MUI `Pagination`. Treat `data` as the row source and `per_page` as server-provided metadata, not a client-controlled setting.

### Status handling

- `200`: parse and validate that the payload has an array `data` and usable pagination metadata; render the result.
- `401`: the token is missing, invalid, or expired. Show an authentication-required/session-expired message and stop rendering private data. Redirecting to login is out of scope until a frontend auth route exists.
- `403`: show an authorization message. The current `viewAny` policy permits authenticated users, so this would indicate a backend authorization change or middleware/configuration issue.
- `404` with `{ "message": "User not found." }` from `UserController::index()`: represent no matching users as the empty-result state. Do not treat this as a missing route.
- Other non-2xx responses: show the error state with a safe generic message and retain the current displayed list when possible.
- Network failure, malformed JSON, or a malformed `data`/pagination payload: show the error state and provide a retry action. Do not render fabricated rows or page counts.

## 6. Search Behavior

- On initial load, submit no `search` parameter (or an empty value omitted from the URL) and request page 1.
- On Search/Enter, trim leading and trailing whitespace from the input. If the trimmed term differs from the previous submitted term, set page to 1 and issue a new request.
- For a non-empty term, encode it using `URLSearchParams`; do not concatenate unescaped user input into the URL.
- The backend performs a contains search using SQL `LIKE` against both `name` and `email`: `name LIKE "%{search}%" OR email LIKE "%{search}%"`.
- Search matching and case sensitivity are determined by the backend database collation. The frontend must not claim or enforce case sensitivity.
- Preserve the active submitted search term when moving between pages.
- If the term has not changed, submitting Search may refresh page 1, but it must not create duplicate concurrent requests.
- Clear search returns to the unfiltered list at page 1. If the clear action is represented by an input adornment/button, it must have an accessible label; an extra clear control is optional and not required by this feature.

## 7. Pagination Behavior

- The server page size is five users (`paginate(5)`). The UI must display the server's `per_page` only if a summary is later added; it must not offer a page-size selector.
- Initialize the page to 1. On a successful response, use `current_page` and `last_page` from the response.
- Selecting page `n` requests `GET /api/users?page=n`, plus `search=...` when a search is active.
- Reset page to 1 on every new search submission, including a transition from a non-empty search to an empty search.
- If a page request returns no results or a 404 no-match response, show the empty state and make page 1/search reset available. The client must not silently invent a previous page.
- Ignore stale responses from requests superseded by a newer search or page request, so an older response cannot overwrite newer results.
- When a request begins because of a page change, retain the prior rows until the new response succeeds or show a clearly marked loading overlay; do not present a misleading mixture of old rows and new pagination metadata.

## 8. Loading / Empty / Error States

### Loading

- Initial load: show a centered `CircularProgress` with accessible status text such as `Loading users…` inside the list surface. The page title and search controls may remain visible.
- Search/page load: disable Search and Pagination, show `CircularProgress` or a table loading overlay, and prevent interactions that would start concurrent requests.
- Do not show the empty state while the first request is pending.

### Empty

- For a successful response with `data: []`, or the endpoint's current no-match `404`, show a centered message in the table area.
- With an active search, use copy such as `No users found for your search.` and suggest clearing/changing the search.
- Without a search term, use copy such as `No users found.`
- Do not show table headers as if rows were present, but preserve the page context and search controls. Hide pagination when there are no navigable pages.

### Error

- Show an MUI `Alert` with a concise, human-readable message and a `Retry` MUI `Button`.
- Initial-load error: show the alert in the list area; the page title and search form may remain available.
- Search/page error: keep the last known rows and pagination visible when safe, show the alert near the list, and let Retry repeat the failed request with the same search/page state. If no prior data exists, show the alert in the empty list area.
- Use distinct messages for session/authentication (`401`), authorization (`403`), and generic/network failures. Do not expose raw server exception text or tokens.

## 9. Authentication and Authorization

- Every list request is private because the route is inside Laravel's `auth:sanctum` middleware group.
- Only render the User List as authenticated application content. The page must not attempt to bypass authentication or call a public users endpoint.
- Use the existing token established by login/register when the frontend auth flow is implemented. Because the current frontend has no auth state or login page, token storage and session bootstrap are an integration dependency/open question, not part of this feature.
- Any authenticated role may list users under the current `UserPolicy::viewAny()` implementation. Do not add an admin-only guard, role selector, or frontend role-based filtering.
- Treat `401` and `403` as server authorization outcomes; never infer permission from a displayed `role` value.
- Do not expose password or token fields. The backend model hides password and remember token, and the list UI only maps the required display fields.

## 10. React Component / File Structure

The current app has no established feature structure. Introduce the smallest clear structure when implementation begins:

```text
frontend/src/
  App.jsx                         # mounts/composes the User List page
  pages/
    UserListPage.jsx              # page layout and page-level state orchestration
  components/
    users/
      UserSearchForm.jsx          # controlled search input and submit action
      UserTable.jsx               # table headers, rows, and empty table body
      UserAvatar.jsx              # photo/initials fallback behavior
      UserListPagination.jsx      # MUI Pagination adapter
      UserListStatus.jsx          # loading and error presentation, if useful
  services/
    usersApi.js                   # fetchUsers({ search, page, token })
  index.css / App.css             # existing global and app styles
```

Guidance:

- Keep fetch and request-staleness/error normalization in `usersApi.js` or the project's later shared API layer; components should not duplicate URL construction.
- Keep `UserListPage` responsible for submitted search, current page, request lifecycle, last successful response, and retry parameters.
- Keep `UserTable` presentational and pass it normalized user rows. It should not own pagination or authentication.
- Use React `useState`/`useEffect` and `AbortController` or an equivalent request identity check for cancellation/stale response protection. Do not add a state-management dependency for this page alone.
- Use MUI components listed in the prompt (`TextField`, `Button`, `Table*`, `Avatar`, `Pagination`, `CircularProgress`, `Alert`, `Paper`, and `Typography`) where they map to the defined UI.
- MUI is not currently in `package.json`; its addition is required by the UI requirement but is outside this documentation-only task and must be explicitly included in the later implementation plan.

## 11. Data Flow

1. `UserListPage` initializes `{ submittedSearch: '', page: 1 }` and a loading status.
2. The page's effect/service builds a `URLSearchParams` query from the submitted search and page, adds the Sanctum bearer token, and calls `GET /api/users`.
3. The service parses the response. It normalizes the current list result to `{ rows: data, currentPage: current_page, lastPage: last_page, total, perPage: per_page }` without changing the server semantics.
4. On `200`, the page stores the normalized response, clears the error, and renders the rows and pagination.
5. On the current list `404` no-match response, the page stores an empty result with no visible rows and renders the search-aware empty state.
6. On `401`, `403`, network, parsing, or validation failure, the page stores an error category/message. It retains the last successful result when the failure occurred during a later search/page request.
7. `UserSearchForm` submits a trimmed term to the page. The page sets page 1 and a new submitted term, which triggers the request.
8. `UserListPagination` emits a selected page. The page keeps the submitted search term and requests that page.
9. `Retry` repeats the most recent `{ submittedSearch, page }` request. A new request must cancel or invalidate the previous request, and only the latest request may update state.
10. Each row maps only `photo`, `name`, `email`, `role`, and `address` into the table. `id` is used for identity; timestamps are not displayed.

## 12. Acceptance Criteria

- An authenticated user can open the User List page and see users from `GET /api/users`.
- A guest request is not treated as a successful list; a `401` produces the authentication error behavior.
- The page sends `search=<term>` only for the submitted, trimmed term, and backend results include matches by name or email without client-side filtering.
- A search submission always starts at page 1; changing pages preserves the active search term.
- The page displays exactly the required user data: photo/avatar, name, email, role, and address, with safe rendering for null address/photo values.
- A non-null usable photo is rendered in MUI `Avatar`; missing or failed photos use an accessible fallback avatar.
- Pagination uses Laravel's `current_page`/`last_page` metadata and respects the backend's five-item page size without offering a page-size selector.
- Initial and subsequent requests have visible loading feedback and prevent duplicate request actions while pending.
- Empty unfiltered results, empty search results, and the backend's current 404 no-match response produce a clear empty state with no misleading pagination.
- `401`, `403`, network failures, malformed JSON, and malformed paginator payloads produce a clear retryable error state without fabricated data.
- The table and search controls remain usable at desktop, tablet, and mobile widths; required columns remain accessible.
- No edit, delete, create, role-management, profile, photo-upload, registration, or login UI is added.
- No Laravel route, controller, resource, policy, migration, or other backend file is changed as part of this feature.
- No frontend dependency is added as part of this specification task. A later implementation must resolve the MUI dependency and auth/API-base configuration before coding.

## 13. Assumptions / Open Questions

- **MUI dependency:** The prompt requires MUI, but the current frontend has no MUI packages. Confirm that the later implementation may add the MUI runtime packages (and any required peer package) even though this task must not install packages.
- **API base URL:** No `VITE_API_BASE_URL`, Vite proxy, or frontend API configuration exists. Define whether deployment will use an environment variable, same-origin `/api`, or a Vite development proxy before implementation.
- **Token source:** The frontend has no auth context, token storage, or login route. Define the shared auth/session contract that `fetchUsers` will use. This specification assumes a bearer token is available to the request layer.
- **Photo URL contract:** The backend returns raw nullable `photo` and does not call `Storage::url()` or expose a dedicated photo route. Confirm whether persisted values are absolute URLs, same-origin paths, or storage-relative paths. Until confirmed, do not prepend a path; use the raw value and an image-error fallback.
- **Locale/case behavior:** Search is delegated to SQL `LIKE`, so case sensitivity depends on database collation. No frontend normalization beyond trimming is specified.
- **Paginator links:** Laravel returns `links` and URL fields, but the UI only needs `current_page` and `last_page`. Confirm whether API hosts may differ from the frontend host; if so, do not follow server-provided pagination URLs directly without an approved API URL policy.
- **Search 404 contract:** The current controller returns `404` with `User not found.` when any list query is empty, rather than a `200` response with `data: []`. The frontend must treat that exact list response as empty. If the backend contract changes later, update the service mapping and tests without adding a new endpoint.
- **Error message punctuation:** The list controller currently uses `User not found.` while the global not-found renderer uses `User not found` for `/api/users/*`. The list implementation should classify the list action's status and response context, not rely only on exact punctuation.
