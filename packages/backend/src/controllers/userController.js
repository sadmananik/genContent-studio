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
  const { name, profile = {} } = req.body;
  const updates = {};

  if (typeof name === "string") {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      throw httpError(400, "Name must be at least 2 characters");
    }

    updates.name = trimmedName;
  }

  if (profile && typeof profile === "object") {
    updates.profile = {
      avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl.trim() : "",
      bio: typeof profile.bio === "string" ? profile.bio.trim() : "",
      role: typeof profile.role === "string" ? profile.role.trim() : ""
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  }).select("-passwordHash");

  if (!user) {
    throw httpError(404, "User not found");
  }

  res.json(user);
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  listUsers
};
