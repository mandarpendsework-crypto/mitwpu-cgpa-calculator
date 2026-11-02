// Grade-point reference from an MIT-WPU grade card.
// IMPORTANT: this is a letter -> grade point mapping ONLY.
// Marks -> grade boundaries are NOT confirmed and are deliberately not defined here.
// Editable boundaries (with defaults) live in ../utils/calculator.js.

export const GRADE_POINTS = [
  { grade: "O", point: 10 },
  { grade: "A+", point: 9 },
  { grade: "A", point: 8 },
  { grade: "B+", point: 7 },
  { grade: "B", point: 6 },
  { grade: "FF", point: 0 },
];

export const TARGET_SGPAS = [7, 7.5, 8, 8.5, 9, 9.5, 10];
