/* Small helpers ported from the mockup (section 2. STATE + HELPERS). */

export const initials = n =>
  String(n || "").split(" ").filter(w => w.length > 1 && !w.includes(".")).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export const isMobile = () => window.innerWidth <= 620;

export function itemsOf(form) {
  if (!form) return [];
  return form.sections.flatMap(s => s.items.map(i => ({ ...i, kind: s.kind || "likert", sec: s.id })));
}

export function isAnswered(v) {
  return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== "";
}

/* "Computer Programming 1" + "Engr. Rodel M. Bataga" -> "computer-programming-1-engr-rodel-m-bataga" */
export const slug = s =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 300);

export const targetKey = (course, instructor) => course + "||" + instructor;
export const targetIdOf = (course, instructor) => slug(course + "-" + instructor);
export const responseId = (studentId, formId, targetId) => `${studentId}__${formId}__${targetId}`;

/* completion counts, computed from the responses the caller can see */
export function evalDone(student, responses) {
  const ids = new Set(responses.filter(r => r.studentId === student.id && r.formId === "faceval").map(r => r.targetId));
  return (student.load || []).filter(l => ids.has(targetIdOf(l.course, l.instructor))).length;
}
export function surveyDone(student, responses) {
  return responses.some(r => r.studentId === student.id && r.formId === "survey");
}

/* CSV parser from the mockup: header row is lowercased with spaces/underscores removed */
export function parseCSV(t) {
  const lines = t.trim().split(/\r?\n/).filter(Boolean);
  const split = l => {
    const o = []; let c = "", q = false;
    for (const ch of l) {
      if (ch === '"') { q = !q; continue; }
      if (ch === "," && !q) { o.push(c.trim()); c = ""; continue; }
      c += ch;
    }
    o.push(c.trim()); return o;
  };
  const head = split(lines[0]).map(x => x.toLowerCase().replace(/[\s_]/g, ""));
  return lines.slice(1).map(l => { const c = split(l), o = {}; head.forEach((k, i) => (o[k] = c[i] || "")); return o; });
}

export const csvCell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type: type + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Firestore rejects `undefined`; strip it from anything we write (deep). */
export function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object" && !(v instanceof Date) && v.constructor === Object) {
    const o = {};
    for (const [k, x] of Object.entries(v)) if (x !== undefined) o[k] = clean(x);
    return o;
  }
  return v;
}

export const validStudentId = id => !!id && !/[/]/.test(id) && id !== "." && id !== ".." && !/^__.*__$/.test(id) && id.length <= 100;

/* Firestore can't store nested arrays, so a scale like [[5,"Excellent"],...] is kept as [{value,label}].
   Accepts either shape and always returns [{value,label}] sorted high -> low. */
export function normalizeScale(scale) {
  if (!Array.isArray(scale)) return [];
  return scale
    .map(x => (Array.isArray(x) ? { value: Number(x[0]), label: String(x[1] ?? "") } : { value: Number(x?.value), label: String(x?.label ?? "") }))
    .filter(x => Number.isFinite(x.value))
    .sort((a, b) => b.value - a.value);
}
