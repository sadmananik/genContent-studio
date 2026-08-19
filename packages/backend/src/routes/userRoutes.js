const express = require("express");
const { getCurrentUser, listUsers, updateCurrentUser } = require("../controllers/userController");
const requireUser = require("../middleware/auth");

const router = express.Router();

router.use(requireUser);
router.get("/me", getCurrentUser);
router.put("/me", updateCurrentUser);
router.get("/", listUsers);

module.exports = router;
