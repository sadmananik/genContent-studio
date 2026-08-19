import { Info } from "lucide-react";

const STRENGTH_LEVELS = {
  low: { label: "Low", bars: 1 },
  medium: { label: "Medium", bars: 2 },
  strong: { label: "Strong", bars: 3 }
};

export default function PasswordStrength({ password }) {
  if (!password) {
    return null;
  }

  const strength = getPasswordStrength(password);
  const level = STRENGTH_LEVELS[strength];

  return (
    <div className="password-strength" data-strength={strength} aria-live="polite">
      <div className="password-strength-heading">
        <span>
          Password strength: <strong>{level.label}</strong>
        </span>
        <span className="password-info">
          <button aria-label="Password requirements" type="button">
            <Info aria-hidden="true" size={16} />
          </button>
          <span className="password-tooltip" role="tooltip">
            Use 8 or more characters with uppercase, lowercase, a number, and a symbol.
          </span>
        </span>
      </div>
      <div className="password-strength-bars" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span className={bar <= level.bars ? "active" : ""} key={bar} />
        ))}
      </div>
    </div>
  );
}

function getPasswordStrength(password) {
  const score = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;

  if (score >= 4) {
    return "strong";
  }

  if (score >= 2) {
    return "medium";
  }

  return "low";
}
