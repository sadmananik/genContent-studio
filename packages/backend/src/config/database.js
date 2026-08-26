const mongoose = require("mongoose");

async function connectDatabase() {
  const isE2E = process.env.NODE_ENV === "e2e";
  const mongoUri = isE2E ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI;

  if (!mongoUri) {
    if (isE2E) {
      throw new Error("MONGODB_URI_TEST is required when NODE_ENV=e2e.");
    }

    console.warn("MONGODB_URI is not set. Database features will be unavailable.");
    return null;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");

  return mongoose.connection;
}

module.exports = connectDatabase;
