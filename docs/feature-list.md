# GenContent Studio Feature List

This list describes the current product scope. Features marked **Implemented** are available in the repository. Features marked **Integration pending** have the workspace contract and UI flow but require a production service or later product work.

## Accounts And Security

| Feature                                       | Status      |
| --------------------------------------------- | ----------- |
| Account creation with email verification link | Implemented |
| Login and protected user access               | Implemented |
| Forgot password and reset password flow       | Implemented |
| Change password from account settings         | Implemented |
| System settings and appearance preferences    | Implemented |

## Projects And Workspaces

| Feature                                  | Status      |
| ---------------------------------------- | ----------- |
| Project creation and management          | Implemented |
| Text content editor with rich formatting | Implemented |
| Image content workspace                  | Implemented |
| Shared projects section                  | Implemented |
| Publish content                          | Implemented |
| Export text content                      | Implemented |
| Export content as PDF                    | Implemented |

## Collaboration And Sharing

| Feature                                         | Status      |
| ----------------------------------------------- | ----------- |
| Live collaborative text editing                 | Implemented |
| Live collaborative image canvas synchronization | Implemented |
| Real-time collaborator presence                 | Implemented |
| Join and leave event notifications              | Implemented |
| Permission-change notifications                 | Implemented |
| Share projects with other users                 | Implemented |
| Change Viewer/Editor permissions                | Implemented |
| Remove collaborator access                      | Implemented |
| Server-side edit permission enforcement         | Implemented |

## AI Features

| Feature                                  | Status              |
| ---------------------------------------- | ------------------- |
| AI text generation from prompts          | Implemented         |
| Rewrite quick action                     | Implemented         |
| Improve Tone quick action                | Implemented         |
| Summarise quick action                   | Implemented         |
| Expand quick action                      | Implemented         |
| SEO Suggestions quick action             | Implemented         |
| AI response history                      | Implemented         |
| Save AI responses                        | Implemented         |
| Favourite AI responses                   | Implemented         |
| Copy AI responses                        | Implemented         |
| Update AI responses                      | Implemented         |
| Delete AI responses                      | Implemented         |
| Image workspace AI response workflow     | Implemented         |
| Production image AI provider integration | Integration pending |

## Templates And Audit

| Feature                                      | Status      |
| -------------------------------------------- | ----------- |
| Browse reusable templates                    | Implemented |
| Search and filter templates                  | Implemented |
| Preview and use templates                    | Implemented |
| Publish public/private templates             | Implemented |
| Manage published templates                   | Implemented |
| Personal template favourites                 | Implemented |
| Owner-only audit history                     | Implemented |
| Expandable audit entries                     | Implemented |
| AI prompt and response snapshots             | Implemented |
| Audit records retained after AIChat deletion | Implemented |

## Backend API Areas

- Authentication and account lifecycle.
- Users and authenticated profile data.
- Project creation, listing, sharing, permission updates, and deletion.
- Text content read and save operations.
- Image content read and save operations.
- AI generation and chat history.
- Favourites for AI responses and templates.
- Templates, visibility, tags, publishing, and cloning.
- Owner-only audit history and editor-created audit events.
- Socket.IO/Yjs realtime collaboration and presence.

See [user-guide.md](./user-guide.md) for workflows and [developer-guide.md](./developer-guide.md) for implementation details.
