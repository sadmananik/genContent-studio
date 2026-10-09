import { useMemo } from "react";
import { ChevronDown, FileText, FolderKanban, Image as ImageIcon, Users } from "lucide-react";
import { StatGrid } from "./Cards";
import { DASHBOARD_TEXT, SUMMARY_CARD_LABELS } from "../../constants/dashboard";
import {
  API_PROJECT_TYPES,
  PROJECT_TYPES,
  CONTENT_CATEGORY_SUMMARY_LABELS
} from "../../constants/content";

export default function ProjectOverview({ projects }) {
  const summaryCards = useMemo(() => buildSummaryCards(projects), [projects]);
  const categories = useMemo(() => {
    const counts = new Map();
    projects.forEach((project) => {
      const category = project.category || "Other";
      const label = CONTENT_CATEGORY_SUMMARY_LABELS[category] || category;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts, ([label, count]) => ({ label, count })).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label)
    );
  }, [projects]);
  return (
    <section
      aria-label="Project overview"
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="p-4">
        <h2 className="text-base font-bold text-slate-800">Project overview</h2>
        <p className="mt-1 text-sm text-slate-500">Counts and content categories</p>
      </header>
      <div className="space-y-4 border-t border-slate-100 p-4">
        <StatGrid items={summaryCards} label={DASHBOARD_TEXT.PROJECT_SUMMARY} compact />
        <details className="group rounded-xl border border-slate-200">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 text-sm font-bold text-slate-800 hover:bg-violet-50 [&::-webkit-details-marker]:hidden">
            Content categories
            <ChevronDown
              size={18}
              aria-hidden="true"
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          {categories.length ? (
            <div
              className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              role="img"
              aria-label={`Projects by content category: ${categories.map(({ label, count }) => `${label}: ${count}`).join(", ")}`}
            >
              {categories.map(({ label, count }) => {
                const total = categories.reduce((sum, item) => sum + item.count, 0);
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="text-slate-500">
                        <strong className="text-violet-700">{count}</strong> · {percentage}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">
              Create a project to see your content category breakdown.
            </p>
          )}
        </details>
      </div>
    </section>
  );
}

function buildSummaryCards(projects) {
  const textCount = projects.filter((project) => project.type === API_PROJECT_TYPES.TEXT).length;
  const imageCount = projects.filter((project) => project.type === API_PROJECT_TYPES.IMAGE).length;
  const sharedCount = projects.filter((project) => (project.collaborators || []).length > 0).length;

  return [
    {
      icon: <FolderKanban aria-hidden="true" size={19} strokeWidth={2.25} />,
      value: String(projects.length),
      label: SUMMARY_CARD_LABELS.TOTAL,
      tone: "violet"
    },
    {
      icon: <FileText aria-hidden="true" size={19} strokeWidth={2.25} />,
      value: String(textCount),
      label: SUMMARY_CARD_LABELS.TEXT,
      tone: "mint"
    },
    {
      icon: <ImageIcon aria-hidden="true" size={19} strokeWidth={2.25} />,
      value: String(imageCount),
      label: SUMMARY_CARD_LABELS.IMAGE,
      tone: "lavender"
    },
    {
      icon: <Users aria-hidden="true" size={19} strokeWidth={2.25} />,
      value: String(sharedCount),
      label: SUMMARY_CARD_LABELS.SHARED,
      tone: "amber"
    }
  ];
}
