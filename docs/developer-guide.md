# GenContent Studio Developer Guide

This guide explains how the current features are structured and how future developers should extend them. It is intended for maintenance, handover, debugging, and feature development.

## Technology And Repository Layout

The repository is a Lerna workspace with two packages:

```text
genContent-studio/
  packages/backend/     Express API, MongoDB models, authentication, Socket.IO
  packages/frontend/    Next.js application, workspaces, Zustand state
  docs/                 Product and implementation documentation
```

Main technologies:

- Frontend: Next.js App Router, React, Tailwind CSS, Zustand.
- Text editor: TipTap and ProseMirror.
- Image editor: Fabric.js.
- Backend: Node.js, Express, Mongoose.
- Database: MongoDB.
- Realtime: Socket.IO, Yjs, y-protocols.
- Authentication: signed Bearer tokens, bcrypt password hashes, hashed one-time email tokens.
- AI text service: OpenAI through the backend only.

Use Node.js LTS and Yarn 1.22.22. From the repository root:

```bash
yarn install
yarn dev
npm run build
```

The default development URLs are `http://localhost:3000` and `http://localhost:4000`.

Backend email and authentication settings are configured in `packages/backend/.env`:

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

## Frontend Architecture

### Routing

Protected routes are under `packages/frontend/src/app/(protected)`. The editor route receives query parameters such as:

```text
/editor?type=text&projectId=<id>
/editor?type=image&projectId=<id>
```

`EditorScreen` selects the Text or Image workspace. Shared layouts enforce authentication before the workspace renders.

### Shared state

`src/store/index.js` combines focused Zustand reducers:

- `authReducer`: session and authenticated user state.
- `projectReducer`: project lists, current project, and project updates.
- `aiReducer`: generation, chat history, favourites, and AI response mutations.
- `collaborationReducer`: active users, connection state, and collaboration errors.
- `templateReducer`: template lists, favourites, publishing, and cloning.
- `userReducer`: user lookup for sharing.

Use an existing reducer action for API calls rather than duplicating request and loading logic in a component.

### API client and authentication

`src/lib/apiClient.js` adds the saved Bearer token to API requests and normalizes API errors. Frontend code should never contain the backend secret or OpenAI key. The backend owns all privileged integrations.

## Authentication And Account Lifecycle

The frontend pages are in `src/app/(auth)` and the backend routes are in `src/routes/authRoutes.js`.

The backend:

1. Normalizes registration data.
2. Hashes passwords with bcrypt.
3. Hashes verification and reset tokens before storing them.
4. Sends raw one-time links by email.
5. Refuses login until email verification succeeds.
6. Returns a signed token after successful login.

The frontend stores the session through `saveAuthSession`. `ProtectedRoute` validates it against `GET /api/users/me`. Logout clears the session and local application state.

Never move password hashing, token signing, or OpenAI calls to the frontend.

## Project And Content Model

The main MongoDB models are:

- `User`: account, profile, verification, and password reset state.
- `Project`: title, type, category, owner, collaborators, and collaborator permissions.
- `TextContent`: one HTML document per text project.
- `ImageContent`: one canvas JSON document per image project.
- `AIChat`: prompt, response, content type, author, and favourite state.
- `Template`: reusable project metadata and starter content.
- `AuditLog`: immutable project activity snapshots.

Project access is checked by `findAccessibleProject`. Editing is checked by `requireProjectEditAccess`. Owner-only operations use `findProjectOwnedByUser` or an equivalent owner query.

Keep these checks on every new controller. Frontend `canEdit` values are interface state, not authorization.

## Text Workspace Flow

The text workspace is implemented in `components/screens/EditorScreen.js` and `components/text-workspace/TipTapEditor.js`.

1. The screen loads project metadata and saved `TextContent`.
2. TipTap is initialized with the saved HTML.
3. User edits trigger `onContentChange`.
4. Zustand or the save handler calls `PUT /api/text-content`.
5. The backend checks project type and edit access, then upserts one `TextContent` document.
6. Save status is updated in the workspace header.

TipTap formatting is handled by StarterKit, TextStyle, Color, FontSize, and Placeholder extensions. Keep editor-specific commands in `EditorToolbar` or the editor component rather than scattering ProseMirror transactions through the screen.

## Image Workspace Flow

The image workspace is implemented in `components/screens/ImageEditorScreen.js` and `components/image-workspace/FabricImageEditor.js`.

