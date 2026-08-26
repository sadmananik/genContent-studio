# Realtime Collaborative Workspaces

## Purpose

Realtime collaboration allows users who have access to the same project to see shared text edits and active participants without repeatedly refreshing the workspace. Personal AI history, favourites, and copied responses remain private to each user.

## Connection flow

1. The text editor loads the project and its saved content through the existing REST API.
2. The frontend creates a collaboration provider with the authenticated token and project ID.
3. The provider opens a Socket.IO connection to the backend and emits `project:join`.
4. The backend verifies the token, checks the user against the project owner and collaborators, and joins the socket to `project:<projectId>`.
5. The server returns the user access level, connected collaborators, and the current Yjs document update.
6. When the editor is closed or the project changes, the provider emits `project:leave` and disconnects.

## Permissions

Project access is checked when joining a room, and again for every document update:

- Owners have editor access and can manage sharing.
- Editors can modify the shared document and use AI actions allowed by the existing API.
- Viewers can receive document updates but cannot send `yjs:update` events.
- A removed collaborator cannot rejoin because the server checks the database on every join.

The backend is authoritative. Frontend `canEdit` state controls the interface, but it is not a security boundary.

## Document synchronization

TipTap uses `@tiptap/extension-collaboration` with a shared `Y.Doc`. Local Yjs updates are sent through Socket.IO as binary-compatible number arrays. The server applies each update to the in-memory project document and relays it to the other sockets in the room. Remote updates are applied to the local Yjs document without being sent back, preventing update loops.

The application does not send complete HTML documents over Socket.IO. Existing `PUT /api/text-content` persistence remains responsible for saving the current editor content to MongoDB. The in-memory Yjs document is rebuilt when the backend restarts, so durable Yjs snapshots can be added later if long-running offline recovery is required.

## Presence and awareness

Each provider publishes the current user identity and colour through Yjs awareness. Awareness updates use `yjs:awareness-update` and are relayed only to the current project room. Join, leave, and presence changes use:

- `project:user-joined`
- `project:user-left`
- `project:presence-updated`

The collaboration store keeps the active collaborator list separately from the project’s saved collaborator list.

## Socket events

### Client to server

- `project:join` with `{ projectId }`
- `project:leave`
- `yjs:update` with `{ projectId, update }`
- `yjs:sync-request` with `{ projectId }`
- `yjs:awareness-update` with `{ projectId, update }`
- `project:event` for approved project and AI event types

### Server to client

- `project:joined`
- `project:join-denied`
- `yjs:sync`
- `yjs:update`
- `yjs:awareness-update`
- `project:user-joined`
- `project:user-left`
- `project:presence-updated`
- `project:permission-updated`
- `project:access-revoked`
- `project:sharing-updated`
- `ai:response-created`, `ai:response-updated`, and `ai:response-deleted`

## REST and realtime responsibilities

REST remains responsible for authentication, loading projects, saving text content, loading AI history, and changing permissions. After successful REST mutations, the backend broadcasts an event to connected project members. This keeps database state authoritative while allowing open workspaces to update immediately.

## Reconnection and cleanup

Socket.IO reconnects using the authenticated token. On reconnect, the provider joins the project again and receives the current server document state. React cleanup destroys the provider, removes Yjs listeners, leaves the project room, and clears active collaborators.
