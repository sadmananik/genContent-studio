# Jest component integration tests

Install dependencies from the repository root, then run:

```sh
yarn test:frontend
yarn workspace @gencontent/frontend test:watch
yarn workspace @gencontent/frontend test:coverage
# One file:
yarn test:frontend --runTestsByPath test/templates.test.js
```

Use Node.js 24. `jest.config.mjs` imports `nextJest` from `next/jest.js`, which handles JSX, Next.js transforms, styles, and assets. Tests run in jsdom with React Testing Library, jest-dom assertions, and user-event. No Next.js server, browser, backend, or database is started.

Page tests render the real components and retain the real Zustand actions and API client. `helpers.js` resets store/storage between tests and mocks `fetch` with explicit responses. Next.js router methods are mocked in `setup.js` so navigation can be asserted. Pending promises test loading states without arbitrary sleeps.

| File                 | Flows                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `auth.test.js`       | Login/loading/errors, remembered sessions, registration validation, recovery forms, protected routes, expired sessions, logout     |
| `projects.test.js`   | Dashboard, open/cancel create form, validation, create/edit, cancel/confirm delete, failed delete, close/submit publish modal      |
| `templates.test.js`  | Open/close preview, upvote counts, toggling and downvotes, pending/failed votes, favourites, cancel/confirm deletion, use template |
| `pages.test.js`      | Profile saves/errors, settings confirmation/cancellation, theme, shared-project details/leaving, AI favourites                     |
| `components.test.js` | AI prompt panel with real store actions, generated results/errors, quick-action style menus, outside-click dismissal               |
| `common.test.js`     | Password strength states, avatar initials/stacks, confirmation loading state, theme persistence and system preference changes      |

Assertions check visible DOM changes, request payloads, store changes, and navigation. Cancel flows check that no mutation request was sent. Tests do not replace page components or mock successful store actions.

The prompt panel uses a small controlled host; it does not test the full TipTap editor. Browser-only canvas, editor, and navigation coverage remains in `cypress/e2e/mocked`, runnable with `yarn test:frontend:browser`. Real backend integration remains in the other Cypress folders.

Only Jest runs in the Frontend tests GitHub Actions workflow for PRs to `main` and pushes to `main`. The Cypress E2E workflow runs all Cypress specs, including `cypress/e2e/mocked`. Coverage reports are written to the ignored `coverage/frontend` directory.
