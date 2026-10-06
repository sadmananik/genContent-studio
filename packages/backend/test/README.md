# Backend tests

Use Node.js 24 and install dependencies from the repository root with `yarn install --frozen-lockfile`.

```sh
yarn test:backend
yarn workspace @gencontent/backend test:unit
yarn workspace @gencontent/backend test:integration
```

Tests use Node's built-in test runner. Unit tests cover string and ObjectId validation, token integrity and expiry, and project edit permissions. Integration tests exercise the real Express routes, middleware, controllers, and Mongoose models over HTTP.

The API suite covers registration, verification, duplicate accounts, password hashing, login, single-use password reset, protected endpoints, project CRUD and ownership, text persistence and cleanup, and viewer/editor access to content and AI generation. Additional scenarios cover publishing and using templates, public/private visibility, creator-only management, per-user favourites, upvote/downvote toggling and switching, and template deletion cleanup. Sharing scenarios cover existing-user invitations, permission upgrades/downgrades, owner-only sharing, access revocation, leaving projects, and pending invitations applied after email verification.

Email delivery and AI generation are mocked before importing the app; no external API keys or email credentials are needed.

Each integration run starts its own disposable MongoDB process using `mongodb-memory-server`, binds HTTP to an available loopback port, and clears only that temporary database between tests. It does not load `.env` files or use an existing MongoDB URI. MongoDB and HTTP are stopped after the suite, including failed tests. The first install/run requires internet access to download a MongoDB binary and permission to start local processes and listen on loopback ports.

`src/app.js` creates the app without starting a database connection or listener. Production startup remains in `src/server.js`, including environment loading and Socket.IO setup. Realtime collaboration is not covered by this suite.

The Backend tests GitHub Actions workflow runs on pull requests to main and pushes to main without repository secrets.
