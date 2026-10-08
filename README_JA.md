[English](README.md) | [日本語](README_JA.md)

# User Management System

ユーザー認証・プロフィール管理・ロール管理を備えた、ポートフォリオ向けのフルスタック Web アプリケーションです。React 製のフロントエンドから Laravel の REST API を呼び出し、ユーザー管理、プロフィール画像、検索、ページネーションを実装しています。

## プロジェクト概要

認証済みユーザー向けの管理ワークスペースを提供します。ユーザーはアカウント登録、ログイン、ユーザー一覧の閲覧、自分のプロフィール編集、パスワード変更を行えます。管理者はポリシーで保護された API を通じて、他ユーザーのプロフィールやロール、削除を管理できます。

リポジトリは次の 2 つのアプリケーションで構成されています。

- `frontend/`: React + Vite + Material UI のクライアント
- `backend/`: Laravel の JSON API と永続化処理

## デモ / スクリーンショット

現在の UI は英語と日本語の両方に対応しています。画像一覧は [`docs/images/README.md`](docs/images/README.md) を参照してください。

| 画面 | 英語 | 日本語 |
| --- | --- | --- |
| ログイン | <img src="docs/images/login-eng.png" alt="英語ログイン画面" width="420"> | <img src="docs/images/login-jp.png" alt="日本語ログイン画面" width="420"> |
| ユーザー一覧 | <img src="docs/images/userlist-eng.png" alt="英語ユーザー一覧" width="420"> | <img src="docs/images/userlist.png" alt="日本語ユーザー一覧" width="420"> |

## デモアカウント

| 権限 | メールアドレス | パスワード |
| --- | --- | --- |
| 管理者 | admin@example.com | password |
| 一般ユーザー | user@example.com | password |

これらのアカウントは、ローカル開発、テスト、デモンストレーション目的でのみ使用してください。

## 主な機能

- Sanctum の Bearer トークンによる認証
- 住所とプロフィール画像に対応したユーザー登録
- 名前・メールアドレス検索とサーバーサイドページネーション
- 権限に応じたプロフィール閲覧・編集
- プロフィール画像のアップロード、差し替え、削除
- トークン無効化を伴うパスワード変更
- API における管理者限定のユーザー作成、削除、ロール変更
- 英語・日本語 UI と選択言語の保持
- クライアント側・サーバー側のバリデーションとエラー表示

## 技術スタック

| レイヤー | 技術 |
| --- | --- |
| フロントエンド | React 19、Vite 8、Material UI 9、JavaScript |
| バックエンド | PHP 8.3 以上、Laravel 13、Laravel Sanctum 4 |
| データ | Eloquent ORM、標準設定は SQLite（MySQL/MariaDB/PostgreSQL/SQL Server の設定も用意） |
| ファイル | Laravel の public filesystem disk（プロフィール画像） |
| テスト | PHPUnit 12 の Feature/Unit テスト、フロントエンドは Oxlint を利用可能 |

## システムアーキテクチャ

```text
ブラウザ
  └─ React/Vite UI
       └─ Bearer トークン付き REST/JSON リクエスト
            └─ Laravel API ルート
                 ├─ Form Request：入力バリデーション
                 ├─ Policy/Gate：認可
                 ├─ Controller + API Resource：レスポンス生成
                 ├─ Eloquent User モデル
                 └─ SQLite/MySQL など + プロフィール画像ストレージ
```

フロントエンドは `VITE_API_BASE_URL` を参照し、Vite の API プロキシは設定していません。ローカルでは Laravel を `http://127.0.0.1:8000` で起動し、フロントエンドからその URL を参照します。

## 認証

- `POST /api/register` でユーザーを登録し、Sanctum トークンを返します。
- `POST /api/login` で認証し、Sanctum トークンを返します。
- フロントエンドはトークンを `localStorage` に保存し、`Authorization: Bearer <token>` として送信します。
- `GET /api/me` で現在のユーザーを取得できます。
- `POST /api/logout` で現在のアクセストークンを無効化します。
- `POST /api/change-password` はパスワード変更後、そのユーザーの全トークンを無効化します。

## 認可（Admin / User）

認可は `UserPolicy` と各コントローラーの `Gate::authorize` によって実装しています。

