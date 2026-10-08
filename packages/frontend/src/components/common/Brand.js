import Image from "next/image";

export default function Brand({ compact = false, href = "/", label = "genContent Studio" }) {
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
      {!compact && <strong>{label}</strong>}
    </a>
  );
}
