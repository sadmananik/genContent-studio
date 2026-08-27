import { useEffect, useRef, useState } from "react";
import FloatingReaction from "./FloatingReaction";
import { MAX_VISIBLE_REACTIONS, QUICK_REACTION_DURATION } from "../../constants/quickReactions";

export default function ReactionLayer({ reaction }) {
  const [reactions, setReactions] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    if (!reaction) return undefined;
    const id = `${reaction.sentAt}-${reaction.sender.id}`;
    setReactions((current) => [...current, { ...reaction, id }].slice(-MAX_VISIBLE_REACTIONS));
    const timeout = window.setTimeout(() => {
      setReactions((current) => current.filter((item) => item.id !== id));
      timers.current.delete(id);
    }, QUICK_REACTION_DURATION);
    timers.current.set(id, timeout);
  }, [reaction]);

  useEffect(() => () => timers.current.forEach((timeout) => window.clearTimeout(timeout)), []);

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-40 grid gap-2 sm:right-7">
      {reactions.map((item) => (
        <FloatingReaction key={item.id} reaction={item} />
      ))}
    </div>
  );
}
