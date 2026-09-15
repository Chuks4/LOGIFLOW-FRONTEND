# LogiFlow Frontend

The LogiFlow frontend is a responsive Next.js application for logistics
management. It provides authentication screens, password recovery, a
role-aware dashboard shell, and centralized API handling.

## Requirements

- Node.js 20 or newer
- npm
- The LogiFlow backend running locally on port `8000`

## Getting started

Install dependencies:

```bash
npm install
```

Create or update `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

```bash
npm run dev      # Start the development server
npm run lint     # Run ESLint
npm run build    # Create a production build
npm run start    # Start the production server
```

## Routes

- `/` - Sign in
- `/register` - Create an account
- `/forgot-password` - Request a password reset email
- `/reset-password?token=...` - Set a new password
- `/verify-email?token=...` - Verify an email address
- `/dashboard` - Role-aware application dashboard

## Authentication

Authentication uses the backend JWT contract:

- Access tokens are returned by the login and refresh endpoints.
- Refresh tokens are stored by the backend as an HTTP-only cookie.
- The Axios client attaches the access token to protected requests.
- Expired access tokens are refreshed automatically.
- Failed refresh requests clear the local session and return the user to sign in.

Auth requests are organized in
[`src/services/axios/auth.service.ts`](./src/services/axios/auth.service.ts).
The shared Axios instance and interceptors are defined in
[`src/services/axios/client.ts`](./src/services/axios/client.ts).

## Role-based access

The dashboard navigation is filtered using the permissions stored in the
session. Role and permission helpers are defined in
[`src/lib/rbac.ts`](./src/lib/rbac.ts), while the dashboard shell is implemented
in [`src/components/DashboardShell.tsx`](./src/components/DashboardShell.tsx).

The frontend only controls visibility and navigation. The backend must remain
the final authorization boundary for every protected resource.

## Global notifications

API errors are surfaced through the global toast provider in
[`src/components/ToastProvider.tsx`](./src/components/ToastProvider.tsx).
