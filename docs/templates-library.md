# Templates Library

Templates let users turn completed or reusable projects into starting points that other users can copy into their own workspace.

## Product Goal

The Templates Library should help users create new Text or Image projects faster without changing the original author's project. A template is a reusable blueprint, not a shared live project.

## Main User Flows

### Browse Templates

Authenticated users can open the Templates page and browse public templates.

Users can:

- Search templates by title, description, category, or tag.
- Filter by project type: Text, Image, or All.
- Filter by category.
- Preview a template before using it.
- Favorite or unfavorite a template.
- Use a template to create a new project.

### Publish Project as Template

Only the project owner can publish a project as a template.

When publishing, the owner sets:

- Template title.
- Description.
- Category.
- Tags.
- Starter prompt.
- Starter content for Text templates.
- Tone and style.
- Visibility: Public or Private.

Tags are saved with the template and are used for search and suggestions. While typing tags, the UI suggests existing tags from public templates and the current user's own templates.

### Use or Clone a Template

When a user uses a template, the app creates a new independent project.

Ownership rules:

- The new project owner is the user who clicked Use Template.
- The original template creator remains the template creator.
- The source project owner does not become the owner of copied projects.
- Collaborators and sharing permissions are not copied.
- The copied project keeps a `sourceTemplate` reference for tracking.

This keeps templates safe as reusable starting points and prevents accidental access sharing.

### Manage My Published Templates

Template creators can open My Published Templates to manage templates they created.

Creators can:

- Edit template metadata and reusable content.
- Publish a hidden/private template.
- Hide a public template.
- Delete a template.

System templates cannot be edited or deleted by normal users.

## Visibility Rules

Public templates:

- Visible in Browse Templates.
- Searchable by title, description, category, and tags.
- Can be used by authenticated users.

Private templates:

- Visible only to the creator in My Published Templates.
- Can still be edited, reused, published, or deleted by the creator.
- Private template tags can appear in suggestions only for that creator.

## Template Search and Tag Suggestions

Template search supports:

- Title matches.
- Description matches.
- Category matches.
- Tag matches.

Tag suggestions are loaded from the template database. Suggestions include tags from:

- Public templates.
- Private or public templates owned by the current user.

Suggestions should not expose private template tags from other users.

## Backend API

Template routes are protected and require an authenticated user.

Key endpoints:

```http
GET /api/templates
GET /api/templates/mine
GET /api/templates/recent
GET /api/templates/tags?search=blog
POST /api/templates/projects/:projectId
GET /api/templates/:id
PUT /api/templates/:id
PATCH /api/templates/:id/visibility
POST /api/templates/:id/use
PUT /api/templates/:id/favorite
DELETE /api/templates/:id/favorite
DELETE /api/templates/:id
```

## Default Template Seed

Default system templates are not inserted automatically when users open the Templates page.

Run the seed script when default templates should exist in an environment:

```bash
yarn workspace @gencontent/backend db:seed:templates
```

The script is safe to rerun. It uses each template `systemKey` and only inserts missing default templates.

## Data Rules

Template data stores:

- Creator.
- Source project.
- Project type.
- Category.
- Tags.
- Starter prompt.
- Starter content.
- Tone and style.
- Visibility.
- System template status.
- Use count.

The API response should not expose internal fields such as `sourceProject` or `systemKey`.

## Important Edge Cases

- If a template is deleted, projects already created from it must remain usable.
- If a source project is deleted, the published template can remain available.
- If template use fails while creating content, the partially created project should be rolled back.
- A user cannot edit, hide, publish, or delete another user's template.
- A private template cannot be accessed by users other than its creator.
