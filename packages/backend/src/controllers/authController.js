const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { sendPasswordResetEmail } = require("../utils/email");
const { signAuthToken } = require("../utils/token");

const PASSWORD_RESET_RESPONSE =
  "If an account exists for this email, password reset instructions have been sent.";
const DEFAULT_RESET_TOKEN_LIFETIME_MINUTES = 30;

const register = asyncHandler(async (req, res) => {
  const { name, email, password, profile } = req.body;

  if (!name || !email || !password) {
    throw httpError(400, "Name, email, and password are required");
  }

  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, profile });

  res.status(201).json({
    user: serializeUser(user),
    token: signAuthToken(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw httpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, "Invalid email or password");
  }

  res.json({
    user: serializeUser(user),
    token: signAuthToken(user)
  });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw httpError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = hashResetToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + getResetTokenLifetime());
    await user.save();

    const resetUrl = buildResetUrl(resetToken);

    try {
      await sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl });
    } catch (error) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      console.error("Failed to send password reset email", error.message);
    }
  }

  res.json({ message: PASSWORD_RESET_RESPONSE });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw httpError(400, "Reset token and new password are required");
  }

  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    {
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() }
    },
    {
      $set: { passwordHash },
      $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 }
    },
    { new: true }
  );

  if (!user) {
    throw httpError(400, "This password reset link is invalid or has expired");
  }

  res.json({ message: "Password reset successfully. You can now sign in." });
});

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function getResetTokenLifetime() {
  const configuredMinutes = Number(process.env.PASSWORD_RESET_EXPIRES_IN_MINUTES);
  const minutes =
    Number.isFinite(configuredMinutes) && configuredMinutes > 0
      ? configuredMinutes
      : DEFAULT_RESET_TOKEN_LIFETIME_MINUTES;

  return minutes * 60 * 1000;
}

function buildResetUrl(token) {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  return `${frontendOrigin}/reset-password?token=${encodeURIComponent(token)}`;
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = {
  login,
  requestPasswordReset,
  resetPassword,
  register
};
