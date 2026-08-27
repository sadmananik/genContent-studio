import { useEffect, useState } from "react";
import QuickReactionButton from "./QuickReactionButton";
import ReactionLayer from "./ReactionLayer";
import { TOAST_TYPES } from "../common/ToastNotification";
import { QUICK_REACTION_COOLDOWN } from "../../constants/quickReactions";

export default function QuickReactions({ collaborationProvider = null, onNotify }) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestReaction, setLatestReaction] = useState(null);
  const [reactionCooldown, setReactionCooldown] = useState(false);

  useEffect(() => {
    const socket = collaborationProvider?.socket;
    if (!socket) return undefined;

    const handleReaction = (reaction) => setLatestReaction(reaction);
    const handleReactionError = (error) =>
      onNotify?.("Reaction not sent", error.message, TOAST_TYPES.ERROR);

    socket.on("project:quick-reaction", handleReaction);
    socket.on("project:quick-reaction-error", handleReactionError);

    return () => {
      socket.off("project:quick-reaction", handleReaction);
      socket.off("project:quick-reaction-error", handleReactionError);
    };
  }, [collaborationProvider, onNotify]);

  function sendQuickReaction(reactionId) {
    if (!collaborationProvider || reactionCooldown) return;

    collaborationProvider.sendQuickReaction(reactionId);
    setIsOpen(false);
    setReactionCooldown(true);
    window.setTimeout(() => setReactionCooldown(false), QUICK_REACTION_COOLDOWN);
  }

  return (
    <>
      <QuickReactionButton
        disabled={!collaborationProvider || reactionCooldown}
        isOpen={isOpen}
        onSelect={sendQuickReaction}
        onToggle={() => setIsOpen((current) => !current)}
      />
      <ReactionLayer reaction={latestReaction} />
    </>
  );
}
