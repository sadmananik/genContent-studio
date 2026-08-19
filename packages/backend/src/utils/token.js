const crypto = require("crypto");
const httpError = require("./httpError");

const DEFAULT_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

function signAuthToken(user) {
  const secret = getTokenSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user._id || user.id),
    iat: now,
    exp: now + getTokenLifetime()
  };

  const encodedHeader = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const encodedPayload = base64UrlEncode(payload);
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyAuthToken(token) {
  const secret = getTokenSecret();
  const parts = token?.split(".");

  if (!parts || parts.length !== 3) {
    throw httpError(401, "Invalid authentication token");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  if (!timingSafeEqual(signature, expectedSignature)) {
    throw httpError(401, "Invalid authentication token");
  }

  const payload = parseBase64UrlJson(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (!payload?.sub) {
    throw httpError(401, "Invalid authentication token");
  }

  if (payload.exp && payload.exp < now) {
    throw httpError(401, "Authentication token has expired");
  }

  return payload;
}

function getTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (!secret) {
    throw httpError(500, "Authentication token secret is not configured");
  }

  return secret;
}

function getTokenLifetime() {
  const configuredLifetime = Number(process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS);
  return Number.isFinite(configuredLifetime) && configuredLifetime > 0
    ? configuredLifetime
    : DEFAULT_TOKEN_EXPIRES_IN_SECONDS;
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch (error) {
    throw httpError(401, "Invalid authentication token");
  }
}

function timingSafeEqual(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

module.exports = {
  signAuthToken,
  verifyAuthToken
};
