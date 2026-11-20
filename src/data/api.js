/* Every Firestore / Auth write in the app goes through here. */
import {
  signInAnonymously, signInWithEmailAndPassword, signOut as fbSignOut,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { auth, db, ADMIN_EMAIL_DOMAIN } from "../firebase";
import { targetIdOf, targetKey, responseId, clean, validStudentId, normalizeScale } from "../lib/helpers";

export class UserError extends Error {}

/* ---------------- auth ---------------- */

/* Student sign-in by student number only (no OTP yet).
   Signs in anonymously, then binds that anonymous uid to the student via sessions/{uid}. */
export async function studentSignIn(rawId) {
  const typed = String(rawId || "").trim();
  if (!typed) throw new UserError("Enter your student number");
  if (!validStudentId(typed)) throw new UserError("That student number is not enrolled in first year BSIT");

  if (auth.currentUser) await fbSignOut(auth);
  const cred = await signInAnonymously(auth);

  // the mockup matched case-insensitively; try the common spellings
  let snap = null;
  for (const id of [...new Set([typed, typed.toUpperCase(), typed.toLowerCase()])]) {
    const s = await getDoc(doc(db, "students", id));
    if (s.exists()) { snap = s; break; }
  }
  if (!snap) {
    await fbSignOut(auth);
    throw new UserError("That student number is not enrolled in first year BSIT");
  }
  await setDoc(doc(db, "sessions", cred.user.uid), { studentId: snap.id, at: serverTimestamp() });
  return { id: snap.id, ...snap.data() };
}

export async function adminSignIn(username, password) {
  const u = String(username || "").trim();
  if (!u || !password) throw new UserError("Wrong username or password");
  const email = u.includes("@") ? u : `${u}@${ADMIN_EMAIL_DOMAIN}`;
  if (auth.currentUser) await fbSignOut(auth);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const adm = await getDoc(doc(db, "admins", cred.user.uid));
    if (!adm.exists()) { await fbSignOut(auth); throw new UserError("Wrong username or password"); }
    return cred.user;
  } catch (e) {
    if (e instanceof UserError) throw e;
    if (String(e.code).startsWith("auth/") && e.code !== "auth/network-request-failed" && e.code !== "auth/too-many-requests")
      throw new UserError("Wrong username or password");
    throw e;
  }
}

export const signOut = () => fbSignOut(auth);

/* ---------------- responses ---------------- */

export async function submitResponse(studentId, formId, target, answers) {
  const tId = target ? targetIdOf(target.course, target.instructor) : "once";
  const id = responseId(studentId, formId, tId);
  try {
    await setDoc(doc(db, "responses", id), clean({
      studentId,
      formId,
      target: target ? targetKey(target.course, target.instructor) : null,
      targetId: tId,
      course: target ? target.course : null,
      instructor: target ? target.instructor : null,
      answers,
      at: serverTimestamp(),
    }));
  } catch (e) {
    if (e.code === "permission-denied") {
      const existing = await getDoc(doc(db, "responses", id)).catch(() => null);
      if (existing && existing.exists()) throw new UserError("This form was already submitted");
      throw new UserError("You are not allowed to submit this form. Sign out and sign in again.");
    }
    throw e;
  }
}

/* ---------------- forms ---------------- */

export const saveSections = (formId, sections) =>
  updateDoc(doc(db, "forms", formId), { sections: clean(sections), updatedAt: serverTimestamp() });

export const replaceForm = (formId, form) =>
  setDoc(doc(db, "forms", formId), clean({ ...form, id: formId, scale: normalizeScale(form.scale), updatedAt: serverTimestamp() }));

/* ---------------- students ---------------- */

const normLoad = load => (load || [])
  .map(l => ({ course: String(l.course || "").trim(), instructor: String(l.instructor || "").trim() }))
  .filter(l => l.course && l.instructor);

export async function saveStudent(oldId, rec) {
  const id = String(rec.id).trim();
  if (!validStudentId(id)) throw new UserError("That student number contains characters that are not allowed");
  const data = { name: rec.name.trim(), group: rec.group, load: normLoad(rec.load) };

  if (!oldId || oldId !== id) {
    const exists = await getDoc(doc(db, "students", id));
    if (exists.exists()) throw new UserError("That student number already exists");
  }
  if (!oldId) {
    await setDoc(doc(db, "students", id), { ...data, createdAt: serverTimestamp() });
  } else if (oldId === id) {
    await updateDoc(doc(db, "students", id), data);
  } else {
    const b = writeBatch(db);
    b.set(doc(db, "students", id), { ...data, createdAt: serverTimestamp() });
    b.delete(doc(db, "students", oldId));
    await b.commit();
  }
}

export const deleteStudent = id => deleteDoc(doc(db, "students", id));

/* rows: [{studentid|id, name, group, course, instructor}], existing: current students array.
   Rows sharing a student number are merged; existing accounts only gain new subjects. */
export async function importStudents(rows, existing) {
  const byId = new Map(existing.map(s => [s.id, { ...s, load: [...(s.load || [])], _changed: false, _new: false }]));
  let added = 0;
  for (const r of rows) {
    const id = String(r.studentid || r.id || "").trim();
    const name = String(r.name || "").trim();
    const grp = String(r.group || "").trim();
    const c = String(r.course || "").trim(), ins = String(r.instructor || "").trim();
    if (!id || !name || !validStudentId(id)) continue;
    let s = byId.get(id);
    if (!s) { s = { id, name, group: grp, load: [], _new: true, _changed: true }; byId.set(id, s); added++; }
    if (c && ins && !s.load.some(l => l.course === c && l.instructor === ins)) {
      s.load.push({ course: c, instructor: ins }); s._changed = true;
    }
  }
  const changed = [...byId.values()].filter(s => s._changed);
  for (let i = 0; i < changed.length; i += 400) {
    const b = writeBatch(db);
    changed.slice(i, i + 400).forEach(s => {
      const ref = doc(db, "students", s.id);
      if (s._new) b.set(ref, { name: s.name, group: s.group, load: normLoad(s.load), createdAt: serverTimestamp() });
      else b.update(ref, { load: normLoad(s.load) });
    });
    await b.commit();
  }
  return { added, updated: changed.length - added };
}
