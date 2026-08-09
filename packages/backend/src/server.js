const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

// Prefer packages/backend/.env over any machine-level OPENAI_* variables.
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

const openaiRoutes = require("./routes/openai");

const app = express();
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "gencontent-backend"
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "GenContent Studio API is ready.",
    openaiPrototype: {
      auth: "GET /api/openai/auth",
      text: "POST /api/openai/text",
      image: "POST /api/openai/image"
    }
  });
});

app.use("/api/openai", openaiRoutes);

app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});
