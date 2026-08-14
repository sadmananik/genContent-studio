import { IconBadge } from "./Cards";

export default function PlaceholderPage({
  title,
  description = "Protected route placeholder for future workspace content."
}) {
  return (
    <main className="p-5 md:p-7">
      <div className="placeholder-panel">
        <IconBadge tone="lavender">▱</IconBadge>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </main>
  );
}
