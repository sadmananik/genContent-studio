import Image from "next/image";

export default function Brand({ compact = false }) {
  return (
    <div className="brand">
      <Image
        alt=""
        aria-hidden="true"
        className="brand-mark"
        height={40}
        src="/gencontent-logo.png"
        width={40}
      />
      {!compact && <strong>genContent Studio</strong>}
    </div>
  );
}
