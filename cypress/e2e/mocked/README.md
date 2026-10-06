# Mocked Cypress browser tests

Run from the repository root with Node.js 24:

```sh
yarn install --frozen-lockfile
yarn test:frontend:browser
# Run one spec:
yarn test:frontend:browser --spec cypress/e2e/mocked/auth.cy.js
```

The command starts Next.js on `127.0.0.1:3100`, waits for readiness, runs headless Cypress, and stops the server even if tests fail. Port 3100 must be free. Test builds use `.next-integration` so they do not overwrite the normal `.next` build. The initial Cypress installation requires a binary download; Linux hosts need Cypress's browser system dependencies (GitHub's Ubuntu runner provides them).

This suite uses real pages, React components, Zustand state, browser storage, and the API client. Every API response is intercepted in the browser; unexpected API calls fail the test. No backend, MongoDB, email provider, AI key, or test-account credentials are needed. Socket.IO connections are intercepted as unavailable. The default `yarn test:e2e` command includes this folder alongside the live-backend tests. Only this folder enables the mocked support; the existing live-backend specs retain their original support and credentials requirements.

| Spec              | Coverage                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.cy.js`      | Login, logout, persistent sessions, protected routes, expired sessions, registration validation, password recovery/reset, verification                      |
| `projects.cy.js`  | Dashboard data, project creation/validation, editing, deletion, publishing, loading and server errors                                                       |
| `editor.cy.js`    | Text generation/history, saving, failed generation/save, viewer permissions, sharing invitations, image canvas rendering                                    |
| `templates.cy.js` | Preview/use, favourites, up/down votes, failed voting, search/empty results                                                                                 |
| `pages.cy.js`     | Landing navigation, profile updates/errors, settings/theme/password changes, AI favourites, shared projects/leaving, static history and collaboration pages |

The chat-history and collaboration routes currently show static demo content, so their tests check rendering only. Image-editor coverage checks canvas initialization; it does not validate Fabric drawing operations. Realtime multi-user synchronisation and real backend integration belong in the separate end-to-end suite.

The Cypress E2E GitHub Actions workflow runs all specs under `cypress/e2e`, including this folder, on pull requests to `main` and pushes to `main`. It uploads failure screenshots from `cypress/screenshots`. The separate Frontend tests workflow runs only Jest. Standalone runs with `yarn test:frontend:browser` write screenshots to the ignored `cypress/artifacts/frontend` directory.
