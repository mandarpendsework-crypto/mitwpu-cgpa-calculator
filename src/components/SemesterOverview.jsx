import { BookOpen, Coins, FileText, PenLine } from "lucide-react";
import StatCard from "./StatCard.jsx";
import { SEMESTER } from "../data/subjects.js";
import { getDirectSubjects, getEndTermSubjects, getTotalCredits } from "../utils/calculator.js";

export default function SemesterOverview({ subjects }) {
  return (
    <section aria-labelledby="overview-title">
      <div className="mb-3">
        <h2 id="overview-title" className="text-lg font-semibold">Semester overview</h2>
        <p className="text-sm text-slate-500">
          {SEMESTER.program} · {SEMESTER.university}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Subjects" value={subjects.length} tone="blue" />
        <StatCard icon={Coins} label="Total credits" value={getTotalCredits(subjects)} tone="violet" />
        <StatCard icon={FileText} label="With end-term exam" value={getEndTermSubjects(subjects).length} tone="green" />
        <StatCard icon={PenLine} label="Direct /100 entry" value={getDirectSubjects(subjects).length} tone="blue" />
      </div>
    </section>
  );
}
