// Pure calculation / data helpers. No React or UI code in this file.
import { ASSESSMENT, ELECTIVES, ENDTERM_SCHEME, SEMESTER } from "../data/subjects.js";
import { GRADE_POINTS } from "../data/grading.js";

export function getTotalCredits(subjects) {
  return subjects.reduce((sum, s) => sum + s.credits, 0);
}

export function getEndTermSubjects(subjects) {
  return subjects.filter((s) => s.assessment === ASSESSMENT.INTERNAL_ENDTERM);
}

export function getDirectSubjects(subjects) {
  return subjects.filter((s) => s.assessment === ASSESSMENT.DIRECT);
}

export function getElectiveById(id) {
  return ELECTIVES.find((e) => e.id === id) || null;
}

// Returns the subject list with the elective slot resolved to the chosen name.
export function resolveSubjects(subjects, electiveId) {
  const elective = getElectiveById(electiveId);
  return subjects.map((s) =>
    s.isElective
      ? { ...s, name: elective ? elective.name : s.name, isSelected: Boolean(elective) }
      : s
  );
}

// ---- Grading (Phase 3) ----

// Editable default grade boundaries: the minimum percentage needed for each
// grade (O 90+, A+ 80+, A 70+, B+ 60+, B 50+). Everything below the B
// boundary is awarded FF. The app lets students edit these; engine code only
// reads them.
export const DEFAULT_GRADE_BOUNDARIES = {
  O: 90,
  "A+": 80,
  A: 70,
  "B+": 60,
  B: 50,
};

// Grades that carry an editable boundary, highest first.
export const BOUNDARY_GRADES = ["O", "A+", "A", "B+", "B"];

export function getGradePoint(grade) {
  const match = GRADE_POINTS.find((g) => g.grade === grade);
  return match ? match.point : 0;
}

// Award the first (highest) grade whose boundary the percentage meets.
// FF is awarded below the B boundary.
export function gradeForPercentage(percent, boundaries) {
  for (const grade of BOUNDARY_GRADES) {
    if (percent >= Number(boundaries[grade])) return grade;
  }
  return "FF";
}

// True when boundaries decrease from O down to B (required for grading to
// match the intended order).
export function areBoundariesOrdered(boundaries) {
  return BOUNDARY_GRADES.every(
    (grade, index) =>
      index === 0 || Number(boundaries[BOUNDARY_GRADES[index - 1]]) >= Number(boundaries[grade])
  );
}

// Direct subjects can be graded from their completed /100 marks. Theory
// subjects remain ungraded until end-term marks are available.
export function calculateSubject(subject, marks, boundaries) {
  const raw = marks[subject.id];
  if (raw === undefined || raw === null || raw === "") return null;
  const entered = Number(raw);
  if (!Number.isFinite(entered)) return null;
  const isDirect = subject.assessment === ASSESSMENT.DIRECT;
  const max = isDirect ? SEMESTER.maxMarksPerSubject : ENDTERM_SCHEME.internalMax;
  if (entered < 0 || entered > max) return null;
  if (!isDirect) {
    return {
      entered,
      max,
      isDirect,
      total: null,
      grade: null,
      gradePoint: null,
      weighted: null,
    };
  }
  const total = Math.round(entered);
  const grade = gradeForPercentage(total, boundaries);
  const gradePoint = getGradePoint(grade);
  return {
    entered,
    max,
    isDirect,
    total,
    grade,
    gradePoint,
    weighted: subject.credits * gradePoint,
  };
}

// The partial SGPA includes completed direct subjects only. Theory rows retain
// their internal marks but are excluded until end-term marks are available.
export function calculateSgpa(subjects, marks, boundaries) {
  const rows = subjects.map((subject) => ({
    subject,
    result: calculateSubject(subject, marks, boundaries),
  }));
  const graded = rows.filter(
    ({ result }) => result !== null && result.gradePoint !== null
  );
  const gradedCount = graded.length;
  const gradedCredits = graded.reduce((sum, row) => sum + row.subject.credits, 0);
  const totalWeighted = graded.reduce((sum, row) => sum + row.result.weighted, 0);
  const sgpa = gradedCredits > 0 ? totalWeighted / gradedCredits : null;
  return { rows, gradedCount, gradedCredits, totalWeighted, sgpa };
}

export function calculatePredictedSgpa(subjects, marks, hypotheticalEndTerms, boundaries) {
  const rows = subjects.map((subject) => {
    const raw = marks[subject.id];
    const entered = Number(raw);
    if (subject.assessment === ASSESSMENT.DIRECT) {
      const result = calculateSubject(subject, marks, boundaries);
      return {
        subject,
        type: "direct",
        entered: result?.entered ?? null,
        result,
      };
    }

    const rawEndTerm = hypotheticalEndTerms[subject.id];
    const endTerm = Number(rawEndTerm);
    if (
      raw === undefined ||
      raw === null ||
      raw === "" ||
      !Number.isFinite(entered) ||
      entered < 0 ||
      entered > ENDTERM_SCHEME.internalMax ||
      rawEndTerm === undefined ||
      rawEndTerm === null ||
      rawEndTerm === "" ||
      !Number.isFinite(endTerm) ||
      endTerm < 0 ||
      endTerm > ENDTERM_SCHEME.endTermMax
    ) {
      return {
        subject,
        type: "theory",
        entered: Number.isFinite(entered) ? entered : null,
        endTerm: Number.isFinite(endTerm) ? endTerm : null,
        result: null,
      };
    }

    const total = entered + endTerm;
    const grade = gradeForPercentage(total, boundaries);
    const gradePoint = getGradePoint(grade);
    return {
      subject,
      type: "theory",
      entered,
      endTerm,
      result: {
        total,
        grade,
        gradePoint,
        weighted: subject.credits * gradePoint,
      },
    };
  });

  const graded = rows.filter((row) => row.result !== null);
  const gradedCount = graded.length;
  const gradedCredits = graded.reduce((sum, row) => sum + row.subject.credits, 0);
  const totalWeighted = graded.reduce((sum, row) => sum + row.result.weighted, 0);
  const sgpa = gradedCredits > 0 ? totalWeighted / gradedCredits : null;
  const predictedTheoryCount = rows.filter(
    (row) => row.type === "theory" && row.result !== null
  ).length;

  return {
    rows,
    gradedCount,
    gradedCredits,
    totalWeighted,
    predictedTheoryCount,
    theoryCount: getEndTermSubjects(subjects).length,
    sgpa,
  };
}

