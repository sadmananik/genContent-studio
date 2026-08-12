const express = require("express");
const { getImageContent, upsertImageContent } = require("../controllers/imageContentController");
const requireUser = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.use(requireUser);
router.put("/", upsertImageContent);
router.get("/:projectId", validateObjectId("projectId"), getImageContent);

module.exports = router;
