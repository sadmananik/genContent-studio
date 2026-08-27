# GenContent Studio User Guide

GenContent Studio is a web application for creating, editing, sharing, and reusing text and image content with AI assistance.

## Getting Started

1. Open the application and select **Register**.
2. Enter your name, email address, and password.
3. Open the verification link sent to your email.
4. Return to the application and sign in.
5. Use the dashboard or projects page to create a project.

A verified account is required before login is allowed.

## Account And Security

### Create an account

Account creation requires a name, a valid email address, and a password of at least eight characters. The application sends a single-use email verification link.

### Sign in and sign out

Use your verified email and password on the Login page. Protected pages redirect unauthenticated users back to Login. Sign out clears the local session and returns to the public area.

### Recover or change a password

- **Forgot password:** submit your email address and follow the reset link.
- **Reset password:** open the link, choose a new password, and sign in again.
- **Change password:** open Profile or Settings, enter the current password and a new password, then save.

Reset and verification links expire and cannot be reused. Password reset responses do not reveal whether an email address belongs to an account.

### Settings and appearance

The Settings page contains system preferences and appearance options. Appearance preferences are stored locally for the signed-in browser and are applied when the application opens.

## Projects

A project is the container for one workspace, its saved content, collaborators, AI history, and reusable template data.

### Create a project

1. Open Projects and select **New project**.
2. Enter a title and choose **Text** or **Image**.
3. Select a category and optionally add a description.
4. Create the project.

The project type determines which editor opens. Text and image content cannot be saved to the wrong project type.

### Manage a project

Owners can update project details, share the project, change collaborator permissions, publish reusable templates, export content, and delete the project. Deleting a project also removes its saved workspace content and AI chat history.

## Text Workspace

The Text Workspace uses a rich text editor. It supports:

- Bold and italic formatting.
- Heading levels one and two.
- Bulleted and numbered lists.
- Font size selection.
- Text colour selection.
- Clearing text styles.
- Word count, character count, reading time, and save status.
- Text export and PDF export.

Select **Save** to persist the current document. Unsaved changes are shown in the workspace status and are checked before leaving the project.

### AI text generation

1. Enter a prompt in the AI prompt panel.
2. Select **Generate**.
3. Review the response in the editor and response card.
4. Save the project when the content is ready.

Quick actions can rewrite or transform selected/editor content:

- Rewrite.
- Improve Tone.
- Summarise.
- Expand.
- SEO Suggestions.

AI responses can be selected from the history sidebar. A response can be copied, inserted into the editor, edited, favourited, or deleted.

## Image Workspace

The Image Workspace provides a Fabric.js canvas for visual content. It supports:

- Text objects.
- Rectangles and circles.
- Object colour and opacity changes.
- Moving an object to the front or back.
- Deleting selected objects.
- Canvas JSON export.
- PNG export.
- Saving and restoring canvas state.
- AI image response history and insertion into the canvas.

The current image generation experience includes the workspace integration and response workflow. The production image AI provider can be connected later without changing the canvas, history, or collaboration contracts.

## Collaboration

Open the same project in two browser sessions to collaborate.

- Owners and Editors can change shared content.
- Viewers can see content but cannot edit it.
- Active collaborators appear in the workspace header.
- Join and leave activity is shown as notifications.
- Permission changes are applied while the workspace is open.
- A Viewer promoted to Editor can edit without reopening the project.
- An Editor changed to Viewer loses editing controls immediately.
- Removing a collaborator prevents future access and closes their shared access flow.

The server validates access. Frontend controls improve the user experience but are not the security boundary.

### Quick reactions

While working in a shared Text or Image Workspace, select the smile button beside the active collaborators to open the **Quick reactions** menu. Select a preset reaction to send it immediately to everyone currently connected to that project:

- Hi.
- You still there?
- Yes or No.
- Looks good.
- Perfect.
- Working on it.
- Wait or Done.
- Great, Nice work, or Awesome.

