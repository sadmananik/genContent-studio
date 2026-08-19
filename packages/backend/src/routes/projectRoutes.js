const express = require("express");
const {
  createProject,
  deleteProject,
  getProjectById,
  inviteProjectCollaborator,
  listProjects,
  updateProject
} = require("../controllers/projectController");
const { listProjectChats } = require("../controllers/chatController");
const requireUser = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.use(requireUser);
router.post("/", createProject);
router.get("/", listProjects);
router.get("/:id", validateObjectId("id"), getProjectById);
router.put("/:id", validateObjectId("id"), updateProject);
router.patch("/:id/invite", validateObjectId("id"), inviteProjectCollaborator);
router.delete("/:id", validateObjectId("id"), deleteProject);
router.get("/:projectId/chats", validateObjectId("projectId"), listProjectChats);

module.exports = router;