| 操作 | User | Admin |
| --- | ---: | ---: |
| ページ分割されたユーザー一覧の閲覧 | 可 | 可 |
| 詳細プロフィールの閲覧 | 自分のみ | 全ユーザー |
| プロフィール更新 | 自分のみ | 全ユーザー |
| `POST /api/users` によるユーザー作成 | 不可 | 可 |
| ロール変更 | 不可 | 可 |
| ユーザー削除 | 不可 | 可 |
| 自分のパスワード変更 | 可 | 可 |

ユーザー一覧はログイン済みユーザー全員が取得できます。一方、詳細プロフィールの閲覧と更新・削除などの変更操作は Policy で制御しています。

## ユーザー管理

ユーザー一覧にはプロフィール画像、名前、メールアドレス、ロール、住所、アクションを表示します。フロントエンドではプロフィール閲覧、管理者によるロール変更、削除に対応しています。プロフィール画面から自身の情報を編集でき、バックエンドには管理者限定のユーザー作成 API もあります。

## Registration（ユーザー登録）

登録フォームでは、名前、メールアドレス、パスワード、確認用パスワード、住所、任意のプロフィール画像を入力できます。API 側ではメールアドレスの一意性、8 文字以上のパスワード、確認値の一致、画像形式、2 MB のサイズ上限を検証します。クライアントからの `role` 指定は禁止され、新規ユーザーは `user` ロールになります。

登録成功時にはユーザー情報とトークンを返すため、登録直後にログイン済み画面へ遷移できます。

## 検索とページネーション

`GET /api/users` は次のクエリパラメータに対応しています。

- `search`: ユーザー名またはメールアドレスで検索
- `page`: 取得するページ番号

バックエンドは 1 ページあたり 5 件でページ分割し、ページ情報を返します。フロントエンドは検索時に 1 ページ目へ戻し、該当結果がない場合は空状態を表示します。

## ユーザープロフィール

プロフィール画面では、名前、メールアドレス、住所、ロール、アバターを表示します。一般ユーザーは自分のプロフィールを編集でき、管理者は他ユーザーの閲覧・編集も可能です。パスワード変更操作はログイン中の本人のプロフィールにのみ表示されます。

## プロフィール画像

登録時およびプロフィール更新時に、JPEG・PNG・WebP の画像を 2 MB 以下でアップロードできます。画像は Laravel の `public` ディスクの `profile-photos` 配下へ保存し、`UserResource` が公開 URL に変換して返します。差し替え・削除時には古いファイルを削除し、データベース更新に失敗した場合も新しく保存したファイルを後処理します。

## パスワード変更

現在のパスワード、新しいパスワード（8 文字以上）、確認用パスワードが必要です。現在と同じパスワードへの変更は拒否します。変更成功後は全アクセストークンを削除するため、フロントエンドは再ログイン画面へ戻ります。

## ロール管理

ロールは `admin` と `user` に限定しています。`PATCH /api/users/{user}/role` を呼び出せるのは管理者だけです。プロフィール更新と一般ユーザー登録からロールを変更することはできません。フロントエンドには管理者向けのロール選択ダイアログがあります。

## English / Japanese UI Support（英語・日本語 UI 対応）

React クライアントは英語（`en`）と日本語（`ja`）に対応しています。初期言語は英語です。ログイン・登録、ユーザー一覧、プロフィール画面から言語を切り替えられ、選択結果は `localStorage` に保存します。共通ラベルだけでなく、バリデーション、認可、ネットワーク、API エラーの表示も共有 i18n コンテキストで管理しています。

## バリデーションとエラーハンドリング

- React 側で必須項目、メール形式、パスワード長、確認値、画像形式・サイズを送信前に検証します。
- Laravel の Form Request で登録、プロフィール更新、ユーザー作成、パスワード変更をサーバー側でも検証します。
- `role`、`password`、`user_id` などの保護対象フィールドは該当リクエストで明示的に禁止しています。
- フロントエンドはネットワークエラー、不正なレスポンス、HTTP エラーを `UsersApiError` に正規化し、再試行、空状態、未認証、バリデーションの状態を表示します。
- API は `201`、`401`、`403`、`404`、`422` など、処理内容に応じた JSON レスポンスを返します。

## セキュリティ

- 認証が必要な API ルートを Laravel Sanctum で保護しています。
- パスワードはハッシュ化し、ユーザーのシリアライズ結果から非表示にしています。
- メールアドレスの一意性、入力値、アップロード画像をサーバー側で検証します。
- Policy により、プロフィール編集、ロール変更、削除の権限を制御します。
- 登録時の管理者ロール自己設定を禁止しています。
- プロフィール画像は検証済みのディスクへ保存し、差し替え・削除時の不要ファイルを整理します。

