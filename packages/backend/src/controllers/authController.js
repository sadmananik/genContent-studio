const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { sendEmailVerificationEmail, sendPasswordResetEmail } = require("../utils/email");
const { signAuthToken } = require("../utils/token");

const PASSWORD_RESET_RESPONSE =
  "If an account exists for this email, password reset instructions have been sent.";
const VERIFICATION_EMAIL_RESPONSE =
  "If an unverified account exists for this email, verification instructions have been sent.";
const LINK_EXPIRES_IN_MINUTES = 5;

const register = asyncHandler(async (req, res) => {
  const { name, email, password, profile } = req.body;
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedName = String(name || "").trim();

  if (!normalizedName || !normalizedEmail || !password) {
    throw httpError(400, "Name, email, and password are required");
  }

  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select("_id");

  if (existingUser) {
    throw httpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = createAuthLinkToken();
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    emailVerified: false,
    emailVerificationTokenHash: hashAuthLinkToken(verificationToken),
    emailVerificationExpiresAt: buildAuthLinkExpiry(),
    profile
  });

  try {
    await sendEmailVerificationEmail({
      email: user.email,
      name: user.name,
      verificationUrl: buildVerificationUrl(verificationToken)
    });
  } catch (error) {
    console.error("Failed to send account verification email", error.message);
  }

  res.status(201).json({
    message: "Account created. Check your email to verify your account before signing in.",
    user: serializeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw httpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, "Invalid email or password");
  }

  if (user.emailVerified === false) {
    throw httpError(403, "Please verify your email before signing in.");
  }

  res.json({
    user: serializeUser(user),
    token: signAuthToken(user)
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw httpError(400, "Verification token is required");
  }

  const user = await User.findOneAndUpdate(
    {
      emailVerificationTokenHash: hashAuthLinkToken(token),
      emailVerificationExpiresAt: { $gt: new Date() }
    },
    {
      $set: { emailVerified: true },
      $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1 }
    },
    { new: true }
  );

  if (!user) {
    throw httpError(400, "This verification link is invalid or has expired");
  }

  res.json({ message: "Email verified successfully. You can now sign in." });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw httpError(400, "Email is required");
  }

  const user = await User.findOne({ email }).select(
    "+emailVerificationTokenHash +emailVerificationExpiresAt"
  );

  if (user && user.emailVerified === false) {
    const verificationToken = createAuthLinkToken();
    user.emailVerificationTokenHash = hashAuthLinkToken(verificationToken);
    user.emailVerificationExpiresAt = buildAuthLinkExpiry();
    await user.save();

    try {
      await sendEmailVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl: buildVerificationUrl(verificationToken)
      });
    } catch (error) {
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
      await user.save();
      console.error("Failed to send account verification email", error.message);
    }
  }

  res.json({ message: VERIFICATION_EMAIL_RESPONSE });
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
    const resetToken = createAuthLinkToken();
    user.passwordResetTokenHash = hashAuthLinkToken(resetToken);
    user.passwordResetExpiresAt = buildAuthLinkExpiry();
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

function createAuthLinkToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashAuthLinkToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function hashResetToken(token) {
  return hashAuthLinkToken(token);
}

function buildAuthLinkExpiry() {
  return new Date(Date.now() + LINK_EXPIRES_IN_MINUTES * 60 * 1000);
}

function buildResetUrl(token) {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  return `${frontendOrigin}/reset-password?token=${encodeURIComponent(token)}`;
}

function buildVerificationUrl(token) {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  return `${frontendOrigin}/verify-email?token=${encodeURIComponent(token)}`;
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified !== false,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = {
  login,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  register,
  verifyEmail
};
