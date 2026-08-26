const express = require("express");
const {
  createProject,
  deleteProject,
  getProjectById,
  inviteProjectCollaborator,
  leaveProject,
  listSharedProjects,
  listProjects,
  updateProject
} = require("../controllers/projectController");
const { listProjectChats } = require("../controllers/chatController");
const {
  createProjectAuditEvent,
  listProjectAuditHistory
} = require("../controllers/auditController");
const requireUser = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.use(requireUser);
router.post("/", createProject);
router.get("/", listProjects);
router.get("/shared", listSharedProjects);
router.get("/:id", validateObjectId("id"), getProjectById);
router.put("/:id", validateObjectId("id"), updateProject);
router.patch("/:id/invite", validateObjectId("id"), inviteProjectCollaborator);
router.delete("/:id/collaborators/me", validateObjectId("id"), leaveProject);
router.delete("/:id", validateObjectId("id"), deleteProject);
router.get("/:projectId/chats", validateObjectId("projectId"), listProjectChats);
router.get("/:projectId/audit-history", validateObjectId("projectId"), listProjectAuditHistory);
router.post("/:projectId/audit-history", validateObjectId("projectId"), createProjectAuditEvent);

module.exports = router;
