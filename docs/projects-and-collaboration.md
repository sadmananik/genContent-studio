# Projects, Workspaces, and Collaboration

This document explains project ownership, workspace content, AI history, and the future Shared with Me page rules.

## Core models

- `Project`: title, type, category, description, owner, collaborators.
- `TextContent`: one saved text workspace document per text project.
- `ImageContent`: one saved image workspace document per image project.
- `AIChat`: generated AI prompt/response history connected to a project and user.

## Project types

Projects have one of two types:

- `text`: opens the TipTap text workspace and saves through `/api/text-content`.
- `image`: opens the image workspace and saves through `/api/image-content`.

Business rule: text content cannot be saved to image projects, and image content cannot be saved to text projects.

## Access rules

Project access is controlled by owner and collaborator membership.

Owners can:

- view the project
- update project metadata
- save text or image content
- invite collaborators
- delete the project

Collaborators can:

- view the project
- open the correct workspace
- save text or image content
- view project AI history
- create/update/favourite/delete AI history entries if they can access the project

Collaborators cannot:

- invite other collaborators through the owner-only invite endpoint
- delete the project through the owner-only delete endpoint

## Project create flow

1. Frontend posts project data to `POST /api/projects`.
2. Backend requires a non-empty title.
3. Backend requires `type` to be `text` or `image`.
4. Category defaults to `Other`.
5. Description defaults to an empty string.
6. Owner is set to the authenticated user.
7. Collaborator ids are validated, de-duplicated, and checked against existing users.
8. The owner is not added as their own collaborator.
9. Backend returns the project with populated owner and collaborator details.

## Project list flow

`GET /api/projects` returns projects where the current user is either:

- the owner
- listed in `collaborators`

The frontend project list can separate these into owned projects and shared projects by comparing `project.owner._id` with the current user id.

## Shared with Me page

Current route:

```text
/shared
```

Current state:

- Protected route.
- Uses `PlaceholderPage`.
- Placeholder copy: `Protected route placeholder for future workspace content.`

Future populated state should show projects where:

```js
project.owner._id !== currentUser.id && project.collaborators includes currentUser.id
```

Each shared project card should show:

- project title
- project type
- category
- owner name and email
- last updated date
- collaborator count
- open project action

Opening rules:

- text shared project opens `/editor?type=text&projectId=<id>`
- image shared project opens `/editor?type=image&projectId=<id>`

Empty state:

```text
No shared projects yet
Projects that other users share with you will appear here.
```

## Collaborator invite flow

1. Owner enters an email address in the workspace share popover.
2. Frontend validates basic email shape.
3. Frontend blocks duplicate invited emails already present in the current project state.
4. Frontend posts to `PATCH /api/projects/:id/invite`.
5. Backend verifies the authenticated user is the owner.
6. Backend lowercases and finds the invited user email.
7. Backend rejects unknown emails.
8. Backend rejects inviting the owner.
9. Backend only adds the collaborator if not already present.
10. Backend returns the updated project with populated owner and collaborators.

Business rule: collaborators must already have accounts before they can be invited.

## Project update flow

1. Backend finds a project accessible by owner or collaborator.
2. Allowed fields are title, type, category, description, and collaborators.
3. Type must stay `text` or `image`.
4. Empty title is rejected.
5. Empty category falls back to `Other`.
6. Collaborator ids are validated when collaborators are updated directly.

## Project delete flow

Only owners can delete projects.

When a project is deleted, backend also deletes:

- related `AIChat` documents
- related `TextContent` documents
- related `ImageContent` documents

Business rule: deleting a project removes its workspace content and AI history.

## Text workspace content flow

Read:

```http
GET /api/text-content/:projectId
```

Save:

```http
PUT /api/text-content
```

Save payload:

```json
{
  "project": "<project id>",
  "content": "<html>"
}
```

Business rules:

- User must be owner or collaborator.
- Project must be a text project.
- One `TextContent` document exists per project.
- `lastUpdatedBy` is set to the authenticated user.

## Image workspace content flow

Read:

```http
GET /api/image-content/:projectId
```

Save:

```http
PUT /api/image-content
```

Save payload:

```json
{
  "project": "<project id>",
  "imageUrl": "<optional generated image url>",
  "generationPrompt": "<optional prompt>",
  "canvasState": {}
}
```

Business rules:

- User must be owner or collaborator.
- Project must be an image project.
- One `ImageContent` document exists per project.
- `lastUpdatedBy` is set to the authenticated user.

## AI history flow

AI history is stored as `AIChat`.

Create:

```http
POST /api/chats
```

List by project:

```http
GET /api/projects/:projectId/chats
```

Update:

```http
PATCH /api/chats/:id
```

Favourite:

```http
PATCH /api/chats/:id/favourite
```

Delete:

```http
DELETE /api/chats/:id
```

Business rules:

- User must be able to access the linked project.
- Prompt and response are required.
- Content type must be `text`, `image`, or `other`.
- History is sorted newest first.
- Favourites are stored on individual AI history entries.

## UI notes

- Text workspace AI response selection automatically shows the selected response in the editor.
- AI history left sidebar selects previous responses.
- Deleting a selected response clears the editor only when the editor still exactly matches that deleted AI response.
- Save status tracks loading, saving, unsaved changes, errors, and last saved time.
