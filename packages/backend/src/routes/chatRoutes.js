const express = require("express");
const { createChat, deleteChat, toggleFavourite } = require("../controllers/chatController");
const requireUser = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.use(requireUser);
router.post("/", createChat);
router.patch("/:id/favourite", validateObjectId("id"), toggleFavourite);
router.delete("/:id", validateObjectId("id"), deleteChat);

module.exports = router;
