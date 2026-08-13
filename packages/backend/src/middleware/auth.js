const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const httpError = require("../utils/httpError");

function requireUser(req, res, next) {
  const authHeader = req.header("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(httpError(401, "Missing bearer token"));
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(httpError(500, "JWT_SECRET is not configured"));
  }

  try {
    const payload = jwt.verify(token, secret);

    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
      return next(httpError(401, "Invalid bearer token"));
    }

    req.user = { id: payload.userId };
    return next();
  } catch (error) {
    return next(httpError(401, "Invalid or expired bearer token"));
  }
}

module.exports = requireUser;
