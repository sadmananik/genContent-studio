const mongoose = require("mongoose");

const templatePreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Template" }],
    recentlyUsed: [
      {
        template: { type: mongoose.Schema.Types.ObjectId, ref: "Template", required: true },
        usedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("TemplatePreference", templatePreferenceSchema);
