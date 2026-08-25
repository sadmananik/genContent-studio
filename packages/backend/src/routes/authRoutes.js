const express = require("express");
const {
  login,
  register,
  requestPasswordChange,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail
} = require("../controllers/authController");
const requireUser = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/request-password-change", requireUser, requestPasswordChange);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

module.exports = router;
