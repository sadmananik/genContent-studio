const mongoose = require("mongoose");

const templateVoteSchema = new mongoose.Schema(
  {
    template: { type: mongoose.Schema.Types.ObjectId, ref: "Template", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voteType: { type: String, enum: ["up", "down"], required: true }
  },
  { timestamps: true }
);

templateVoteSchema.index({ template: 1, user: 1 }, { unique: true });
templateVoteSchema.index({ template: 1, voteType: 1 });

module.exports = mongoose.model("TemplateVote", templateVoteSchema);
