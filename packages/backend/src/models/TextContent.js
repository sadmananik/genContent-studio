const mongoose = require("mongoose");

const textContentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: ""
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TextContent", textContentSchema);
