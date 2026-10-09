import Image from "next/image";
import "./workspace-previews.css";

const PREVIEWS = [
  { image: "dashboard", title: "Project Dashboard", description: "Your unified content workspace" },
  {
    image: "collaboration",
    title: "Real-Time Collaboration",
    description: "Edit together with live cursors and team presence"
  },
  {
    image: "text-workspace",
    title: "AI Writing & Text Editor",
    description: "Draft, refine and optimise content"
  },
  {
    image: "image-workspace",
    title: "Visual Editor & Collaboration",
    description: "Illustrate and create together"
  }
];

export default function WorkspacePreviews({ preview, priority = false, items }) {
  const selectedImages = preview
    ? [preview]
    : items || ["dashboard", "text-workspace", "image-workspace"];
  const previews = selectedImages
    .map((image) => PREVIEWS.find((item) => item.image === image))
    .filter(Boolean);

  return (
    <div className={`workspace-previews${preview ? " workspace-previews-single" : ""}`}>
      {previews.map(({ image, title, description }, index) => (
        <figure className="workspace-preview-card" key={image}>
          <Image
            src={`/images/poster-${image}.svg`}
            alt={`${title} interface preview`}
            width={608}
            height={314}
            priority={priority && index === 0}
          />
          <figcaption>
            <strong>{title}</strong>
            <span>{description}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
