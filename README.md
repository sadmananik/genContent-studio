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

Enable the project Git hooks so Prettier runs before each commit:

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

## MongoDB Atlas Database

The backend uses MongoDB Atlas as the cloud database and connects with Mongoose.

1. Create or sign in to a MongoDB Atlas account.
2. Create an Atlas project for GenContent Studio.
3. Create a database cluster.
4. Create a dedicated database user with a username and strong password.
5. Configure Network Access in Atlas. For development, add your current IP address. Avoid `0.0.0.0/0` unless you specifically need temporary broad access.
6. Copy the Atlas connection string and set the database name to `gencontent_studio`.
7. Copy the backend env example and add your real connection string locally:

```bash
cp packages/backend/.env.example packages/backend/.env
```

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/gencontent_studio?retryWrites=true&w=majority
```

Do not commit `packages/backend/.env` or any real credentials. The repository only keeps placeholders in `packages/backend/.env.example`.

Mongoose is already installed in the backend workspace. If dependencies need to be restored, run:

```bash
yarn install
```

The backend connects to MongoDB before starting the Express server. Database connection errors are logged and stop startup so database-dependent routes are not served without a working connection.

Check backend and database status:

```bash
curl http://localhost:4000/api/health
```

Expected response when connected:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Environment

Backend environment variables live in `packages/backend/.env`:

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=
MONGODB_URI=your_mongodb_atlas_connection_string
```
