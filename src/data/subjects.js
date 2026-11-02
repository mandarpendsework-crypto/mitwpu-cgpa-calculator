// Semester V course structure for MIT-WPU B.Tech CSE.
// Contains no student data. Credits and codes are the shared course structure.

export const SEMESTER = {
  university: "MIT World Peace University, Pune",
  program: "B.Tech Computer Science and Engineering",
  semester: "V",
  totalSubjects: 9,
  totalCredits: 19,
  maxMarksPerSubject: 100,
};

// Assessment modes
export const ASSESSMENT = {
  INTERNAL_ENDTERM: "internal+endterm", // internal /60 + end-term /40
  DIRECT: "direct", // final marks entered directly /100
};

// Split used by the five end-term subjects.
// Internal component structure is intentionally NOT hardcoded here.
export const ENDTERM_SCHEME = {
  internalMax: 60,
  endTermMax: 40,
};

export const ELECTIVE_SLOT_ID = "elective-1";

export const SUBJECTS = [
  { id: "cn", code: "CSE20100", name: "Computer Networks", credits: 3, assessment: ASSESSMENT.INTERNAL_ENDTERM },
  { id: "cn-lab", code: "CSE20110", name: "Computer Networks Laboratory", credits: 1, assessment: ASSESSMENT.DIRECT },
  { id: "iot-lab", code: "CSE20120", name: "Internet of Things Laboratory", credits: 1, assessment: ASSESSMENT.DIRECT },
  { id: ELECTIVE_SLOT_ID, code: "CSE30010", name: "Program Elective I", credits: 4, assessment: ASSESSMENT.INTERNAL_ENDTERM, isElective: true },
  { id: "aies", code: "CSE30060", name: "Artificial Intelligence and Expert Systems", credits: 3, assessment: ASSESSMENT.INTERNAL_ENDTERM },
  { id: "aies-lab", code: "CSE30070", name: "AI and Expert Systems Laboratory", credits: 1, assessment: ASSESSMENT.DIRECT },
  { id: "sem", code: "CSE20130", name: "Software Engineering and Modelling", credits: 3, assessment: ASSESSMENT.INTERNAL_ENDTERM },
  { id: "pbl3", code: "CSE20140", name: "Project Based Learning III", credits: 1, assessment: ASSESSMENT.DIRECT },
  { id: "pce", code: "PCE10030", name: "Managing Conflicts Peacefully: Tools and Techniques", credits: 2, assessment: ASSESSMENT.INTERNAL_ENDTERM },
];

// Every elective carries 4 credits regardless of choice.
export const ELECTIVES = [
  { id: "big-data", label: "A", name: "Big Data Technologies" },
  { id: "graphics", label: "B", name: "Computer Graphics and 3D Modelling" },
  { id: "wireless", label: "C", name: "Wireless and Mobile Networks" },
  { id: "cloud", label: "D", name: "Cloud Computing and DevOps" },
  { id: "digital-ic", label: "E", name: "Digital IC Design" },
];

// Editable starting point for elective internal assessment. Known CCD split
// adds up to 50, not 60, so it is NOT the complete internal scheme.
// Phase 2 will let students edit this.
export const ELECTIVE_ASSESSMENT_TEMPLATE = [
  { id: "labs", name: "Labs", max: 15 },
  { id: "midterm", name: "Midterm", max: 25 },
  { id: "cca1", name: "CCA 1", max: 5 },
  { id: "cca2", name: "CCA 2", max: 5 },
];
