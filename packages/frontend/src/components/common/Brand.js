export default function Brand({ compact = false }) {
  return (
    <div className="brand">
      <span className="brand-mark">✦</span>
      {!compact && <strong>CreatiFlow AI</strong>}
    </div>
  );
}
