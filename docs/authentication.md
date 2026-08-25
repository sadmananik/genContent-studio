# Authentication and Account Lifecycle

This document explains the account business logic used by GenContent Studio.

## Main actors

- Visitor: a person who has not signed in.
- Registered user: an account record in MongoDB.
- Verified user: a registered user with `emailVerified=true`.
- Authenticated user: a verified user with a valid Bearer token stored by the frontend.

## Frontend routes

- `/register`: creates a new account.
- `/login`: signs in a verified account.
- `/verify-email?token=...`: verifies a new account or allows resend.
- `/forgot-password`: requests a password reset email.
- `/reset-password?token=...`: accepts a new password.
- Protected app routes: wrapped by `ProtectedRoute`, which validates the saved token with `/api/users/me`.

## Backend endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/users/me
```

## Registration flow

1. User submits name, email, password, and optional profile data.
2. Backend trims the name and lowercases the email.
3. Password must be at least 8 characters.
4. Backend rejects duplicate emails with `409`.
5. Password is hashed with bcrypt.
6. A random verification token is generated, hashed with SHA-256, and stored on the user.
7. The raw token is sent by email as `/verify-email?token=...`.
8. User is created with `emailVerified=false`.
9. The frontend does not sign the user in after registration. It shows the check-email state.

Business rule: a registered account cannot sign in until email verification succeeds.

## Email verification flow

1. User opens `/verify-email?token=...`.
2. Frontend posts the token to `/api/auth/verify-email`.
3. Backend hashes the supplied token and finds an unexpired matching token hash.
4. On success, backend sets `emailVerified=true`.
5. Backend removes the verification token hash and expiry fields so the link cannot be reused.
6. Frontend shows success and links back to login.

Failure cases:

- Missing token: frontend displays an invalid link state.
- Expired or invalid token: backend returns a validation error.
- User can request a new verification email from the same screen.

## Resend verification flow

1. User enters an email address on the verification screen.
2. Frontend posts to `/api/auth/resend-verification`.
3. Backend always returns a generic response to avoid account enumeration.
4. If the account exists and is unverified, a new token replaces the previous token.
5. The new verification link expires according to `EMAIL_VERIFICATION_EXPIRES_IN_MINUTES`.

Business rule: already verified accounts do not receive another verification token from this flow.

## Login flow

1. User submits email, password, and optional remember-me.
2. Backend lowercases the email and checks the bcrypt password hash.
3. Backend rejects invalid credentials with `401`.
4. Backend rejects unverified accounts with `403`.
5. Backend returns serialized user data and a signed auth token.
6. Frontend stores the session through `saveAuthSession`.
7. Remember-me controls whether the session is persisted longer term.

Business rule: login never exposes whether a password or email was the specific failing field.

## Protected route flow

1. Protected pages read the stored token from the auth store.
2. If no token exists, frontend redirects to `/login`.
3. If a token exists, frontend calls `getAuthenticatedUser`.
4. `getAuthenticatedUser` calls `/api/users/me`.
5. A valid response refreshes user state and allows the page to render.
6. An invalid or expired session clears auth state and redirects to `/login`.

## Forgot password flow

1. User submits an email on `/forgot-password`.
2. Frontend posts to `/api/auth/forgot-password`.
3. Backend always returns a generic response to avoid account enumeration.
4. If the account exists, backend stores a hashed reset token and expiry.
5. The raw token is emailed as `/reset-password?token=...`.

Business rule: password reset email responses must not reveal whether an account exists.

## Reset password flow

1. User opens `/reset-password?token=...`.
2. User submits a new password.
3. Backend requires token and password.
4. Password must be at least 8 characters.
5. Backend hashes the supplied token and finds an unexpired matching reset token hash.
6. Backend replaces the password hash.
7. Backend removes the reset token hash and expiry fields.
8. Frontend clears any saved auth state and sends the user back to login.

Business rule: reset tokens are single-use and expire.

## Logout flow

1. Frontend clears saved auth state.
2. User, project, AI, and collaboration state are reset.
3. The user returns to an unauthenticated state.

## Email delivery

The backend email utility sends verification and reset emails. In local development, console delivery can be used so links appear in the backend terminal instead of going through SMTP.

Important environment variables:

```env
FRONTEND_ORIGIN=http://localhost:3000
AUTH_TOKEN_SECRET=replace-with-a-long-random-secret
AUTH_TOKEN_EXPIRES_IN_SECONDS=604800
EMAIL_VERIFICATION_EXPIRES_IN_MINUTES=5
PASSWORD_RESET_EXPIRES_IN_MINUTES=5
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

## Security notes

- Store only hashed passwords.
- Store only hashed verification and reset tokens.
- Clear one-time token fields after successful use.
- Use generic forgot-password and resend-verification responses.
- Keep auth token secrets out of frontend environment variables.
