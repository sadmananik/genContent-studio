export const user = {
  id: "507f1f77bcf86cd799439011",
  name: "Test Creator",
  email: "creator@example.test",
  profile: {}
};
export const project = {
  _id: "507f1f77bcf86cd799439012",
  title: "Integration draft",
  type: "text",
  category: "Blog Post",
  description: "Test project",
  owner: user,
  collaborators: [],
  collaboratorPermissions: [],
  canEdit: true,
  canDelete: true,
  canManageSharing: true,
  accessLevel: "editor",
  currentUserRole: "owner",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z"
};
export const template = {
  id: "507f1f77bcf86cd799439013",
  _id: "507f1f77bcf86cd799439013",
  title: "Blog starter",
  description: "A reusable blog",
  projectType: "text",
  category: "Blog",
  tags: ["writing"],
  creator: { id: user.id, name: user.name },
  visibility: "public",
  starterContent: "Template draft",
  isFavorite: false,
  canManage: true,
  upvoteCount: 0,
  downvoteCount: 0,
  currentUserVote: null,
  useCount: 0
};

export const sharedProject = {
  ...project,
  owner: { id: "507f1f77bcf86cd799439099", name: "Other Owner", email: "owner@example.test" },
  collaborators: [user],
  isSharedWithCurrentUser: true,
  currentUserRole: "collaborator",
  canManageSharing: false,
  canDelete: false
};
