# GenContent Studio

AI-driven content creation platform for the COIT20273 capstone project.

## Copyright

Copyright (c) 2026 Sadman Anik, Sravya Matta, and Akramul Ratul. All rights reserved.

This repository is publicly visible for project collaboration and assessment, but it is not open source. Copying, modifying, redistributing, sublicensing, selling, or using this code requires prior written permission from all three copyright holders. See [LICENSE](LICENSE).

GitHub public repositories can still be viewed and forked by platform users. The copyright notice and proprietary license state that unauthorised reuse is not permitted; they do not technically prevent GitHub access or copying.

## Project Structure

```text
genContent-studio/
  packages/
    frontend/   Next.js web application
    backend/    Node.js Express API
```

## Documentation

- [User Guide](docs/user-guide.md)
- [Feature List](docs/feature-list.md)
- [Developer Guide](docs/developer-guide.md)
- [Documentation index](docs/README.md)

## Getting Started

Use Node.js LTS with NVM:

```bash
nvm install
nvm use
```

Enable Yarn:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

Check your versions:

```bash
node --version
yarn --version
```

Install dependencies from the repository root:

```bash
yarn install
```

Enable the project Git hooks so Prettier, ESLint, and the frontend build run before each commit:

```bash
yarn setup:hooks
```

Run the frontend and backend together:

```bash
yarn dev
```

Default local URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Environment

Copy the backend env example before wiring the ChatGPT API:

```bash
cp packages/backend/.env.example packages/backend/.env
```
