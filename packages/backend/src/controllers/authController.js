const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, profile } = req.body;

  if (!name || !email || !password) {
    throw httpError(400, "Name, email, and password are required");
  }

  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, profile });

  res.status(201).json({
    user: serializeUser(user),
    token: signToken(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw httpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, "Invalid email or password");
  }

  res.json({
    user: serializeUser(user),
    token: signToken(user)
  });
});

function signToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw httpError(500, "JWT_SECRET is not configured");
  }

  return jwt.sign({ userId: user._id.toString() }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = {
  login,
  register
};
