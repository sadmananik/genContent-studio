const nodemailer = require("nodemailer");

let transporter;

async function sendPasswordResetEmail({ email, expiresInMinutes, name, resetUrl }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  await mailer.sendMail({
    from,
    to: email,
    subject: "Reset your GenContent Studio password",
    text: [
      `Hello ${name},`,
      "",
      "Use the link below to reset your GenContent Studio password:",
      resetUrl,
      "",
      getLinkExpiryCopy(expiresInMinutes),
      "If you did not request this change, you can ignore this email."
    ].join("\n")
  });
}

async function sendEmailVerificationEmail({ email, expiresInMinutes, name, verificationUrl }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  await mailer.sendMail({
    from,
    to: email,
    subject: "Verify your GenContent Studio account",
    text: [
      `Hello ${name},`,
      "",
      "Use the link below to verify your GenContent Studio account:",
      verificationUrl,
      "",
      getLinkExpiryCopy(expiresInMinutes),
      "If you did not create this account, you can ignore this email."
    ].join("\n")
  });
}

function getLinkExpiryCopy(expiresInMinutes) {
  const minutes = Number(expiresInMinutes);
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
  const unit = safeMinutes === 1 ? "minute" : "minutes";

  return `This link expires in ${safeMinutes} ${unit} and can only be used once.`;
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is incomplete");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });

  return transporter;
}

module.exports = {
  sendEmailVerificationEmail,
  sendPasswordResetEmail
};
