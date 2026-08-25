const Project = require("../models/Project");
const ProjectInvite = require("../models/ProjectInvite");
const { ACCESS_LEVELS } = require("../constants/projects");

async function applyPendingProjectInvites(user) {
  const email = String(user.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return;
  }

  const invites = await ProjectInvite.find({ email });

  if (invites.length === 0) {
    return;
  }

  await Promise.all(
    invites.map(async (invite) => {
      const project = await Project.findById(invite.project);

      if (!project || String(project.owner) === String(user._id)) {
        await invite.deleteOne();
        return;
      }

      const alreadyCollaborator = project.collaborators.some(
        (collaboratorId) => String(collaboratorId) === String(user._id)
      );

      if (!alreadyCollaborator) {
        project.collaborators.push(user._id);
      }

      const existingPermission = project.collaboratorPermissions.find(
        (permission) => String(permission.user) === String(user._id)
      );

      if (!existingPermission) {
        project.collaboratorPermissions.push({
          accessLevel: invite.accessLevel || ACCESS_LEVELS.EDITOR,
          user: user._id
        });
      }

      await project.save();
      await invite.deleteOne();
    })
  );
}

module.exports = {
  applyPendingProjectInvites
};