1. Fabric creates a fixed-size canvas.
2. The screen loads `GET /api/image-content/:projectId`.
3. Fabric restores `canvasState` with `loadFromJSON`.
4. Object modifications mark the workspace dirty.
5. Save calls `PUT /api/image-content` with `canvasState` and `generationPrompt`.
6. The backend checks project type and edit access, then upserts one `ImageContent` document.
7. Export uses Fabric `toDataURL` or `toJSON`.

The current image AI flow is deliberately isolated from the canvas contract. A future provider should return an image result that can be represented by the existing response/history and Fabric insertion interfaces.

## AI Generation And History

Text generation is exposed by `POST /api/ai/generate-text`. The backend validates project access, calls `openaiService.generateText`, and returns the generated result. The OpenAI key is read only from backend environment variables.

Saved AI history uses these routes:

```http
POST   /api/chats
GET    /api/projects/:projectId/chats
PATCH  /api/chats/:id
PATCH  /api/chats/:id/favourite
DELETE /api/chats/:id
```

`chatController.js` checks project access before every mutation. The frontend `aiReducer` updates the local history after each successful request. Personal favourites remain local to the current user and are not broadcast.

## Audit History Implementation

Audit records are implemented through:

- `models/AuditLog.js`.
- `services/auditService.js`.
- `controllers/auditController.js`.
- `GET /api/projects/:projectId/audit-history`.
- `POST /api/projects/:projectId/audit-history`.
- `components/common/AuditHistoryModal.js`.

### Security model

- `GET` requires the authenticated user to own the project.
- `POST` requires normal project edit access so collaborators can record workspace actions.
- The audit record stores the actor, action type, workspace, timestamp, and metadata snapshot.
- AIChat deletion writes audit records before deleting the chat.

### Action types

Defined in `constants/projects.js`:

```text
ai_prompt_submitted
ai_prompt_updated
ai_prompt_deleted
ai_response_generated
ai_response_updated
ai_response_deleted
ai_content_inserted
ai_content_saved
```

### Snapshot rule

Do not rely on `aiChatId` alone. Store prompt snapshots and reasonable response previews in `metadata`. `auditService.preview` normalizes whitespace and limits long strings to keep audit documents and the UI readable.

When adding a new audit action:

1. Add the action type constant.
2. Record it at the successful action boundary.
3. Include enough metadata to explain the action after related records change or are deleted.
4. Add display text and detail fields to `AuditHistoryModal`.
5. Verify that read access remains owner-only.

## Realtime Collaboration

`src/lib/collaboration.js` creates an authenticated Socket.IO connection, a Yjs document, and awareness state. The backend collaboration server joins users to `project:<projectId>` rooms.

### Text synchronization

TipTap uses the Yjs document through `@tiptap/extension-collaboration`. Local Yjs updates are sent as number arrays. The server validates the socket's current project and editor access before applying and relaying updates. Remote updates are applied with an `applyingRemoteUpdate` guard to prevent loops.

### Image synchronization

The image workspace uses the same provider with a `canvas:update` message containing Fabric JSON. The server:

- Rejects updates from sockets outside the project room.
- Rejects updates from non-Editors.
- Stores the latest in-memory canvas state for join-time delivery.
- Relays updates to the other room members.
- Updates the cached socket permission when a project permission changes.

Fabric uses an `applyingRemoteState` guard so remote JSON does not generate another outbound update or mark the local workspace dirty.

The in-memory image and Yjs states are not durable across a backend restart. MongoDB remains the durable source of saved content. A future durable collaboration snapshot can be added without changing the workspace UI contracts.

### Presence and project events

Awareness carries user name, ID, and colour. Project events include join, leave, presence, permission update, access revoke, and AI activity notifications. The backend broadcasts only approved event names through `isProjectEvent`.

When adding a new event:

1. Define its payload shape.
2. Add it to the approved event list if it is client-relayed.
3. Validate project/user scope in the server handler.
4. Update the relevant screen without trusting client-only permission state.
5. Document it in this Developer Guide under Realtime Collaboration.

## Sharing And Permissions

The owner manages collaborators through `PATCH /api/projects/:id/invite` and `PUT /api/projects/:id`. Collaborator permissions are stored in `Project.collaboratorPermissions` with `editor` or `viewer` values.

