const mongoose = require("mongoose");
const httpError = require("../utils/httpError");

function requireUser(req, res, next) {
  const userId = req.header("x-user-id");

  if (!userId) {
    return next(httpError(401, "Missing x-user-id header for protected route placeholder"));
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(httpError(400, "Invalid x-user-id header"));
  }

  req.user = { id: userId };
  return next();
}

module.exports = requireUser;