export function calculateMarksSoFar(subjects, marks) {
  const theory = { earned: 0, possible: 0, count: 0, total: getEndTermSubjects(subjects).length };
  const direct = { earned: 0, possible: 0, count: 0, total: getDirectSubjects(subjects).length };

  for (const subject of subjects) {
    const raw = marks[subject.id];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = Number(raw);
    const isDirect = subject.assessment === ASSESSMENT.DIRECT;
    const max = isDirect ? SEMESTER.maxMarksPerSubject : ENDTERM_SCHEME.internalMax;
    if (!Number.isFinite(value) || value < 0 || value > max) continue;

    const summary = isDirect ? direct : theory;
    summary.earned += value;
    summary.possible += max;
    summary.count += 1;
  }

  return {
    theory,
    direct,
    earned: theory.earned + direct.earned,
    possible: theory.possible + direct.possible,
    count: theory.count + direct.count,
    total: theory.total + direct.total,
  };
}

export function calculateTargetEndTerms(subjects, marks, boundaries, targetSgpa) {
  const theorySubjects = getEndTermSubjects(subjects);
  const directSubjects = getDirectSubjects(subjects);
  const minimumEndTermMarks = Math.ceil(ENDTERM_SCHEME.endTermMax * 0.4);
  const target = Number(targetSgpa);
  if (!Number.isFinite(target) || target < 0 || target > 10) {
    return { status: "invalid-target" };
  }
  const missingSubjects = subjects.filter((subject) => {
    const raw = marks[subject.id];
    const max = subject.assessment === ASSESSMENT.DIRECT
      ? SEMESTER.maxMarksPerSubject
      : ENDTERM_SCHEME.internalMax;
    const value = Number(raw);
    return raw === undefined || raw === "" || !Number.isFinite(value) || value < 0 || value > max;
  });

  if (missingSubjects.length > 0) {
    return { status: "incomplete", missingSubjects };
  }

  const totalCredits = getTotalCredits(subjects);
  const directWeighted = directSubjects.reduce((sum, subject) => {
    const result = calculateSubject(subject, marks, boundaries);
    return sum + subject.credits * result.gradePoint;
  }, 0);

  const gradeChoices = theorySubjects.map((subject) => {
    const internal = Number(marks[subject.id]);
    const minimumEndTermByPoint = new Map();
    for (
      let endTerm = minimumEndTermMarks;
      endTerm <= ENDTERM_SCHEME.endTermMax;
      endTerm += 1
    ) {
      const grade = gradeForPercentage(internal + endTerm, boundaries);
      const gradePoint = getGradePoint(grade);
      if (!minimumEndTermByPoint.has(gradePoint)) {
        minimumEndTermByPoint.set(gradePoint, endTerm);
      }
    }
    return [...minimumEndTermByPoint].map(([gradePoint, endTerm]) => ({
      gradePoint,
      weighted: subject.credits * gradePoint,
      endTerm,
    }));
  });

  const maximumWeighted = directWeighted + theorySubjects.reduce((sum, subject) => {
    const maxTotal = Number(marks[subject.id]) + ENDTERM_SCHEME.endTermMax;
    return sum + subject.credits * getGradePoint(gradeForPercentage(maxTotal, boundaries));
  }, 0);
  const targetWeighted = target * totalCredits;
  if (maximumWeighted + 1e-9 < targetWeighted) {
    return {
      status: "impossible",
      maximumSgpa: maximumWeighted / totalCredits,
      maximumWeighted,
      targetWeighted,
    };
  }

  let possibilities = new Map([[0, { marksRequired: 0, endTerms: [] }]]);
  for (const choices of gradeChoices) {
    const next = new Map();
    for (const [weighted, state] of possibilities) {
      for (const choice of choices) {
        const newWeighted = weighted + choice.weighted;
        const marksRequired = state.marksRequired + choice.endTerm;
        const existing = next.get(newWeighted);
        if (!existing || marksRequired < existing.marksRequired) {
          next.set(newWeighted, {
            marksRequired,
            endTerms: [...state.endTerms, choice.endTerm],
          });
        }
      }
    }
    possibilities = next;
  }

  let best = null;
  for (const [weighted, state] of possibilities) {
    const totalWeighted = directWeighted + weighted;
    if (totalWeighted + 1e-9 < targetWeighted) continue;
    if (!best || state.marksRequired < best.marksRequired) {
      best = { ...state, totalWeighted };
    }
  }

  return {
    status: "attainable",
    maximumSgpa: maximumWeighted / totalCredits,
    requiredMarks: theorySubjects.map((subject, index) => ({
      subject,
      marks: best.endTerms[index],
    })),
    marksRequired: best.marksRequired,
    projectedSgpa: best.totalWeighted / totalCredits,
  };
}
