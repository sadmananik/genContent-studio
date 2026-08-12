const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("MONGODB_URI is not set. Database features will be unavailable.");
    return null;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");

  return mongoose.connection;
}

module.exports = connectDatabase;
