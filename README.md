# MIT-WPU CGPA Calculator & SGPA Predictor

A general-purpose calculator for MIT-WPU B.Tech CSE students (Semester V).
It contains no personal marks or student details. All data you enter is stored
only in your own browser (LocalStorage).

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build for deployment

```bash
npm run build
npm run preview
```

## Status

- [x] Phase 1: project setup, Semester V structure, elective selector, dashboard
- [ ] Phase 2: marks input
- [ ] Phase 3: grading configuration
- [ ] Phase 4: SGPA calculator
- [ ] Phase 5: SGPA predictor
- [ ] Phase 6: CGPA calculator
- [ ] Phase 7: dashboard polish, charts, dark mode

## Notes

The editable default grade boundaries are O=90, A+=80, A=70, B+=60, and B=50.
Marks below the B boundary receive FF. The grade-point mapping is O=10, A+=9,
A=8, B+=7, and B=6.
