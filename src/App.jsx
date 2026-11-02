import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import SemesterOverview from "./components/SemesterOverview.jsx";
import ElectiveSelector from "./components/ElectiveSelector.jsx";
import CourseTable from "./components/CourseTable.jsx";
import { TARGET_SGPAS } from "./data/grading.js";
import { ASSESSMENT, ELECTIVES, ENDTERM_SCHEME, SEMESTER, SUBJECTS } from "./data/subjects.js";
import {
  BOUNDARY_GRADES,
  DEFAULT_GRADE_BOUNDARIES,
  areBoundariesOrdered,
  calculateMarksSoFar,
  calculatePredictedSgpa,
  calculateSgpa,
  calculateTargetEndTerms,
  getDirectSubjects,
  getEndTermSubjects,
  getGradePoint,
  resolveSubjects,
} from "./utils/calculator.js";
import { STORAGE_KEYS, loadState, removeState, saveState } from "./utils/storage.js";

function loadElective() {
  const saved = loadState(STORAGE_KEYS.elective, "");
  return ELECTIVES.some((e) => e.id === saved) ? saved : "";
}

// Marks are stored as digit strings keyed by subject id.
function loadMarks() {
  const saved = loadState(STORAGE_KEYS.marks, {});
  if (!saved || typeof saved !== "object") return {};
  return Object.fromEntries(
    Object.entries(saved).filter(([, value]) => typeof value === "string" && /^\d+$/.test(value))
  );
}

// Grade boundaries are stored as digit strings keyed by grade.
function defaultBoundaries() {
  return Object.fromEntries(
    Object.entries(DEFAULT_GRADE_BOUNDARIES).map(([grade, value]) => [grade, String(value)])
  );
}

function loadBoundaries() {
  const defaults = defaultBoundaries();
  const saved = loadState(STORAGE_KEYS.gradeBoundaries, null);
  if (!saved || typeof saved !== "object") return defaults;
  const merged = { ...defaults };
  for (const grade of Object.keys(merged)) {
    const value = Number(saved[grade]);
    if (Number.isFinite(value) && value >= 0 && value <= 100) {
      merged[grade] = String(Math.round(value));
    }
  }
  return merged;
}

