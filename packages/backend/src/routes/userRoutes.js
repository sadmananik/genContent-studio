const express = require("express");
const { getCurrentUser, listUsers } = require("../controllers/userController");
const requireUser = require("../middleware/auth");

const router = express.Router();

router.use(requireUser);
router.get("/me", getCurrentUser);
router.get("/", listUsers);

module.exports = router;
