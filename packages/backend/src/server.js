const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const connectDatabase = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const imageContentRoutes = require("./routes/imageContentRoutes");
const projectRoutes = require("./routes/projectRoutes");
const textContentRoutes = require("./routes/textContentRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "gencontent-backend"
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "GenContent Studio API is ready.",
    routes: ["/api/auth", "/api/users", "/api/projects", "/api/chats", "/api/text-content", "/api/image-content"]
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/text-content", textContentRoutes);
app.use("/api/image-content", imageContentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
