# Cypress End-to-End Testing

The E2E suite verifies the main GenContent Studio user journeys against a dedicated test backend and MongoDB database. It must never use the normal development or production database.

## Required Test Secrets

Do not commit credentials. Configure these locally in `packages/backend/.env.test` or in GitHub Actions repository secrets:

```env
NODE_ENV=e2e
MONGODB_URI_TEST=<dedicated-test-database-uri>
E2E_TEST_SECRET=<test-only-secret>
AUTH_TOKEN_SECRET=<test-only-auth-secret>
FRONTEND_ORIGIN=http://localhost:3000
EMAIL_DELIVERY_MODE=console
OPENAI_TEST_MODE=true
```

For GitHub Actions, add:

- `MONGODB_URI_TEST`: the dedicated test MongoDB connection URI.
- `E2E_TEST_SECRET`: a random value used only by the test mailbox route.
- `AUTH_TOKEN_SECRET_TEST`: a random JWT secret used only by E2E runs.

The workflow maps `AUTH_TOKEN_SECRET_TEST` to the backend's `AUTH_TOKEN_SECRET` environment variable. Never place a MongoDB URI, password, JWT secret, or email credential directly in YAML or committed files.

## Database Safety

When `NODE_ENV=e2e`, the backend selects `MONGODB_URI_TEST`. If that variable is missing, startup fails instead of falling back to `MONGODB_URI`. Normal development continues to use `MONGODB_URI`.

Each run receives a unique ID such as `e2e_12345_1`. Test users use the ID in their email address and test projects use it in their title. Cleanup deletes only records belonging to that run and verifies that matching records are gone.

The E2E mailbox is available only when `NODE_ENV=e2e` and the request includes the matching `x-e2e-test-secret` header:

```http
GET    /api/test/mailbox
DELETE /api/test/mailbox
```

Email delivery is forced into the in-memory mailbox during E2E runs. No real email is sent.

## Running Locally

Install dependencies:

```bash
yarn install
cp packages/backend/.env.test.example packages/backend/.env.test
```

Set `MONGODB_URI_TEST`, `E2E_TEST_SECRET`, and `AUTH_TOKEN_SECRET` in `.env.test`, then start services with the same E2E environment:

```bash
NODE_ENV=e2e yarn workspace @gencontent/backend start
FRONTEND_URL=http://localhost:3000 API_URL=http://localhost:4000 yarn test:e2e
```

In separate terminals, start the frontend with `yarn workspace @gencontent/frontend dev`. The browser suite can be opened interactively with:

```bash
yarn test:e2e:open
```

Run cleanup for a known run ID:

```bash
MONGODB_URI_TEST="..." yarn test:e2e:cleanup e2e_<run-id>
```

## Test Structure

```text
cypress/
  e2e/
    auth/
    projects/
    ai/
    sharing/
    templates/
    settings/
  fixtures/test-data.json
  support/commands.js
  support/e2e.js
cypress.config.js
```

`test-data.json` contains reusable non-secret names, passwords, project defaults, and deterministic AI response text. The run ID is added by Cypress so parallel runs do not reuse these records.

Use API commands to create supporting users/projects and UI interactions to verify the behavior under test. Use `cy.intercept` for AI requests so tests never spend real OpenAI credits.

## Current Coverage

The initial suite covers:

- Registration, captured verification email, verification, and login.
- Test-user/project API setup and text workspace opening.
- Mocked AI text generation.
- Settings appearance page availability.

The folder structure is ready for expanded specs covering password reset, change password, image persistence, sharing, permissions, shared projects, templates, exports, audit history, and AI response actions.

## CI Workflow

`.github/workflows/e2e.yml` runs on pushes and pull requests targeting `main`. It:

1. Installs dependencies.
2. Verifies required secrets exist.
3. Generates a unique run ID.
4. Starts the E2E backend and frontend.
5. Waits for both services.
6. Runs Cypress.
7. Attempts cleanup even when tests fail.

The test backend is separate from production because it requires `NODE_ENV=e2e` and `MONGODB_URI_TEST`.

## Troubleshooting

- **Backend refuses to start:** set `MONGODB_URI_TEST`, `E2E_TEST_SECRET`, and `AUTH_TOKEN_SECRET`.
- **Cypress cannot connect:** confirm frontend and backend are running on ports 3000 and 4000.
- **Verification link missing:** confirm `EMAIL_DELIVERY_MODE=console` and use the protected test mailbox endpoint.
- **Cleanup leaves records:** run the cleanup command with the exact run ID and inspect its reported collections.
- **Real AI/email activity appears:** stop the run and check that `NODE_ENV=e2e`, `OPENAI_TEST_MODE=true`, and `EMAIL_DELIVERY_MODE=console` are set.
