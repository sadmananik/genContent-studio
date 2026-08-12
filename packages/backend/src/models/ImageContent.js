const mongoose = require("mongoose");

const imageContentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    generationPrompt: {
      type: String,
      trim: true
    },
    canvasState: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImageContent", imageContentSchema);