現在のフロントエンドは実装に合わせて Bearer トークンを `localStorage` に保存しています。本番運用では HTTPS を前提とし、XSS 対策や CSP を含めたトークン保管方式のレビューが必要です。

## 主な API エンドポイント

`/api` 以下は `auth:sanctum` が付いていないものを除き、認証が必要です。

| Method | Endpoint | 権限 | 用途 |
| --- | --- | --- | --- |
| `POST` | `/api/register` | 公開 | ユーザー登録とトークン発行 |
| `POST` | `/api/login` | 公開 | ログインとトークン発行 |
| `GET` | `/api/me` | 認証済み | 現在のユーザー取得 |
| `POST` | `/api/logout` | 認証済み | 現在のトークン無効化 |
| `POST` | `/api/change-password` | 認証済み | パスワード変更と全トークン無効化 |
| `GET` | `/api/users` | 認証済み | ユーザー一覧・検索・ページネーション |
| `POST` | `/api/users` | Admin | ユーザー作成 |
| `GET` | `/api/users/{user}` | 本人/Admin | プロフィール取得 |
| `PUT/PATCH` | `/api/users/{user}` | 本人/Admin | プロフィール・画像更新 |
| `DELETE` | `/api/users/{user}` | Admin | ユーザー削除 |
| `PATCH` | `/api/users/{user}/role` | Admin | `admin`/`user` ロール変更 |

## テスト

バックエンドの検証結果は次のとおりです。

```text
php artisan test --compact
53 tests, 159 assertions
```

`backend/tests/Feature/AuthApiTest.php` と `backend/tests/Feature/UserApiTest.php` で、認証、バリデーション、認可、検索、ページネーション、プロフィール画像、ロール変更、削除、パスワード変更時のトークン無効化を検証しています。フロントエンドには `npm run lint` と `npm run build` はありますが、自動テスト用の npm script は定義されていません。

## ディレクトリ構成

```text
.
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Requests/
│   │   ├── Http/Resources/
│   │   ├── Middleware/
│   │   ├── Models/
│   │   └── Policies/
│   ├── database/migrations/ factories/ seeders/
│   ├── routes/api.php
│   └── tests/Feature/ tests/Unit/
├── frontend/
│   └── src/
│       ├── components/
│       ├── i18n/
│       ├── pages/
│       └── services/
└── docs/images/
```

## ローカルセットアップ

### バックエンド

必要環境は PHP 8.3 以上、Composer、Laravel が対応するデータベースです。ローカルでは SQLite を使用できます。

```bash
cd backend
composer install
cp .env.example .env
touch database/database.sqlite
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

Seeder はローカル開発用にサンプルユーザー（管理者・一般ユーザーを含む）を作成します。本番環境では Seeder の認証情報を使用しないでください。

### フロントエンド

別のターミナルで実行します。

```bash
cd frontend
npm install
```

`frontend/.env` を作成し、バックエンド URL を設定します。

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Vite 開発サーバーを起動します。

```bash
npm run dev
```

本番用のビルドは `npm run build` です。生成物は `frontend/dist/` に出力され、Laravel API のデプロイ成果物とは分離されています。

## 設計・実装で工夫した点

- React クライアントと Laravel API を分離し、認証・認可の責務を明確にしています。
- 操作ごとの Form Request で入力ルールを整理し、API Resource で公開するユーザー情報と画像 URL の形式を統一しています。
- UI の状態だけに依存せず、コントローラーの操作単位で Policy を実行し、API 側でも権限を検証しています。
- プロフィール画像の差し替えをトランザクションと組み合わせ、古いファイルや更新途中のファイルが残りにくいようにしています。
- フロントエンドではレスポンスとエラーを正規化し、セッション切れ、空検索結果、再試行可能なエラーを個別に扱っています。
- 共通 i18n コンテキストにより、認証・一覧・プロフィール画面でラベルとエラーメッセージの翻訳を一貫させています。

## 今後の改善案

以下は現時点では未実装で、次の改善候補です。

- フロントエンドの単体・コンポーネントテストと、ブラウザ E2E テストの追加
- メールアドレス認証、パスワードリセット、アカウント復旧フローの追加
- HttpOnly Cookie を含む本番向け認証方式の検討と、トークン保管方針の明文化
- 監査ログ、レート制限、本番運用向けのより細かな権限設定
- バックエンドテスト、フロントエンド lint、プロダクションビルドを実行する CI の追加
