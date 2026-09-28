import { createContext, useContext, useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const DataCtx = createContext(null);
export const useData = () => useContext(DataCtx);

const FORM_ORDER = ["faceval", "survey"];
const EMPTY = { forms: {}, formList: [], students: [], me: null, responses: [], ready: false, error: null };

/* Live Firestore snapshots. Admin: all students + all responses. Student: own record + own responses. */
export function DataProvider({ children }) {
  const { role, studentId } = useAuth();
  const [forms, setForms] = useState(null);
  const [students, setStudents] = useState(null);
  const [me, setMe] = useState(null);
  const [responses, setResponses] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForms(null); setStudents(null); setMe(null); setResponses(null); setError(null);
    if (!role) return;
    const onErr = e => { console.error(e); setError(e); };
    const unsubs = [];

    unsubs.push(onSnapshot(collection(db, "forms"), snap => {
      const f = {};
      snap.forEach(d => (f[d.id] = { ...d.data(), id: d.id }));
      setForms(f);
    }, onErr));

    const toResponses = snap => snap.docs.map(d => {
      const r = d.data();
      return { ...r, _id: d.id, atMs: r.at?.toMillis ? r.at.toMillis() : Date.now() };
    });

    if (role === "admin") {
      unsubs.push(onSnapshot(collection(db, "students"), snap => {
        setStudents(snap.docs.map(d => ({ id: d.id, load: [], ...d.data() }))
          .sort((a, b) => (a.group || "").localeCompare(b.group || "") || a.id.localeCompare(b.id)));
      }, onErr));
      unsubs.push(onSnapshot(collection(db, "responses"), snap => setResponses(toResponses(snap)), onErr));
    } else if (role === "student" && studentId) {
      unsubs.push(onSnapshot(doc(db, "students", studentId), d => {
        setMe(d.exists() ? { id: d.id, load: [], ...d.data() } : false);
      }, onErr));
      unsubs.push(onSnapshot(query(collection(db, "responses"), where("studentId", "==", studentId)),
        snap => setResponses(toResponses(snap)), onErr));
    }
    return () => unsubs.forEach(u => u());
  }, [role, studentId]);

  let value = EMPTY;
  if (role) {
    const formList = forms
      ? [...FORM_ORDER.filter(id => forms[id]), ...Object.keys(forms).filter(id => !FORM_ORDER.includes(id))].map(id => forms[id])
      : [];
    const ready = forms !== null && responses !== null && (role === "admin" ? students !== null : me !== null);
    value = { forms: forms || {}, formList, students: students || [], me: me || null, responses: responses || [], ready, error };
  }
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
