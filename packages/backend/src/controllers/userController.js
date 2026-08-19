const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");

  if (!user) {
    throw httpError(404, "User not found");
  }

  res.json(user);
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const updates = buildProfileUpdates(req.body);
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  if (!user) {
    throw httpError(404, "User not found");
  }

  res.json(user);
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

function buildProfileUpdates(body = {}) {
  const updates = {};
  const profileUpdates = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = String(body.name || "").trim();

    if (name.length < 2) {
      throw httpError(400, "Name must be at least 2 characters");
    }

    if (name.length > 80) {
      throw httpError(400, "Name must be 80 characters or less");
    }

    updates.name = name;
  }

  if (body.profile && typeof body.profile === "object") {
    if (Object.prototype.hasOwnProperty.call(body.profile, "avatarUrl")) {
      profileUpdates.avatarUrl = normalizeOptionalProfileField(body.profile.avatarUrl, 300);
    }

    if (Object.prototype.hasOwnProperty.call(body.profile, "bio")) {
      profileUpdates.bio = normalizeOptionalProfileField(body.profile.bio, 240);
    }

    if (Object.prototype.hasOwnProperty.call(body.profile, "role")) {
      profileUpdates.role = normalizeOptionalProfileField(body.profile.role, 80);
    }
  }

  Object.entries(profileUpdates).forEach(([field, value]) => {
    updates[`profile.${field}`] = value;
  });

  if (Object.keys(updates).length === 0) {
    throw httpError(400, "No profile fields supplied");
  }

  return updates;
}

function normalizeOptionalProfileField(value, maxLength) {
  const normalized = String(value || "").trim();

  if (normalized.length > maxLength) {
    throw httpError(400, `Profile field must be ${maxLength} characters or less`);
  }

  return normalized;
}

module.exports = {
  getCurrentUser,
  listUsers,
  updateCurrentUser
};
