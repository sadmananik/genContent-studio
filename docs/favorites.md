# Favorites

Favorites give each user a personal shortcut list for content they want to return to quickly.

## Product Goal

Favorites should help users find useful saved responses, templates, or projects faster without changing shared workspace data for other users.

## Current Favorite Areas

### AI Responses

AI response favorites are personal to the current user.

Rules:

- Favoriting a response should not favorite it for collaborators.
- Unfavoriting a response should not remove it from other users' views.
- Copy state and other personal response actions stay user-specific.
- The underlying saved response can still belong to the project history if project history is shared.

### Templates

Template favorites are personal to the current user.

Rules:

- Users can favorite public templates.
- Users can favorite their own templates.
- Favorite status should not change the template creator or visibility.
- Favorite status should not affect other users.

### Projects

The Favorites page can show project shortcuts when project-level favorites are enabled.

Rules:

- Project favorite state is personal to the current user.
- Opening a favorite project must still respect normal access permissions.
- Removed or inaccessible projects should not remain actionable.

## Favorites Page

The Favorites page should use the same project card layout and hover behavior as Projects and Shared with Me where project cards are shown.

Expected page behavior:

- Show favorited items grouped by type when needed.
- Let users open accessible favorite projects.
- Let users remove items from favorites.
- Keep empty state clear and consistent with the rest of the app.

## Permission Rules

Favorites do not grant access.

If a user favorites a shared project and later loses access:

- The project should not open.
- The app should show a permission-safe error or remove it from the visible favorite list.

If a template becomes private:

- It should stay visible only to the creator.
- Other users should not be able to access it through old favorite references.

## Realtime Rules

Favorites are personal state. They should not be broadcast to collaborators.

Do not broadcast:

- Favorite or unfavorite changes.
- Personal copy actions.
- Private prompt history changes.

Shared project content and shared saved responses can update for collaborators, but personal favorite state should remain private.

## Backend Data Rules

Favorite data should store:

- User id.
- Target item id.
- Target item type where multiple favorite types are supported.
- Created or updated timestamp.

When deleting a target item:

- Remove stale favorite references where practical.
- Never delete unrelated user data.

## Important Edge Cases

- Favorite buttons should handle repeated clicks without duplicating records.
- Favorite state should be loaded per user after login.
- Favorite status should reset after logout or account switch.
- Favorite lists should not expose private templates or projects the user cannot access.