Permission changes are broadcast after the database update. The receiving workspace updates its local `project.accessLevel` and `project.canEdit`. The URL access query is only an entry hint; live server permission state is authoritative after the collaboration event arrives.

When testing permission changes, use two authenticated sessions:

1. Open the project as the collaborator.
2. Change the collaborator between Editor and Viewer as owner.
3. Confirm the toast, controls, and server enforcement all change.
4. Confirm a removed collaborator cannot rejoin.

## Templates

Templates are managed by `templateReducer.js`, template screens, and backend template controllers. Publishing stores reusable project data. Using a template creates a new independent project and does not copy collaborators or permissions.

Keep template visibility checks in the backend. A private template must never be exposed through public search, tag suggestions, or an old client-side reference.

Default system templates are seeded explicitly:

```bash
yarn workspace @gencontent/backend db:seed:templates
```

The seed script is safe to rerun because it uses each template's `systemKey`. Deleting a template must not break projects already created from it, and deleting a source project must not automatically delete its published template.

## Favourites And Shared Projects

AI response and template favourites are personal to the current user. They must not be broadcast through collaboration events and do not grant access to a project or private template. Stale favourites should be ignored when the referenced item is no longer accessible.

`FavoritesScreen.js` loads AI favourites through `GET /api/chats/favourites`. It formats each response with its project title, type, prompt preview, response preview, and workspace link. Users can copy or unfavourite a response from this page.

`TemplatesScreen.js` has separate Browse, Favorites, and Mine tabs. The Favorites tab loads `GET /api/templates/favorites`, while the template reducer keeps favourite state separate from template ownership and visibility. There is no project-favourites feature in the current implementation; do not describe project cards as favouritable unless that data model and API are added.

The shared projects route is `/shared`. It should list projects where the current user is a collaborator but not the owner. Opening a shared project uses the same editor route with its project type:

```text
/editor?type=text&projectId=<id>
/editor?type=image&projectId=<id>
```

The backend still checks access when loading the project and workspace content, so a stale shared-project card cannot bypass permissions.

## API Reference

### Auth and users

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/users/me
PATCH /api/users/me/password
```

### Projects and content

```http
POST   /api/projects
GET    /api/projects
GET    /api/projects/shared
GET    /api/projects/:id
PUT    /api/projects/:id
PATCH  /api/projects/:id/invite
DELETE /api/projects/:id/collaborators/me
DELETE /api/projects/:id
GET    /api/projects/:projectId/chats
GET    /api/projects/:projectId/audit-history
POST   /api/projects/:projectId/audit-history
GET    /api/text-content/:projectId
PUT    /api/text-content
GET    /api/image-content/:projectId
PUT    /api/image-content
```

### AI and templates

```http
POST   /api/ai/generate-text
POST   /api/chats
PATCH  /api/chats/:id
PATCH  /api/chats/:id/favourite
DELETE /api/chats/:id
GET    /api/chats/favourites
GET    /api/templates
GET    /api/templates/mine
GET    /api/templates/favorites
GET    /api/templates/recent
GET    /api/templates/tags
POST   /api/templates/projects/:projectId
GET    /api/templates/:id
PUT    /api/templates/:id
PATCH  /api/templates/:id/visibility
POST   /api/templates/:id/use
PUT    /api/templates/:id/favorite
DELETE /api/templates/:id/favorite
DELETE /api/templates/:id
```

## Testing And Validation

Before opening a pull request:

```bash
yarn prettier --check .
npm run build
```

For a focused frontend change:

```bash
npm run build --workspace @gencontent/frontend
```

For backend syntax and route changes:

```bash
npm run build --workspace @gencontent/backend
```

Manual collaboration checks should cover two browser sessions, reconnects, Editor/Viewer transitions, remote text edits, remote image edits, presence, and access revocation. Audit checks should cover owner access, collaborator denial, long prompt previews, update snapshots, and deletion after the AIChat row is gone.

## Extension Guidance

- Reuse `apiRequest`, Zustand reducers, existing access helpers, and shared workspace header components.
- Keep REST as the durable write path and Socket.IO as the live update path.
- Keep AI provider code behind backend services.
- Add snapshots when historical meaning would otherwise depend on a mutable or deleted record.
- Add focused documentation whenever an event, model, permission rule, or public endpoint changes.
- Avoid broad refactors in feature branches; preserve existing workspace behavior while extending the owning abstraction.