The reaction appears briefly with the sender's name, emoji, and message. Your own reaction is shown in the same way as reactions received from other collaborators. Viewers can send and receive reactions because reactions do not change project content.

Quick reactions are temporary. They are only delivered to active collaborators in the current project room and are not shown to users who join later. They do not modify the text editor, image canvas, save state, AI history, or audit history. The reaction menu is unavailable while the realtime connection is unavailable, and rapid repeated sends are limited.

## Sharing Projects

Only the owner can manage sharing.

1. Open a project and select **Share**.
2. Enter an existing user's email address.
3. Choose **Editor** or **Viewer**.
4. Save permissions.
5. Use the permissions dialog later to change or remove access.

Editors can work on project content but cannot manage project sharing. Viewers cannot modify workspace content or AI history.

## AI Response History

The AI history sidebar stores saved prompt and response records for a project. Each record can be:

- Selected.
- Copied.
- Favourited.
- Updated.
- Deleted.
- Inserted into the active workspace.

Favourites are personal to the current user. They are not shared with collaborators.

## Favourites

Open **Favorites** from the protected application navigation to see your saved AI responses. The page can:

- Open the project where the response was created.
- Copy the saved response.
- Remove the response from your favourites.
- Show both text and image response types.
- Display a prompt preview and response preview for quick scanning.

Favouriting an AI response does not change the response for other users. It also does not grant access to the project. If project access is later removed, the project must still pass the normal access checks before it can be opened.

## Templates

Templates are reusable project starting points.

### Browse and use templates

1. Open Templates.
2. Search by title, description, category, or tag.
3. Filter by Text, Image, or category.
4. Preview a template.
5. Select **Use template**.

Using a template creates an independent project. The original project, owner, collaborators, and permissions are not copied.

### Publish templates

A project owner can publish a project as a public or private template. Template details may include a title, description, category, tags, starter prompt, starter content, tone, and style.

Public templates are available to authenticated users. Private templates are available only to their creator. Template creators can edit, hide, reuse, or delete their own templates.

### Favourite templates

In the Templates page, select the **Favorites** tab to see templates you have saved. Template favourites are personal and do not change a template's visibility or permissions. You can favourite public templates and your own templates, then remove them later from the same tab.

The template page also has **Browse** for public templates and **Mine** for templates you published. Template favourites are separate from AI response favourites.

## Audit History

Project owners can open **Audit history** from the workspace header. Editors and Viewers cannot read this history.

Audit entries record meaningful AI activity, including:

- Submitted prompts.
- Generated responses.
- Prompt updates.
- Response updates.
- Prompt and response deletion snapshots.
- AI content inserted into the editor or canvas.
- AI content saved to a project.

Select an entry to expand it. Expanded details show the actor, workspace, date, prompt values, and response previews where available. Long values are shortened to keep the history readable. Deleted AIChat records do not remove their audit entries.

## Shared Projects

The Shared Projects area lists projects shared with the current user. Select a project to open its Text or Image Workspace. The project actions menu can show details or let you leave the shared project. Access still follows the owner's current permission settings.

## Exporting

- Text projects can export plain text and PDF files.
- Image projects can export PNG images and canvas JSON.

Exports use the current workspace state. Save first when the latest changes must also be stored in the project.

## Common Problems

- **Cannot log in:** verify the email address first, then try password recovery if needed.
- **Cannot edit:** check whether the project is Viewer-only or whether the owner changed your permission.
- **Content disappeared after reload:** save the workspace before leaving and confirm the project is the correct type.
- **No collaborators visible:** refresh the project after checking the connection and access state.
- **Quick reaction not sent:** check that the project is still open and the realtime connection is active, then try again after the short cooldown.
- **No audit history:** only the project owner can open it, and a new project may not have recorded activity yet.
- **No favourites visible:** confirm you are signed in to the account that saved the response or template, then refresh the Favorites page or Templates Favorites tab.
