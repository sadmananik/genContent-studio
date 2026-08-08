# GenContent Studio

AI-driven content creation platform for the COIT20273 capstone project.

## Project Structure

```text
genContent-studio/
  packages/
    frontend/   Next.js web application
    backend/    Node.js Express API
```

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
