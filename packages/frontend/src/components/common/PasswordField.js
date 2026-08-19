"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

export default function PasswordField({ id, label, name, placeholder, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = id || name;

  return (
    <div className="auth-field password-field">
      <LockKeyhole aria-hidden="true" size={17} strokeWidth={1.8} />
      <input
        {...inputProps}
        aria-label={label || placeholder}
        id={inputId}
        name={name}
        placeholder={placeholder}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        className="password-toggle"
        onClick={() => setIsVisible((currentValue) => !currentValue)}
        title={isVisible ? "Hide password" : "Show password"}
        type="button"
      >
        {isVisible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
      </button>
    </div>
  );
}
