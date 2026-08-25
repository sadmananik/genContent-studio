const nodemailer = require("nodemailer");

let transporter;

async function sendPasswordResetEmail({ email, expiresInMinutes, name, resetUrl }) {
  const subject = "Reset your GenContent Studio password";
  const text = [
    `Hello ${name},`,
    "",
    "Use the link below to reset your GenContent Studio password:",
    resetUrl,
    "",
    getLinkExpiryCopy(expiresInMinutes),
    "If you did not request this change, you can ignore this email."
  ].join("\n");

  if (shouldUseConsoleDelivery()) {
    logEmailToConsole({ email, subject, text });
    return;
  }

  await getTransporter().sendMail({
    from: requireEmailFrom(),
    to: email,
    subject,
    text
  });
}

async function sendEmailVerificationEmail({ email, expiresInMinutes, name, verificationUrl }) {
  const subject = "Verify your GenContent Studio account";
  const text = [
    `Hello ${name},`,
    "",
    "Use the link below to verify your GenContent Studio account:",
    verificationUrl,
    "",
    getLinkExpiryCopy(expiresInMinutes),
    "If you did not create this account, you can ignore this email."
  ].join("\n");

  if (shouldUseConsoleDelivery()) {
    logEmailToConsole({ email, subject, text });
    return;
  }

  await getTransporter().sendMail({
    from: requireEmailFrom(),
    to: email,
    subject,
    text
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

function requireEmailFrom() {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  return from;
}

function shouldUseConsoleDelivery() {
  const mode = String(process.env.EMAIL_DELIVERY_MODE || "")
    .trim()
    .toLowerCase();

  if (mode) {
    return mode === "console";
  }

  return !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS;
}

function logEmailToConsole({ email, subject, text }) {
  console.log(
    [
      "----- GenContent Studio email -----",
      `To: ${email}`,
      `Subject: ${subject}`,
      "",
      text,
      "-----------------------------------"
    ].join("\n")
  );
}

module.exports = {
  sendEmailVerificationEmail,
  sendPasswordResetEmail
};
