Implement the final Language Support feature for this Laravel + React User Management project.

Requirements:

1. Support exactly two UI languages:
    - English (en)
    - Japanese (ja)

2. On the Login Page, allow the user to select English or 日本語 BEFORE login.

3. Default language is English.

4. Save the selected language in:
   localStorage["language"]

5. The language must persist after:
    - Login
    - Logout
    - Browser refresh
    - Switching between Login and Register

6. After login, the selected language must apply to the entire application:
    - User List
    - Search
    - Profile
    - Edit Profile
    - Change Password
    - Delete dialog
    - Change Role dialog
    - Logout
    - Loading / Empty / Error / Success messages
    - Validation messages
    - Accessibility labels

7. Allow changing language while already logged in.
   Changing language must NOT:
    - logout the user
    - reload the page
    - change API data
    - change permissions
    - reset search/pagination/profile state

8. Do NOT add:
    - React Router
    - react-i18next / i18next
    - any external i18n library
    - state management library
    - form library

9. Use a lightweight React Context or another simple built-in React solution.

10. Create a centralized translation dictionary for English and Japanese.
    Use semantic keys such as:
    auth.login.title
    users.title
    profile.edit
    password.change
    common.cancel
    common.save

11. Translate ALL user-facing frontend text.
    Search the entire frontend source for hard-coded UI strings before implementation.

12. Translate natural Japanese UI text, for example:
    Sign in → ログイン
    Register → 新規登録
    User List → ユーザー一覧
    View Profile → プロフィールを見る
    Edit Profile → プロフィールを編集
    Change Password → パスワードを変更
    Delete → 削除
    Change Role → 権限を変更
    Logout → ログアウト
    Name → 名前
    Email → メールアドレス
    Address → 住所
    Admin → 管理者
    User → ユーザー
    Cancel → キャンセル
    Save → 保存
    Search → 検索

13. IMPORTANT:
    Do NOT translate database/user data.

    User names, email addresses, addresses, uploaded photos,
    IDs, and other stored user data must remain exactly as stored.

14. Role values must remain:
    admin
    user

    Only their displayed labels are translated.

15. API contracts and backend behavior should remain unchanged.
    Do not add a language column or backend language API.

16. Keep existing authentication, authorization, profile,
    change-password, delete, change-role, search and pagination behavior unchanged.

17. Translate frontend validation and API error messages safely.
    Do not display raw backend payloads or exception details.

18. Keep the UI responsive and accessible.
    Language buttons/selectors must work with keyboard and screen readers.

19. Before coding, inspect the existing source and identify all
    user-facing hard-coded strings.

20. Then implement the feature using the smallest clean architecture.

21. Create:
    frontend/docs/specs/language-support.md

    Document the actual implementation and translation architecture.

22. Run:
    npm run lint
    npm run build
    php artisan test
    git diff --check

23. Do NOT commit or push anything.

After implementation, report:

- files changed
- translation architecture
- language persistence behavior
- test results
- any remaining hard-coded user-facing strings
