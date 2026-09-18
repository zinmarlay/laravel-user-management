# Language Support Specification

## 1. Overview

Add frontend language support for exactly two UI languages:

- English (`en`)
- Japanese (`ja`)

This feature localizes frontend-owned visible text and accessibility text while preserving the existing authentication, user management, profile, logout, and change-password behavior. It must not introduce React Router, an external i18n package, a new state-management library, or backend changes.

## 2. Current Architecture Findings

- `frontend/src/main.jsx` renders `App` inside `React.StrictMode` and currently has no provider layer.
- `frontend/src/App.jsx` owns the authentication gate, the authenticated user held in memory, the active list/profile view, authentication notices, and refresh coordination.
- `LoginPage` and `RegisterPage` render the unauthenticated flows. `LoginForm` and `RegisterForm` own their form state and validation.
- `UserListPage` renders search, pagination, user actions, logout, and current-user information.
- `UserProfilePage` renders profile details and profile editing/photo actions.
- User dialogs cover edit, delete, role changes, authorization notices, and change password.
- `authApi.js` owns login, registration, logout, and change-password API calls. `usersApi.js` owns user list/profile and user-list action APIs.
- `UsersApiError` in `apiError.js` is the existing structured API error type.
- Authentication uses `localStorage["token"]`; `App` controls whether protected content or unauthenticated content is rendered.
- No localization dictionary, language context, language persistence, or i18n dependency currently exists.
- The frontend has no dedicated test runner in `package.json`; existing lint/build commands are the available frontend checks.

## 3. Existing Hard-Coded UI Inventory

The implementation must replace frontend-owned English strings in:

- Login and registration headings, labels, placeholders, buttons, validation, loading, and server-error messages.
- User list headings, current-user display, logout, search, empty/loading/error states, pagination, and table column/action labels.
- Profile headings, fields, edit/photo controls, loading/error states, and navigation controls.
- Edit, delete, role, authorization, and change-password dialog titles, descriptions, labels, validation, loading, success, and error messages.
- `aria-label`, `title`, tooltip, dialog description, button text, and other screen-reader-visible strings.
- Safe frontend API error messages exposed by `authApi.js` and `usersApi.js`, where those messages are rendered by the UI.

User-provided values such as names, email addresses, addresses, profile data, search input, and server-returned user content must remain unchanged and must not be passed through the translation dictionary.

## 4. Language State and Persistence

Create a small frontend language layer with:

- Supported languages: `en` and `ja` only.
- `localStorage` key: `language`.
- Default language: `en`.
- Invalid, missing, or unreadable stored values fall back to `en`.
- The selected language is held in React state and persisted when changed.
- Storage failures must not break rendering; the in-memory language selection remains usable.
- Language changes must update the UI immediately without reload, logout, token changes, or loss of form/table/profile state.
- Passwords, tokens, files, object URLs, and API payloads must never be stored as language data.

The provider/context should expose the current language, a language setter, and a translation function. The setter must accept only supported language codes and must not create arbitrary dictionary keys or dynamic executable content.

## 5. Language Selector

Add a reusable `LanguageSwitcher` using existing Material UI conventions.

- It must clearly expose English and Japanese choices.
- It must have an accessible label and keyboard-operable controls.
- It must appear on both unauthenticated pages and the authenticated application shell in a responsive location that does not cause header overflow.
- Switching language must preserve the current page, selected user, dialog state where applicable, search, pagination, and unsaved non-password form values.
- The selector itself must use localized labels where appropriate, while the language names may remain recognizable as `English` and `日本語`.

## 6. Translation Dictionary

Use a centralized dictionary rather than scattered conditional strings. The dictionary should be organized by semantic feature areas, including at least:

- `common.*`
- `language.*`
- `auth.*`
- `users.*`
- `profile.*`
- `actions.*`
- `dialogs.*`
- `validation.*`
- `errors.*`
- `roles.*`

Both `en` and `ja` must define every key used by the frontend. Missing keys must safely fall back to the English value, and missing English keys must fall back to a neutral key-safe value rather than throwing during rendering.

Parameterized messages must interpolate trusted display values safely. Translation lookup must not interpret user input, backend payloads, HTML, or executable expressions.

## 7. Data and Role Rules

- Do not translate or mutate raw user data.
- Keep raw backend role values as `admin` and `user` for authorization and API behavior.
- Translate only their display labels (`Admin`/`User` and Japanese equivalents).
- Do not infer a role when `currentUser` is unavailable; retain the existing neutral fallback and default-deny protected action behavior.
- Do not expose tokens, passwords, raw API payloads, filesystem paths, or backend exception details in translated messages.

## 8. Translation Integration

Add the language provider at the existing application entry point and make the translation API available to `App` and all rendered pages/components.

Expected new frontend pieces are:

- `frontend/src/i18n/translations.js` for the `en` and `ja` dictionaries and supported-language metadata.
- `frontend/src/i18n/LanguageContext.jsx` for language state, persistence, fallback behavior, and translation lookup.
- `frontend/src/i18n/errorMessages.js` for mapping existing structured API errors to safe localized UI messages, if keeping this mapping outside components is necessary.
- `frontend/src/components/common/LanguageSwitcher.jsx` for the reusable selector.

