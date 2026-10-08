"use client";
import { useState } from "react";
import FavoriteButton from "./FavoriteButton";
import { useAppStore } from "../../store";
export default function ProjectFavoriteButton({ projectId, title, isFavorite = false }) {
  const toggle = useAppStore((state) => state.toggleProjectFavorite);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
      <FavoriteButton
        title={title}
        isFavorite={isFavorite}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            await toggle(projectId, !isFavorite);
          } catch (failure) {
            setError(failure.message);
          } finally {
            setPending(false);
          }
        }}
      />
      {error && (
        <p
          role="alert"
          className="absolute right-0 z-50 w-48 rounded border bg-white p-2 text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
