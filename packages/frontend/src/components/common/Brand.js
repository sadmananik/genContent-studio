export default function Brand({ compact = false }) {
  return (
    <div className="brand">
      <img alt="" aria-hidden="true" className="brand-mark" src="/gencontent-logo.png" />
      {!compact && <strong>genContent Studio</strong>}
    </div>
  );
}
