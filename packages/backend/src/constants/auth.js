const AUTH_MESSAGES = {
  EMAIL_FROM_MISSING: "EMAIL_FROM is not configured",
  EMAIL_VERIFICATION_GENERIC_RESPONSE:
    "If an unverified account exists for this email, verification instructions have been sent.",
  EMAIL_VERIFICATION_INVALID: "This verification link is invalid or has expired",
  EMAIL_VERIFICATION_REQUIRED: "Verification token is required",
  EMAIL_VERIFICATION_SENT:
    "Account created. Check your email to verify your account before signing in.",
  EMAIL_VERIFICATION_SUCCESS: "Email verified successfully. You can now sign in.",
  INVALID_CREDENTIALS: "Invalid email or password",
  LOGIN_REQUIRED_FIELDS: "Email and password are required",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
  PASSWORD_RESET_GENERIC_RESPONSE:
    "If an account exists for this email, password reset instructions have been sent.",
  PASSWORD_RESET_INVALID: "This password reset link is invalid or has expired",
  PASSWORD_RESET_REQUIRED_FIELDS: "Reset token and new password are required",
  PASSWORD_RESET_SUCCESS: "Password reset successfully. You can now sign in.",
  REGISTER_DUPLICATE_EMAIL: "An account with this email already exists",
  REGISTER_REQUIRED_FIELDS: "Name, email, and password are required",
  RESEND_EMAIL_REQUIRED: "Email is required",
  UNVERIFIED_LOGIN: "Please verify your email before signing in."
};

const EMAIL_TEMPLATES = {
  PASSWORD_RESET: {
    subject: "Reset your GenContent Studio password",
    intro: "Use the link below to reset your GenContent Studio password:",
    outro: "If you did not request this change, you can ignore this email."
  },
  VERIFICATION: {
    subject: "Verify your GenContent Studio account",
    intro: "Use the link below to verify your GenContent Studio account:",
    outro: "If you did not create this account, you can ignore this email."
  }
};

module.exports = {
  AUTH_MESSAGES,
  EMAIL_TEMPLATES
};
