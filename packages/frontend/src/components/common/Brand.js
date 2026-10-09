import Image from "next/image";

export default function Brand({ compact = false, href = "/", variant = "default" }) {
  return (
    <a className="brand" href={href}>
      <Image
        alt=""
        aria-hidden="true"
        className="brand-mark"
        height={40}
        src="/gencontent-logo.png"
        width={40}
      />
      {!compact &&
        (variant === "sidebar" ? (
          <span className="sidebar-brand-label">
            <strong>GenContent</strong> Studio
          </span>
        ) : (
          <strong>genContent Studio</strong>
        ))}
    </a>
  );
}
