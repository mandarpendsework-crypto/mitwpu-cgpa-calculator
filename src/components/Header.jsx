import { GraduationCap, RotateCcw } from "lucide-react";
import { SEMESTER } from "../data/subjects.js";

export default function Header({ onReset }) {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight sm:text-lg">
              MIT-WPU CGPA Calculator
            </h1>
            <p className="text-xs text-slate-500">
              Semester {SEMESTER.semester} · SGPA &amp; CGPA predictor
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <RotateCcw size={16} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
