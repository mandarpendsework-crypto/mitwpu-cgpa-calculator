// Safe LocalStorage helpers (never throw, e.g. in private mode).
export const STORAGE_KEYS = {
  elective: "mitwpu-cgpa:sem5:elective",
  marks: "mitwpu-cgpa:sem5:marks",
  gradeBoundaries: "mitwpu-cgpa:sem5:grade-boundaries",
};

export function loadState(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveState(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function removeState(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
