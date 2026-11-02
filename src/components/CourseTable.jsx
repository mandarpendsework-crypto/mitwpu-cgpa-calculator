import { ASSESSMENT, ENDTERM_SCHEME } from "../data/subjects.js";
import { getTotalCredits } from "../utils/calculator.js";

function AssessmentBadge({ type }) {
  if (type === ASSESSMENT.INTERNAL_ENDTERM) {
    return (
      <span className="inline-block rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
        Internal {ENDTERM_SCHEME.internalMax} + End-term {ENDTERM_SCHEME.endTermMax}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      Direct /100
    </span>
  );
}

export default function CourseTable({ subjects }) {
  return (
    <section
      aria-labelledby="courses-title"
      className="rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="p-5 pb-3">
        <h2 id="courses-title" className="text-lg font-semibold">Semester V courses</h2>
        <p className="text-sm text-slate-500">Each subject is evaluated out of 100 marks.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2.5 font-medium">Code</th>
              <th className="px-3 py-2.5 font-medium">Subject</th>
              <th className="px-3 py-2.5 text-right font-medium">Credits</th>
              <th className="px-5 py-2.5 font-medium">Assessment</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">{s.code}</td>
                <td className="px-3 py-3">
                  {s.isElective && !s.isSelected ? (
                    <span className="text-amber-600">Program Elective I (not selected)</span>
                  ) : (
                    s.name
                  )}
                  {s.isElective && s.isSelected && (
                    <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                      Elective
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-medium">{s.credits}</td>
                <td className="px-5 py-3"><AssessmentBadge type={s.assessment} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/70 font-semibold">
              <td className="px-5 py-3" colSpan={2}>Total</td>
              <td className="px-3 py-3 text-right">{getTotalCredits(subjects)}</td>
              <td className="px-5 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
