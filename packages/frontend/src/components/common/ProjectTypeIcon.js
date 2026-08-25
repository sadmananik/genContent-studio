import { FileText, Image } from "lucide-react";
import { API_PROJECT_TYPES, PROJECT_TYPES } from "../../constants/content";

export default function ProjectTypeIcon({ size = 19, strokeWidth = 2.25, type }) {
  const isImage = type === PROJECT_TYPES.IMAGE || type === API_PROJECT_TYPES.IMAGE;
  const Icon = isImage ? Image : FileText;

  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />;
}
