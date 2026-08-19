export default function AuthVisual() {
  return (
    <div className="robot-scene" aria-hidden="true">
      <div className="chat-bubble">•••</div>
      <div className="robot">
        <span className="antenna left" />
        <span className="antenna right" />
        <div className="robot-head">
          <i />
          <i />
        </div>
        <div className="robot-body" />
      </div>
    </div>
  );
}
