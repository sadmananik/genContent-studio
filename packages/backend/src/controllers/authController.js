const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { AUTH_MESSAGES } = require("../constants/auth");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const {
  sendEmailVerificationEmail,
  sendPasswordChangeEmail,
  sendPasswordResetEmail
} = require("../utils/email");
const { applyPendingProjectInvites } = require("../services/projectInviteService");
const { signAuthToken } = require("../utils/token");

const DEFAULT_AUTH_LINK_EXPIRES_IN_MINUTES = 5;

const register = asyncHandler(async (req, res) => {
  const { name, email, password, profile } = req.body;
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedName = String(name || "").trim();

  if (!normalizedName || !normalizedEmail || !password) {
    throw httpError(400, AUTH_MESSAGES.REGISTER_REQUIRED_FIELDS);
  }

  if (password.length < 8) {
    throw httpError(400, AUTH_MESSAGES.PASSWORD_MIN_LENGTH);
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select("_id");

  if (existingUser) {
    throw httpError(409, AUTH_MESSAGES.REGISTER_DUPLICATE_EMAIL);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = createAuthLinkToken();
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    emailVerified: false,
    emailVerificationTokenHash: hashAuthLinkToken(verificationToken),
    emailVerificationExpiresAt: buildAuthLinkExpiry(getEmailVerificationExpiryMinutes()),
    profile
  });

  try {
    await sendEmailVerificationEmail({
      email: user.email,
      name: user.name,
      expiresInMinutes: getEmailVerificationExpiryMinutes(),
      verificationUrl: buildVerificationUrl(verificationToken)
    });
  } catch (error) {
    console.error("Failed to send account verification email", error.message);
  }

  res.status(201).json({
    message: AUTH_MESSAGES.EMAIL_VERIFICATION_SENT,
    user: serializeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw httpError(400, AUTH_MESSAGES.LOGIN_REQUIRED_FIELDS);
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  if (user.emailVerified === false) {
    throw httpError(403, AUTH_MESSAGES.UNVERIFIED_LOGIN);
  }

  await applyPendingProjectInvites(user);

  res.json({
    user: serializeUser(user),
    token: signAuthToken(user)
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw httpError(400, AUTH_MESSAGES.EMAIL_VERIFICATION_REQUIRED);
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
    throw httpError(400, AUTH_MESSAGES.EMAIL_VERIFICATION_INVALID);
  }

  await applyPendingProjectInvites(user);

  res.json({ message: AUTH_MESSAGES.EMAIL_VERIFICATION_SUCCESS });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw httpError(400, AUTH_MESSAGES.RESEND_EMAIL_REQUIRED);
  }

  const user = await User.findOne({ email }).select(
    "+emailVerificationTokenHash +emailVerificationExpiresAt"
  );

  if (user && user.emailVerified === false) {
    const verificationToken = createAuthLinkToken();
    user.emailVerificationTokenHash = hashAuthLinkToken(verificationToken);
    user.emailVerificationExpiresAt = buildAuthLinkExpiry(getEmailVerificationExpiryMinutes());
    await user.save();

    try {
      await sendEmailVerificationEmail({
        email: user.email,
        name: user.name,
        expiresInMinutes: getEmailVerificationExpiryMinutes(),
        verificationUrl: buildVerificationUrl(verificationToken)
      });
    } catch (error) {
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
      await user.save();
      console.error("Failed to send account verification email", error.message);
    }
  }

  res.json({ message: AUTH_MESSAGES.EMAIL_VERIFICATION_GENERIC_RESPONSE });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw httpError(400, AUTH_MESSAGES.RESEND_EMAIL_REQUIRED);
  }

  const user = await User.findOne({ email });

  if (user) {
    const resetToken = createAuthLinkToken();
    user.passwordResetTokenHash = hashAuthLinkToken(resetToken);
    user.passwordResetExpiresAt = buildAuthLinkExpiry(getPasswordResetExpiryMinutes());
    await user.save();

    const resetUrl = buildResetUrl(resetToken);

    try {
      await sendPasswordResetEmail({
        email: user.email,
        expiresInMinutes: getPasswordResetExpiryMinutes(),
        name: user.name,
        resetUrl
      });
    } catch (error) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      console.error("Failed to send password reset email", error.message);
    }
  }

  res.json({ message: AUTH_MESSAGES.PASSWORD_RESET_GENERIC_RESPONSE });
});

const requestPasswordChange = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    const resetToken = createAuthLinkToken();
    user.passwordResetTokenHash = hashAuthLinkToken(resetToken);
    user.passwordResetExpiresAt = buildAuthLinkExpiry(getPasswordResetExpiryMinutes());
    await user.save();

    try {
      await sendPasswordChangeEmail({
        email: user.email,
        expiresInMinutes: getPasswordResetExpiryMinutes(),
        name: user.name,
        resetUrl: buildResetUrl(resetToken)
      });
    } catch (error) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      console.error("Failed to send password change email", error.message);
      throw httpError(500, AUTH_MESSAGES.PASSWORD_CHANGE_GENERIC_RESPONSE);
    }
  }

  res.json({ message: AUTH_MESSAGES.PASSWORD_CHANGE_EMAIL_SENT });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw httpError(400, AUTH_MESSAGES.PASSWORD_RESET_REQUIRED_FIELDS);
  }

  if (password.length < 8) {
    throw httpError(400, AUTH_MESSAGES.PASSWORD_MIN_LENGTH);
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
    throw httpError(400, AUTH_MESSAGES.PASSWORD_RESET_INVALID);
  }

  res.json({ message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS });
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

function buildAuthLinkExpiry(expiresInMinutes) {
  return new Date(Date.now() + expiresInMinutes * 60 * 1000);
}

function getPasswordResetExpiryMinutes() {
  return getConfiguredExpiryMinutes("PASSWORD_RESET_EXPIRES_IN_MINUTES");
}

function getEmailVerificationExpiryMinutes() {
  return getConfiguredExpiryMinutes("EMAIL_VERIFICATION_EXPIRES_IN_MINUTES");
}

function getConfiguredExpiryMinutes(envKey) {
  const configuredMinutes = Number(process.env[envKey]);

  if (Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
    return configuredMinutes;
  }

  return DEFAULT_AUTH_LINK_EXPIRES_IN_MINUTES;
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
  requestPasswordChange,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  register,
  verifyEmail
};
