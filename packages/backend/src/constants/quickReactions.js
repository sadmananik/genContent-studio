const QUICK_REACTIONS = [
  ["hi", "👋", "Hi"],
  ["still-there", "👀", "You still there?"],
  ["yes", "✅", "Yes"],
  ["no", "❌", "No"],
  ["looks-good", "👍", "Looks good"],
  ["perfect", "👌", "Perfect"],
  ["hmm", "🤔", "Hmm..."],
  ["wait", "✋", "Wait"],
  ["done", "✅", "Done"],
  ["working", "⏳", "Working on it"],
  ["check-this", "👀", "Check this"],
  ["great", "🔥", "Great!"],
  ["nice-work", "👏", "Nice work!"],
  ["celebrate", "🎉", "Awesome!"]
].map(([id, emoji, label]) => ({ id, emoji, label }));

const QUICK_REACTION_BY_ID = new Map(QUICK_REACTIONS.map((reaction) => [reaction.id, reaction]));

module.exports = { QUICK_REACTION_BY_ID };
