const express = require("express");
const { clearTestMailbox, getTestMailbox } = require("../utils/email");

const router = express.Router();

router.use((req, res, next) => {
  if (process.env.NODE_ENV !== "e2e") {
    return res.status(404).end();
  }

  if (
    !process.env.E2E_TEST_SECRET ||
    req.get("x-e2e-test-secret") !== process.env.E2E_TEST_SECRET
  ) {
    return res.status(403).json({ message: "E2E test access denied." });
  }

  return next();
});

router.get("/mailbox", (req, res) => res.json(getTestMailbox()));
router.delete("/mailbox", (req, res) => {
  clearTestMailbox();
  res.status(204).end();
});

module.exports = router;
