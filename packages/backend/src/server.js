const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const connectDatabase = require("./config/database");
const { attachCollaborationServer } = require("./services/collaborationServer");
const createApp = require("./app");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: path.resolve(__dirname, process.env.NODE_ENV === "e2e" ? "../.env.test" : "../.env")
  });
}

const httpServer = http.createServer(createApp());
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

connectDatabase()
  .then(() => {
    attachCollaborationServer(httpServer, frontendOrigin);
    httpServer.listen(port, () => {
      console.log(`Backend API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
