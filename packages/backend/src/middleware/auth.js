const mongoose = require("mongoose");
const httpError = require("../utils/httpError");
const { verifyAuthToken } = require("../utils/token");

function requireUser(req, res, next) {
  const authorizationHeader = req.header("Authorization") || "";
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(httpError(401, "Missing Bearer authentication token"));
  }

  try {
    const payload = verifyAuthToken(token);

    if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
      return next(httpError(401, "Invalid authentication token"));
    }

    req.user = { id: payload.sub };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = requireUser;
