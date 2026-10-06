const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    responseId: { type: String, required: true },
    canvasState: { type: mongoose.Schema.Types.Mixed, required: true },
    generationPrompt: String
  },
  { timestamps: true }
);
schema.index({ project: 1, responseId: 1 }, { unique: true });
module.exports = mongoose.model("ImageCanvasSnapshot", schema);
