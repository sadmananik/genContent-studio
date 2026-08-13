const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DATABASE || "gencontent_studio"
    });
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }

  return mongoose.connection;
}

function getDatabaseStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  return states[mongoose.connection.readyState] || "unknown";
}

module.exports = connectDatabase;
module.exports.getDatabaseStatus = getDatabaseStatus;
