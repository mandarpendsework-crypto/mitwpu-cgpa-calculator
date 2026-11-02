import { ChevronDown } from "lucide-react";
import { ELECTIVES } from "../data/subjects.js";

export default function ElectiveSelector({ value, onChange }) {
  return (
    <section
      aria-labelledby="elective-title"
      className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
    >
      <h2 id="elective-title" className="text-lg font-semibold">Program Elective I</h2>
      <p className="mb-4 text-sm text-slate-500">
        Choose your elective. It carries 4 credits regardless of selection.
      </p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
        >
          <option value="">Select an elective…</option>
          {ELECTIVES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}. {e.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </section>
  );
}
