/*
 * One-time production data replacement: swaps the sample students for the real
 * class roster and refreshes the faculty-evaluation form text from the official
 * documents. Run once, against the real project.
 *
 *   node scripts/import-real-data.mjs --roster scripts/local/real-roster.json
 *
 * Needs serviceAccount.json in the project root. Safe to re-run: it always
 * fully replaces the `students` collection with the roster file's contents,
 * and only ABORTS (does nothing) if any responses already exist, so it can
 * never silently orphan real submitted answers.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { FACEVAL, SURVEY } from "./seed-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };
const force = args.includes("--force");

const saPath = resolve(root, "serviceAccount.json");
if (!existsSync(saPath)) {
  console.error(`\n✖ ${saPath} not found. This must run against the real project, not the emulator.\n`);
  process.exit(1);
}
const rosterPath = resolve(root, opt("--roster") || "scripts/local/real-roster.json");
if (!existsSync(rosterPath)) {
  console.error(`\n✖ ${rosterPath} not found.\n`);
  process.exit(1);
}
const roster = JSON.parse(readFileSync(rosterPath, "utf8"));
if (!Array.isArray(roster) || !roster.length) {
  console.error("\n✖ Roster file is empty or not a JSON array.\n");
  process.exit(1);
}
for (const s of roster) {
  if (!s.id || !s.name || !Array.isArray(s.load)) {
    console.error("✖ Bad roster row (needs id, name, load[]):", s);
    process.exit(1);
  }
}
const ids = roster.map(s => s.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) {
  console.error("✖ Duplicate student IDs in roster:", [...new Set(dupes)]);
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, "utf8"));
initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

console.log(`\nProject: ${sa.project_id}`);
console.log(`Roster:  ${roster.length} students from ${rosterPath}\n`);

const existingResponses = await db.collection("responses").limit(1).get();
if (!existingResponses.empty && !force) {
  console.error("✖ The `responses` collection already has submissions. Refusing to replace the roster");
  console.error("  (a student's answers would no longer match anyone). Re-run with --force to proceed anyway.\n");
  process.exit(1);
}

const existingStudents = await db.collection("students").get();
console.log(`Deleting ${existingStudents.size} existing student record(s)...`);
for (let i = 0; i < existingStudents.docs.length; i += 400) {
  const batch = db.batch();
  existingStudents.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
  await batch.commit();
}

console.log(`Writing ${roster.length} real student record(s)...`);
for (let i = 0; i < roster.length; i += 400) {
  const batch = db.batch();
  roster.slice(i, i + 400).forEach(s => {
    batch.set(db.doc(`students/${s.id}`), {
      name: s.name,
      group: s.group,
      load: s.load,
      createdAt: new Date(),
    });
  });
  await batch.commit();
}

console.log("Refreshing form text (faceval rationale + section D, survey unchanged)...");
const facevalScale = FACEVAL.scale.map(([value, label]) => ({ value, label }));
const surveyScale = SURVEY.scale.map(([value, label]) => ({ value, label }));
await db.doc("forms/faceval").set({ ...FACEVAL, scale: facevalScale, updatedAt: new Date() }, { merge: true });
await db.doc("forms/survey").set({ ...SURVEY, scale: surveyScale, updatedAt: new Date() }, { merge: true });

console.log(`\n✔ Done. ${roster.length} real students are now live.\n`);
process.exit(0);
