const mongoose = require("mongoose");
const httpError = require("../utils/httpError");

function validateObjectId(paramName) {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return next(httpError(400, `Invalid ${paramName}`));
    }

    return next();
  };
}

module.exports = validateObjectId;
