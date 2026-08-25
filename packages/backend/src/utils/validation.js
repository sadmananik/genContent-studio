const mongoose = require("mongoose");
const httpError = require("./httpError");

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function requireTrimmedString(value, fieldName) {
  const normalized = normalizeString(value);

  if (!normalized) {
    throw httpError(400, `${fieldName} is required`);
  }

  return normalized;
}

function normalizeObjectIdList(values, fieldName) {
  if (values === undefined) {
    return undefined;
  }

  if (!Array.isArray(values)) {
    throw httpError(400, `${fieldName} must be an array`);
  }

  const normalizedIds = [];
  const seenIds = new Set();

  values.forEach((value) => {
    const id = String(value || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw httpError(400, `${fieldName} contains an invalid user id`);
    }

    if (!seenIds.has(id)) {
      seenIds.add(id);
      normalizedIds.push(id);
    }
  });

  return normalizedIds;
}

module.exports = {
  normalizeObjectIdList,
  normalizeString,
  requireTrimmedString
};
