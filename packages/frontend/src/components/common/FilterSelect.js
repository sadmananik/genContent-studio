export default function FilterSelect({ label, onChange, options, value }) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase text-slate-500">
      {label}
      <select
        className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm capitalize text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all"
              ? `All${label === "Category" ? " Categories" : ""}`
              : option.replaceAll("-", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
