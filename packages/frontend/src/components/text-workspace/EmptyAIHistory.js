export default function EmptyAIHistory() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
      <strong className="block text-slate-800">No AI conversations yet.</strong>
      <span className="mt-1 block">Enter a prompt to start generating content.</span>
    </div>
  );
}
