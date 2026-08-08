const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

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
    message: "GenContent Studio API is ready."
  });
});

app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});
