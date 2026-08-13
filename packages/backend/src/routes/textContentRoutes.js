const express = require("express");
const { getTextContent, upsertTextContent } = require("../controllers/textContentController");
const requireUser = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.use(requireUser);
router.put("/", upsertTextContent);
router.get("/:projectId", validateObjectId("projectId"), getTextContent);

module.exports = router;
