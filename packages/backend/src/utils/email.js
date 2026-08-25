const nodemailer = require("nodemailer");
const { AUTH_MESSAGES, EMAIL_TEMPLATES } = require("../constants/auth");

let transporter;

async function sendPasswordResetEmail({ email, expiresInMinutes, name, resetUrl }) {
  const template = EMAIL_TEMPLATES.PASSWORD_RESET;
  const subject = template.subject;
  const text = [
    `Hello ${name},`,
    "",
    template.intro,
    resetUrl,
    "",
    getLinkExpiryCopy(expiresInMinutes),
    template.outro
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

async function sendPasswordChangeEmail({ email, expiresInMinutes, name, resetUrl }) {
  const template = EMAIL_TEMPLATES.PASSWORD_CHANGE;
  const subject = template.subject;
  const text = [
    `Hello ${name},`,
    "",
    template.intro,
    resetUrl,
    "",
    getLinkExpiryCopy(expiresInMinutes),
    template.outro
  ].join("\n");

  await sendTextEmail({ email, subject, text });
}

async function sendEmailVerificationEmail({ email, expiresInMinutes, name, verificationUrl }) {
  const template = EMAIL_TEMPLATES.VERIFICATION;
  const subject = template.subject;
  const text = [
    `Hello ${name},`,
    "",
    template.intro,
    verificationUrl,
    "",
    getLinkExpiryCopy(expiresInMinutes),
    template.outro
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

async function sendExistingUserProjectInviteEmail({ email, inviterName, projectTitle, sharedUrl }) {
  const template = EMAIL_TEMPLATES.EXISTING_USER_PROJECT_INVITE;
  const subject = template.subject(projectTitle);
  const text = [
    `Hello,`,
    "",
    template.intro(inviterName, projectTitle),
    template.action,
    sharedUrl,
    "",
    "If you were not expecting this invitation, you can ignore this email."
  ].join("\n");

  await sendTextEmail({ email, subject, text });
}

async function sendNewUserProjectInviteEmail({ email, inviterName, projectTitle, registerUrl }) {
  const template = EMAIL_TEMPLATES.NEW_USER_PROJECT_INVITE;
  const subject = template.subject(projectTitle);
  const text = [
    `Hello,`,
    "",
    template.intro(inviterName, projectTitle),
    template.action,
    registerUrl,
    "",
    "If you were not expecting this invitation, you can ignore this email."
  ].join("\n");

  await sendTextEmail({ email, subject, text });
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
    throw new Error(AUTH_MESSAGES.EMAIL_FROM_MISSING);
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

async function sendTextEmail({ email, subject, text }) {
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
  sendExistingUserProjectInviteEmail,
  sendNewUserProjectInviteEmail,
  sendPasswordChangeEmail,
  sendPasswordResetEmail
};