function MarkField({ subject, value, max, onChange, onBlur }) {
  const invalid = value !== "" && Number(value) > max;
  const inputId = `marks-${subject.id}`;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="truncate text-sm font-medium text-slate-700">
          {subject.name}
        </label>
        <span className="shrink-0 text-xs text-slate-400">/{max}</span>
      </div>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(subject.id, e.target.value)}
        onBlur={() => onBlur(subject.id, max)}
        aria-label={`${subject.name}: marks out of ${max}`}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
          invalid
            ? "border-rose-300 bg-rose-50/60 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            : "border-slate-200 bg-white focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
        }`}
      />
      {invalid && (
        <span id={`${inputId}-error`} className="mt-1 block text-xs text-rose-600">
          Cannot exceed {max}
        </span>
      )}
    </div>
  );
}

export default function App() {
  const [electiveId, setElectiveId] = useState(loadElective);
  const [marks, setMarks] = useState(loadMarks);
  const [boundaries, setBoundaries] = useState(loadBoundaries);
  const [hypotheticalEndTerms, setHypotheticalEndTerms] = useState({});
  const [targetSgpa, setTargetSgpa] = useState("8");
  const [customTargetSgpa, setCustomTargetSgpa] = useState("8");

  useEffect(() => {
    saveState(STORAGE_KEYS.elective, electiveId);
  }, [electiveId]);

  useEffect(() => {
    saveState(STORAGE_KEYS.marks, marks);
  }, [marks]);

  useEffect(() => {
    saveState(STORAGE_KEYS.gradeBoundaries, boundaries);
  }, [boundaries]);

  const subjects = useMemo(() => resolveSubjects(SUBJECTS, electiveId), [electiveId]);
  const theorySubjects = useMemo(() => getEndTermSubjects(subjects), [subjects]);
  const directSubjects = useMemo(() => getDirectSubjects(subjects), [subjects]);
  const sgpaResult = useMemo(
    () => calculateSgpa(subjects, marks, boundaries),
    [subjects, marks, boundaries]
  );
  const predictedSgpa = useMemo(
    () => calculatePredictedSgpa(subjects, marks, hypotheticalEndTerms, boundaries),
    [subjects, marks, hypotheticalEndTerms, boundaries]
  );
  const marksSoFar = useMemo(() => calculateMarksSoFar(subjects, marks), [subjects, marks]);
  const targetValue = Number(targetSgpa === "custom" ? customTargetSgpa : targetSgpa);
  const targetResult = useMemo(
    () => subjects.some((subject) => subject.isElective && !subject.isSelected)
      ? { status: "incomplete", missingSubjects: [] }
      : calculateTargetEndTerms(subjects, marks, boundaries, targetValue),
    [subjects, marks, boundaries, targetValue]
  );
  const boundariesOrdered = areBoundariesOrdered(boundaries);

  function handleMarkChange(subjectId, rawValue) {
    const digits = rawValue.replace(/[^0-9]/g, "");
    setMarks((prev) => ({ ...prev, [subjectId]: digits }));
  }

  // Snap out-of-range values back to the maximum once the field is left.
  function handleMarkBlur(subjectId, max) {
    setMarks((prev) => {
      const value = prev[subjectId];
      if (value === undefined || value === "") return prev;
      return Number(value) > max ? { ...prev, [subjectId]: String(max) } : prev;
    });
  }

  function handleHypotheticalChange(subjectId, rawValue) {
    const digits = rawValue.replace(/[^0-9]/g, "");
    setHypotheticalEndTerms((prev) => ({ ...prev, [subjectId]: digits }));
  }

  function handleHypotheticalBlur(subjectId) {
    setHypotheticalEndTerms((prev) => {
      const value = prev[subjectId];
      if (value === undefined || value === "") return prev;
      return Number(value) > ENDTERM_SCHEME.endTermMax
        ? { ...prev, [subjectId]: String(ENDTERM_SCHEME.endTermMax) }
        : prev;
    });
  }

  function handleBoundaryChange(grade, rawValue) {
    const digits = rawValue.replace(/[^0-9]/g, "");
    setBoundaries((prev) => ({ ...prev, [grade]: digits }));
  }

  // Normalise to an integer percentage in 0..100 once the field is left.
  function handleBoundaryBlur(grade) {
    setBoundaries((prev) => {
      const value = prev[grade];
      const normalized = String(Math.min(100, Math.max(0, Number(value) || 0)));
      return normalized === value ? prev : { ...prev, [grade]: normalized };
    });
  }

  function handleRestoreBoundaries() {
    setBoundaries(defaultBoundaries());
  }

  function handleReset() {
    if (window.confirm("Reset all saved data on this device?")) {
      removeState(STORAGE_KEYS.elective);
      removeState(STORAGE_KEYS.marks);
      removeState(STORAGE_KEYS.gradeBoundaries);
      setElectiveId("");
      setMarks({});
      setHypotheticalEndTerms({});
      setBoundaries(defaultBoundaries());
    }
  }

  return (
    <div className="min-h-screen">
      <Header onReset={handleReset} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <SemesterOverview subjects={subjects} />
        <ElectiveSelector value={electiveId} onChange={setElectiveId} />
        <section
          aria-labelledby="marks-title"
          className="rounded-2xl border border-slate-200/70 bg-white shadow-sm"
        >
          <div className="p-5 pb-3">
            <h2 id="marks-title" className="text-lg font-semibold">
              Enter your marks
            </h2>
            <p className="text-sm text-slate-500">
              Internal assessment out of {ENDTERM_SCHEME.internalMax} for theory subjects, and
              direct final marks out of {SEMESTER.maxMarksPerSubject} for labs and practicals.
              End-term exam marks (out of {ENDTERM_SCHEME.endTermMax}) are not open yet.
            </p>
          </div>
          <div className="space-y-5 px-5 pb-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Internal assessment · out of {ENDTERM_SCHEME.internalMax}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {theorySubjects.map((s) => (
                  <MarkField
                    key={s.id}
                    subject={s}
                    value={marks[s.id] ?? ""}
                    max={ENDTERM_SCHEME.internalMax}
                    onChange={handleMarkChange}
                    onBlur={handleMarkBlur}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Direct final · out of {SEMESTER.maxMarksPerSubject}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {directSubjects.map((s) => (
                  <MarkField
                    key={s.id}
                    subject={s}
                    value={marks[s.id] ?? ""}
                    max={SEMESTER.maxMarksPerSubject}
                    onChange={handleMarkChange}
                    onBlur={handleMarkBlur}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="marks-so-far-title"
          className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
        >
          <div className="mb-4">
            <h2 id="marks-so-far-title" className="text-lg font-semibold">Marks till now</h2>
            <p className="text-sm text-slate-500">
              Accumulated marks from entered theory internals and completed labs/practicals.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-violet-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Theory internals
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-800">
                {marksSoFar.theory.earned}/{marksSoFar.theory.possible}
              </div>
              <div className="text-xs text-slate-500">
                {marksSoFar.theory.count} of {marksSoFar.theory.total} entered · out of 60 each
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Labs &amp; practicals
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-800">
                {marksSoFar.direct.earned}/{marksSoFar.direct.possible}
              </div>
              <div className="text-xs text-slate-500">
                {marksSoFar.direct.count} of {marksSoFar.direct.total} completed · out of 100 each
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Entered marks combined
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-800">
                {marksSoFar.earned}/{marksSoFar.possible}
              </div>
              <div className="text-xs text-slate-500">
                {marksSoFar.count} of {marksSoFar.total} subjects with marks entered
              </div>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="target-sgpa-title"
          className="rounded-2xl border border-slate-200/70 bg-white shadow-sm"
        >
          <div className="p-5 pb-3">
            <h2 id="target-sgpa-title" className="text-lg font-semibold">
              Target SGPA &amp; end-term marks finder
            </h2>
            <p className="text-sm text-slate-500">
              Find the fewest combined marks across your five end-term exams needed to reach your
              target, using your current lab grades and the configured grade boundaries.
            </p>
          </div>
          <div className="space-y-4 px-5 pb-5">
            <div className="flex flex-wrap items-end gap-3">
              <label htmlFor="target-sgpa" className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Target SGPA</span>
                <select
                  id="target-sgpa"
                  value={targetSgpa}
                  onChange={(e) => setTargetSgpa(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  {TARGET_SGPAS.map((value) => (
                    <option key={value} value={String(value)}>{value.toFixed(1)}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              {targetSgpa === "custom" && (
                <label htmlFor="custom-target-sgpa" className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Custom target</span>
                  <input
                    id="custom-target-sgpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={customTargetSgpa}
                    onChange={(e) => setCustomTargetSgpa(e.target.value)}
                    className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                </label>
              )}
              <p className="pb-2 text-xs text-slate-500">
                Minimum total exam marks; allocation is optimized across subjects by credit and grade.
              </p>
            </div>
            {!Number.isFinite(targetValue) || targetValue < 0 || targetValue > 10 ? (
              <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                Enter a target SGPA between 0 and 10.
              </p>
            ) : targetResult.status === "incomplete" ? (
              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-medium">Complete marks entry to calculate your target.</p>
                <p className="mt-1">
                  Enter valid marks for all five theory internals and all four labs/practicals
                  {subjects.some((subject) => subject.isElective && !subject.isSelected)
                    ? ", and select your program elective"
                    : ""}
                  .
                </p>
              </div>
            ) : targetResult.status === "impossible" ? (
              <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
                <p className="font-semibold">
                  This target is not mathematically possible with the current marks.
                </p>
                <p className="mt-1">
                  Even with {ENDTERM_SCHEME.endTermMax}/{ENDTERM_SCHEME.endTermMax} in every
                  end-term exam, the maximum projected SGPA is {targetResult.maximumSgpa.toFixed(2)}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  <p className="font-semibold">
                    This target is mathematically attainable (maximum possible SGPA:{" "}
                    {targetResult.maximumSgpa.toFixed(2)}).
                  </p>
                  <p className="mt-1">
                    Minimum combined end-term marks: {targetResult.marksRequired}/
                    {theorySubjects.length * ENDTERM_SCHEME.endTermMax}. With this allocation,
                    projected SGPA is {targetResult.projectedSgpa.toFixed(2)}.
                  </p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Theory subject</th>
                        <th className="px-4 py-2.5 text-right font-medium">Internal</th>
                        <th className="px-4 py-2.5 text-right font-medium">Minimum end-term</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetResult.requiredMarks.map(({ subject, marks: required }) => (
                        <tr key={subject.id} className="border-t border-slate-100">
                          <td className="px-4 py-2.5">{subject.name}</td>
                          <td className="px-4 py-2.5 text-right">
                            {marks[subject.id]}/{ENDTERM_SCHEME.internalMax}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold">
                            {required}/{ENDTERM_SCHEME.endTermMax}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
        <CourseTable subjects={subjects} />
        <section
          aria-labelledby="grading-title"
          className="rounded-2xl border border-slate-200/70 bg-white shadow-sm"
        >
          <div className="p-5 pb-3">
            <h2 id="grading-title" className="text-lg font-semibold">
              Grading configuration
            </h2>
            <p className="text-sm text-slate-500">
              Minimum percentage required for each grade. Everything below the B boundary is
              awarded FF (0 grade points).
            </p>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {BOUNDARY_GRADES.map((grade) => (
                <label
                  key={grade}
                  htmlFor={`boundary-${grade}`}
                  className="block rounded-xl border border-slate-200 bg-slate-50/60 p-3 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100"
                >
                  <span className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">{grade}</span>
                    <span className="text-xs text-slate-400">{getGradePoint(grade)} pts</span>
                  </span>
                  <input
                    id={`boundary-${grade}`}
                    type="text"
                    inputMode="numeric"
                    value={boundaries[grade]}
                    onChange={(e) => handleBoundaryChange(grade, e.target.value)}
                    onBlur={() => handleBoundaryBlur(grade)}
                    aria-label={`Minimum percentage for grade ${grade}`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                FF · {getGradePoint("FF")} grade points · below {boundaries.B}%
                {!boundariesOrdered && (
                  <span className="ml-2 text-amber-600">
                    Boundaries should decrease from O to B.
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={handleRestoreBoundaries}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
              >
                Restore defaults
              </button>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="what-if-title"
          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-lg"
        >
          <div className="p-5 pb-3">
            <h2 id="what-if-title" className="text-lg font-semibold">
              What-If SGPA Prediction
            </h2>
            <p className="text-sm text-slate-300">
              Try hypothetical end-term marks out of {ENDTERM_SCHEME.endTermMax}. Predicted theory
              grades update live alongside your completed direct subjects; these values do not
              change your saved marks.
            </p>
          </div>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-700 bg-slate-800/70 text-xs uppercase tracking-wide text-slate-300">
                  <th className="px-4 py-2.5 font-medium">Subject</th>
                  <th className="px-3 py-2.5 text-right font-medium">Internal / completed</th>
                  <th className="px-3 py-2.5 text-right font-medium">What-if end-term</th>
                  <th className="px-3 py-2.5 text-right font-medium">Predicted total</th>
                  <th className="px-3 py-2.5 text-center font-medium">Grade</th>
                  <th className="px-3 py-2.5 text-right font-medium">GP</th>
                  <th className="px-4 py-2.5 text-right font-medium">Credits × GP</th>
                </tr>
              </thead>
              <tbody>
                {predictedSgpa.rows.map(({ subject, type, entered, result }) => {
                  const inputId = `what-if-${subject.id}`;
                  const endTermValue = hypotheticalEndTerms[subject.id] ?? "";
                  const invalid = endTermValue !== "" && Number(endTermValue) > ENDTERM_SCHEME.endTermMax;
                  return (
                    <tr key={subject.id} className="border-b border-slate-800 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-100">{subject.name}</td>
                      <td className="px-3 py-3 text-right text-slate-300">
                        {type === "direct"
                          ? result ? `${entered}/100` : "Awaiting marks"
                          : entered === null ? "—" : `${entered}/60`}
                      </td>
                      <td className="px-3 py-2">
                        {type === "theory" ? (
                          <div>
                            <label className="sr-only" htmlFor={inputId}>
                              {subject.name} hypothetical end-term marks out of 40
                            </label>
                            <input
                              id={inputId}
                              type="text"
                              inputMode="numeric"
                              value={endTermValue}
                              placeholder="Enter /40"
                              onChange={(e) => handleHypotheticalChange(subject.id, e.target.value)}
                              onBlur={() => handleHypotheticalBlur(subject.id)}
                              aria-invalid={invalid || undefined}
                              className={`w-28 rounded-lg border px-3 py-2 text-right text-sm text-white outline-none placeholder:text-slate-500 ${
                                invalid
                                  ? "border-rose-400 bg-rose-950/60 focus:ring-2 focus:ring-rose-800"
                                  : "border-slate-600 bg-slate-800 focus:border-violet-400 focus:ring-2 focus:ring-violet-900"
                              }`}
                            />
                            {invalid && (
                              <span className="mt-1 block text-xs text-rose-300">
                                Maximum is {ENDTERM_SCHEME.endTermMax}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="block text-right text-slate-500">Completed</span>
                        )}
                      </td>
                      {result ? (
                        <>
                          <td className="px-3 py-3 text-right font-semibold text-white">
                            {result.total}/100
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                                result.grade === "FF"
                                  ? "bg-rose-900/70 text-rose-200"
                                  : "bg-violet-900/70 text-violet-200"
                              }`}
                            >
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-slate-200">{result.gradePoint}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-200">
                            {result.weighted}
                          </td>
                        </>
                      ) : (
                        <td className="px-3 py-3 text-center text-xs text-slate-400" colSpan={4}>
                          {type === "theory" ? "Enter internal and what-if marks" : "Enter completed marks"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-700 bg-slate-800/70 px-5 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Live predicted SGPA
              </div>
              <div className="text-3xl font-semibold tracking-tight text-white">
                {predictedSgpa.sgpa === null ? "—" : predictedSgpa.sgpa.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">
                {predictedSgpa.predictedTheoryCount} of {predictedSgpa.theoryCount} theory predictions
                {" · "}{predictedSgpa.gradedCredits} credits included
              </div>
            </div>
            {predictedSgpa.sgpa !== null && (
              <div className="text-right font-mono text-xs text-slate-400">
                <div>SGPA = Σ(credits × GP) ÷ Σ(credits)</div>
                <div className="text-sm text-slate-200">
                  {predictedSgpa.totalWeighted} ÷ {predictedSgpa.gradedCredits} ={" "}
                  {predictedSgpa.sgpa.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </section>
        <section
          aria-labelledby="sgpa-title"
          className="rounded-2xl border border-slate-200/70 bg-white shadow-sm"
        >
          <div className="p-5 pb-3">
            <h2 id="sgpa-title" className="text-lg font-semibold">
              Current subject results
            </h2>
            <p className="text-sm text-slate-500">
              Direct subjects are graded from their completed final marks. Theory subjects show
              internal marks only; totals, grades, and the final semester SGPA await end-term marks.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Subject</th>
                  <th className="px-3 py-2.5 text-right font-medium">Credits</th>
                  <th className="px-3 py-2.5 text-right font-medium">Marks</th>
                  <th className="px-3 py-2.5 text-center font-medium">Grade</th>
                  <th className="px-3 py-2.5 text-right font-medium">Grade point</th>
                  <th className="px-5 py-2.5 text-right font-medium">Credits × GP</th>
                </tr>
              </thead>
              <tbody>
                {sgpaResult.rows.map(({ subject, result }) => (
                  <tr
                    key={subject.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">{subject.name}</td>
                    <td className="px-3 py-3 text-right font-medium">{subject.credits}</td>
                    {result && subject.assessment === ASSESSMENT.INTERNAL_ENDTERM ? (
                      <>
                        <td className="px-3 py-3 text-right">{result.entered}/{result.max}</td>
                        <td className="px-3 py-3 text-center text-xs text-amber-700" colSpan={2}>
                          End-term pending
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400">—</td>
                        <td className="px-5 py-3 text-right text-slate-400">—</td>
                      </>
                    ) : result ? (
                      <>
                        <td className="px-3 py-3 text-right">{result.total}/100</td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                              result.grade === "FF"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-violet-50 text-violet-700"
                            }`}
                          >
                            {result.grade}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium">{result.gradePoint}</td>
                        <td className="px-5 py-3 text-right font-medium">{result.weighted}</td>
                      </>
                    ) : (
                      <td className="px-3 py-3 text-center text-xs text-slate-400" colSpan={4}>
                        Awaiting marks
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/70 font-semibold">
                  <td className="px-5 py-3">Total</td>
                  <td className="px-3 py-3 text-right">{sgpaResult.gradedCredits}</td>
                  <td className="px-3 py-3" colSpan={3} />
                  <td className="px-5 py-3 text-right">{sgpaResult.totalWeighted}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/70 bg-slate-50/70 px-5 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Direct-subject SGPA (partial)
              </div>
              <div className="text-3xl font-semibold tracking-tight">
                {sgpaResult.sgpa === null ? "—" : sgpaResult.sgpa.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500">
                {sgpaResult.gradedCount} of {directSubjects.length} direct subjects · {sgpaResult.gradedCredits}{" "}
                credits counted
              </div>
            </div>
            {sgpaResult.sgpa !== null && (
              <div className="text-right font-mono text-xs text-slate-500">
                <div>SGPA = Σ(credits × GP) ÷ Σ(credits)</div>
                <div className="text-sm text-slate-700">
                  {sgpaResult.totalWeighted} ÷ {sgpaResult.gradedCredits} ={" "}
                  {sgpaResult.sgpa.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </section>
        <p className="pb-6 text-center text-xs text-slate-400">
          Your data stays in this browser. Nothing is sent anywhere.
        </p>
        <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-800/60 mt-12">
          Designed &amp; Developed with precision by{" "}
          <span className="font-semibold text-slate-300">Mandar Pendse</span> · MIT-WPU Pune
        </footer>
      </main>
    </div>
  );
}
