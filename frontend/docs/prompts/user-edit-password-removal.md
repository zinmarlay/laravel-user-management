We are continuing the existing User Management System project.

Please read and follow this prompt:

frontend/docs/prompts/user-edit-password-removal.md

Before creating the specification, inspect the existing frontend and Laravel backend implementation related to User Edit, authentication, authorization, validation, and password handling.

Based on the existing project architecture and this prompt, create:

frontend/docs/specs/user-edit-password-removal.md

Requirements:

- Do not implement any code yet.
- Do not modify existing source files.
- Do not modify Laravel backend files.
- Do not add dependencies.
- Do not commit anything.
- The specification must be based on the actual existing project.
- Keep Password Change and Admin Password Reset as separate future features.
- The current Edit User feature must continue supporting:
  - Name
  - Email
  - Address
- Password must no longer be part of the Edit User feature.
- Preserve the existing Edit User authorization, validation, API behavior, loading, error handling, and refresh behavior unless the existing architecture requires a documented change.

The specification should include:

1. Current architecture findings
2. Current Edit User behavior
3. Current password handling
4. Required UI changes
5. Frontend files to modify
6. Files that should remain unchanged
7. Backend/API impact
8. Validation and error-handling considerations
9. Security considerations
10. Acceptance criteria
11. Test scenarios
12. Implementation plan
13. Open questions or assumptions

Do not implement the feature yet.
Do not commit anything.