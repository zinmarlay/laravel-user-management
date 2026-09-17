# User Management System

React + Vite + Material UI を使用した User Management System のフロントエンドです。

## Features

- User Login
- User List
- User Search
- User Pagination
- User Edit
- User Delete
- User Role Change
- Authentication
- Authorization
- API Error Handling

## Tech Stack

- React
- Vite
- Material UI
- JavaScript
- REST API

## Requirements

- Node.js
- npm
- Laravel Backend API

## Installation

    npm install

## Development

    npm run dev

## Lint

    npm run lint

## Production Build

    npm run build

## Test Login Accounts

### Admin Account

- Email: `admin@example.com`
- Password: `password`

### User Account

- Email: `user@example.com`
- Password: `password`

> These accounts are for local development and testing only.
> Do not use these credentials in production.

## Login

1. Start the Laravel backend.
2. Start the frontend with `npm run dev`.
3. Open the frontend in your browser.
4. Sign in using one of the test accounts above.

## Project Structure

    src/
    ├── components/
    │   ├── auth/
    │   └── users/
    ├── pages/
    │   ├── LoginPage.jsx
    │   └── UserListPage.jsx
    ├── services/
    │   ├── apiError.js
    │   ├── authApi.js
    │   └── usersApi.js
    ├── App.jsx
    └── App.css

## API

The frontend communicates with the Laravel backend through REST API endpoints.

Main endpoints:

    POST   /api/login
    GET    /api/users
    PUT    /api/users/{id}
    DELETE /api/users/{id}
    PATCH  /api/users/{id}/role

## Notes

This project is intended for development and learning purposes.
