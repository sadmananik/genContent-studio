const express = require("express");
const {
  deleteTemplate,
  favoriteTemplate,
  getTemplateById,
  listFavoriteTemplates,
  listMyTemplates,
  listRecentTemplates,
  listTemplateTags,
  listTemplates,
  publishProjectTemplate,
  unfavoriteTemplate,
  updateTemplate,
  updateTemplateVisibility,
  useTemplate,
  voteTemplate
} = require("../controllers/templateController");
const requireUser = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.use(requireUser);
router.get("/", listTemplates);
router.get("/mine", listMyTemplates);
router.get("/favorites", listFavoriteTemplates);
router.get("/recent", listRecentTemplates);
router.get("/tags", listTemplateTags);
router.post("/projects/:projectId", validateObjectId("projectId"), publishProjectTemplate);
router.get("/:id", validateObjectId("id"), getTemplateById);
router.put("/:id", validateObjectId("id"), updateTemplate);
router.patch("/:id/visibility", validateObjectId("id"), updateTemplateVisibility);
router.post("/:id/use", validateObjectId("id"), useTemplate);
router.put("/:id/favorite", validateObjectId("id"), favoriteTemplate);
router.delete("/:id/favorite", validateObjectId("id"), unfavoriteTemplate);
router.post("/:id/vote", validateObjectId("id"), voteTemplate);
router.delete("/:id", validateObjectId("id"), deleteTemplate);

module.exports = router;