Update existing components to consume translations instead of hard-coded frontend UI text. Keep API service responsibilities and response contracts unchanged. API services may continue to create safe English `UsersApiError` messages internally, but UI rendering must map known error codes/statuses to the selected language.

## 9. Error and Validation Architecture

- Preserve existing client-side validation rules and validation timing.
- Translate validation labels/messages without changing which values are accepted or rejected.
- Preserve existing loading, success, API, network, 401, 403, not-found, malformed-response, and refresh behavior.
- Use existing `UsersApiError` status/code information to choose safe localized messages.
- Do not directly render raw backend error payloads, exception details, stack traces, or arbitrary `error.message` values when doing so would bypass localization or disclose sensitive information.
- A language switch while an error or success notice is visible should update its presentation through the same translation key/state, without retrying the request or changing request outcome.

## 10. Responsive and Accessibility Requirements

- Preserve the existing responsive layouts for login, registration, user list, profile, and dialogs.
- The language selector must fit desktop, tablet, and mobile layouts without unnecessary overflow.
- All translated buttons, labels, placeholders, headings, dialogs, tooltips, `aria-label`s, and status messages must remain understandable and associated with their controls.
- Preserve MUI keyboard navigation, visible focus, dialog focus trapping, focus return, and screen-reader semantics.
- Translated text must not be clipped or cause action controls to become unusable at narrow widths.

## 11. API and Backend Impact

No API or Laravel changes are required.

- Do not change routes, request payloads, response contracts, authentication, authorization, profile, registration, logout, user-list, or change-password endpoints.
- Do not send a language field to the backend unless a later specification explicitly adds that requirement.
- The selected language is frontend UI state only.

## 12. Expected Files

Likely new files:

- `frontend/src/i18n/translations.js`
- `frontend/src/i18n/LanguageContext.jsx`
- `frontend/src/i18n/errorMessages.js` (if needed by the final implementation)
- `frontend/src/components/common/LanguageSwitcher.jsx`

Likely modified files:

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/App.css` and/or the relevant existing stylesheet
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/RegisterPage.jsx`
- `frontend/src/pages/UserListPage.jsx`
- `frontend/src/pages/UserProfilePage.jsx`
- Existing auth, user, profile, and dialog components containing visible or accessibility text.

Do not modify Laravel files, API service behavior, unrelated backend code, or generated storage artifacts.

## 13. Behavior Preservation

The feature must preserve:

- Login, registration, logout, and automatic authentication after successful registration.
- Token storage/removal and 401 session-expiration handling.
- User list search, pagination, refresh, loading, and empty states.
- Edit, delete, role-change, authorization, and profile behavior.
- Photo replacement/removal and profile cleanup behavior.
- Change Password behavior, including safe errors and post-success authentication handling.
- Existing Material UI styling and responsive behavior, apart from the minimal space needed for the language selector.

## 14. Testing and Verification

Because no frontend test runner is currently configured, verify the implementation with focused manual checks and the available project commands:

- `npm run lint`
- `npm run build`
- `php artisan test`
- `git diff --check`

Manual scenarios must cover:

- First load defaults to English.
- Valid `en`/`ja` selections persist across reloads.
- Invalid or unavailable stored language falls back to English.
- Switching language updates all visible and accessibility text without resetting page state or forms.
- Login, registration, logout, session expiration, profile, list actions, and change-password flows show localized loading/success/error/validation states.
- Network, 401, 403, not-found, validation, malformed-response, and generic failure paths remain safe and localized.
- User values and raw role values are not translated or changed.
- No token, password, file, object URL, raw payload, stack trace, or filesystem path appears in the UI or language storage.
- Desktop, tablet, mobile, keyboard, focus, dialog, and screen-reader behavior remains usable.

## 15. Acceptance Criteria

- The UI supports exactly English and Japanese.
- The selected language is available immediately throughout the application and persists under `localStorage["language"]`.
- All frontend-owned visible and accessibility text is translated, including dialogs, validation, loading, errors, and empty states.
- Missing/invalid translation data cannot crash the application and safely falls back to English.
- User data, role values, API behavior, and security-sensitive values are unchanged.
- Authentication, authorization, User List Actions, logout, profile, registration, photo handling, and Change Password behavior remain intact.
- No backend files, new external dependencies, React Router, or new global state library are introduced.
- Lint, build, Laravel tests, and `git diff --check` pass, or any pre-existing/environmental failures are clearly reported.

## 16. Implementation Plan

1. Add the supported-language dictionary and safe lookup helpers.
2. Add the language context/provider with persistence and fallback behavior.
3. Add the reusable Material UI language selector and place it in unauthenticated and authenticated shells.
4. Replace hard-coded frontend text with semantic translation keys across pages, forms, tables, dialogs, profile UI, and API error presentation.
5. Verify interpolation, role/data preservation, sensitive-data safety, responsive layout, and state preservation during switching.
6. Run lint, build, Laravel tests, and `git diff --check`, then inspect the final diff for unrelated changes.

## 17. Open Questions and Assumptions

- This specification assumes the requested scope is frontend UI localization only; backend localization and persisted user language preferences are out of scope.
- English is the default and fallback language because it is the current UI language.
- The existing no-test-runner frontend setup remains unchanged; automated frontend tests may be added only if a future project decision introduces a test framework.
- The implementation should preserve current component boundaries unless a small extraction is required to centralize translation or error mapping.
