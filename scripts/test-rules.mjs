/*
 * Security-rules smoke test against the local emulators.
 *   1) npm run emulators      2) npm run seed:emulator      3) npm run test:rules
 */
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where,
} from "firebase/firestore";

const app = initializeApp({ apiKey: "demo-key", projectId: "demo-lcc", appId: "demo-app" });
const auth = getAuth(app);
const db = getFirestore(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
connectFirestoreEmulator(db, "127.0.0.1", 8085);

let pass = 0, fail = 0;
async function expect(label, shouldPass, fn) {
  let ok;
  try { await fn(); ok = true; } catch { ok = false; }
  if (ok === shouldPass) { pass++; console.log(`  ✔ ${label}`); }
  else { fail++; console.log(`  ✖ ${label}  (expected ${shouldPass ? "allowed" : "denied"}, got ${ok ? "allowed" : "denied"})`); }
}

const SID = "2025-1101", OTHER = "2025-1201";
const course = "Computer Programming 1", instructor = "Engr. Rodel M. Bataga";
const tId = "computer-programming-1-engr-rodel-m-bataga";
const resp = (studentId, formId, targetId, extra = {}) => ({
  studentId, formId, targetId, target: formId === "survey" ? null : course + "||" + instructor,
  course: formId === "survey" ? null : course, instructor: formId === "survey" ? null : instructor,
  answers: { A1: 5 }, at: new Date(), ...extra,
});

console.log("\nSigned out");
await expect("cannot read forms", false, () => getDoc(doc(db, "forms", "faceval")));

console.log("\nStudent " + SID);
const cred = await signInAnonymously(auth);
await expect("cannot bind to a student number that does not exist", false,
  () => setDoc(doc(db, "sessions", cred.user.uid), { studentId: "9999-0000", at: new Date() }));
await expect("can look up own student record", true, () => getDoc(doc(db, "students", SID)));
await expect("binds session to enrolled student", true,
  () => setDoc(doc(db, "sessions", cred.user.uid), { studentId: SID, at: new Date() }));
await expect("cannot rebind session to another student", false,
  () => setDoc(doc(db, "sessions", cred.user.uid), { studentId: OTHER, at: new Date() }));
await expect("cannot list all students", false, () => getDocs(collection(db, "students")));
await expect("can read forms", true, () => getDoc(doc(db, "forms", "faceval")));
await expect("cannot edit forms", false, () => updateDoc(doc(db, "forms", "faceval"), { title: "x" }));
await expect("submits evaluation for own subject", true,
  () => setDoc(doc(db, "responses", `${SID}__faceval__${tId}`), resp(SID, "faceval", tId)));
await expect("cannot submit the same evaluation twice", false,
  () => setDoc(doc(db, "responses", `${SID}__faceval__${tId}`), resp(SID, "faceval", tId)));
await expect("cannot delete a response", false, () => deleteDoc(doc(db, "responses", `${SID}__faceval__${tId}`)));
await expect("cannot evaluate a subject not on the load", false,
  () => setDoc(doc(db, "responses", `${SID}__faceval__discrete-x`),
    resp(SID, "faceval", "discrete-x", { course: "Discrete Structures", instructor: "Mr. Jomar V. Paglinawan" })));
await expect("cannot submit for another student", false,
  () => setDoc(doc(db, "responses", `${OTHER}__survey__once`), resp(OTHER, "survey", "once")));
await expect("submits survey once", true,
  () => setDoc(doc(db, "responses", `${SID}__survey__once`), resp(SID, "survey", "once")));
await expect("reads own responses", true,
  () => getDocs(query(collection(db, "responses"), where("studentId", "==", SID))));
await expect("cannot read everyone's responses", false, () => getDocs(collection(db, "responses")));
await expect("cannot make self admin", false, () => setDoc(doc(db, "admins", cred.user.uid), { email: "x" }));
await signOut(auth);

console.log("\nAdmin");
await signInWithEmailAndPassword(auth, "admin@lcc-bsit.app", "bsit2026");
await expect("lists students", true, () => getDocs(collection(db, "students")));
await expect("reads all responses", true, () => getDocs(collection(db, "responses")));
await expect("edits forms", true, () => updateDoc(doc(db, "forms", "survey"), { subtitle: "First year BSIT, first semester" }));
await expect("cannot alter a submitted response", false,
  () => updateDoc(doc(db, "responses", `${SID}__survey__once`), { answers: {} }));
await signOut(auth);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
