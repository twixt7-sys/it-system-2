/*
 * One-time setup of the Firestore database.
 *
 *   npm run seed -- --password YourAdminPassword
 *   npm run seed:emulator            (local emulators, admin password bsit2026)
 *
 * Needs serviceAccount.json in the project root
 * (Firebase console -> Project settings -> Service accounts -> Generate new private key).
 *
 * What it does (safe to run again):
 *   - creates / updates the admin login  admin@<VITE_ADMIN_EMAIL_DOMAIN>  and marks it as admin
 *   - creates the two forms if they don't exist yet   (--force-forms overwrites them)
 *   - creates the 12 sample students if they don't exist yet   (--no-students skips them)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { FORMS, STUDENTS } from "./seed-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = name => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };

function readEnvLocal() {
  const p = resolve(root, ".env.local");
  if (!existsSync(p)) return {};
  return Object.fromEntries(
    readFileSync(p, "utf8").split(/\r?\n/)
      .map(l => l.trim()).filter(l => l && !l.startsWith("#") && l.includes("="))
      .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
  );
}

const env = readEnvLocal();
const emulator = flag("--emulator");
const saPath = resolve(root, opt("--key") || "serviceAccount.json");
if (!emulator && !existsSync(saPath)) {
  console.error(`\n✖ ${saPath} not found.\n  Download it from Firebase console -> Project settings -> Service accounts -> Generate new private key,\n  and save it in the project root as serviceAccount.json\n`);
  process.exit(1);
}
const password = opt("--password") || process.env.ADMIN_PASSWORD;
if (!password || password.length < 6) {
  console.error("\n✖ Give the admin password (at least 6 characters):\n  npm run seed -- --password YourAdminPassword\n");
  process.exit(1);
}
const domain = (emulator ? null : env.VITE_ADMIN_EMAIL_DOMAIN) || "lcc-bsit.app";
const adminEmail = opt("--email") || `admin@${domain}`;

let sa;
if (emulator) {
  // local Firebase emulators (npm run emulators) — no service account needed
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8085";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  sa = { project_id: "demo-lcc" };
  initializeApp({ projectId: sa.project_id });
} else {
  sa = JSON.parse(readFileSync(saPath, "utf8"));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
}
const auth = getAuth();
const db = getFirestore();

console.log(`\nSeeding project: ${sa.project_id}\n`);

/* ---- admin account ---- */
let adminUser;
try {
  adminUser = await auth.getUserByEmail(adminEmail);
  await auth.updateUser(adminUser.uid, { password });
  console.log(`✔ Admin login updated: ${adminEmail}`);
} catch (e) {
  if (e.code !== "auth/user-not-found") throw e;
  adminUser = await auth.createUser({ email: adminEmail, password, displayName: "Administrator" });
  console.log(`✔ Admin login created: ${adminEmail}`);
}
await db.doc(`admins/${adminUser.uid}`).set({ email: adminEmail, createdAt: FieldValue.serverTimestamp() }, { merge: true });
console.log(`✔ admins/${adminUser.uid} marked as administrator`);

/* ---- forms ---- */
for (const form of FORMS) {
  const ref = db.doc(`forms/${form.id}`);
  const snap = await ref.get();
  if (snap.exists && !flag("--force-forms")) {
    console.log(`• forms/${form.id} already exists, kept as is (use --force-forms to overwrite)`);
    continue;
  }
  // Firestore can't store nested arrays: scale [[5,"Excellent"],...] -> [{value,label}]
  const scale = form.scale.map(([value, label]) => ({ value, label }));
  await ref.set({ ...form, scale, updatedAt: FieldValue.serverTimestamp() });
  console.log(`✔ forms/${form.id} written (${form.sections.length} sections)`);
}

/* ---- students ---- */
if (!flag("--no-students")) {
  let added = 0;
  const batch = db.batch();
  for (const s of STUDENTS) {
    const ref = db.doc(`students/${s.id}`);
    if ((await ref.get()).exists) continue;
    batch.set(ref, { name: s.name, group: s.group, load: s.load, createdAt: FieldValue.serverTimestamp() });
    added++;
  }
  await batch.commit();
  console.log(`✔ ${added} sample students added (${STUDENTS.length - added} already existed)`);
}

console.log(`\nDone. Sign in as Administrator with username "admin" and the password you gave.\n`);
process.exit(0);
