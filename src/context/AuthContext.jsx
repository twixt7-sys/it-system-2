import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "../firebase";
import * as api from "../data/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const SIGNED_OUT = { ready: true, role: null, studentId: null, uid: null };

/* role: null | "student" | "admin";  studentId is set for students */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ ...SIGNED_OUT, ready: !firebaseConfigured });
  const busy = useRef(false); // true while a sign-in call runs, so the listener does not race it

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(auth, async user => {
      if (busy.current) return;
      if (!user) { setState(SIGNED_OUT); return; }
      try {
        if (user.isAnonymous) {
          const s = await getDoc(doc(db, "sessions", user.uid));
          setState(s.exists() ? { ready: true, role: "student", studentId: s.data().studentId, uid: user.uid } : SIGNED_OUT);
        } else {
          const a = await getDoc(doc(db, "admins", user.uid));
          setState(a.exists() ? { ready: true, role: "admin", studentId: null, uid: user.uid } : SIGNED_OUT);
        }
      } catch {
        setState(SIGNED_OUT);
      }
    });
  }, []);

  const signInStudent = useCallback(async id => {
    busy.current = true;
    try {
      const s = await api.studentSignIn(id);
      setState({ ready: true, role: "student", studentId: s.id, uid: auth.currentUser.uid });
      return s;
    } finally { busy.current = false; }
  }, []);

  const signInAdmin = useCallback(async (u, p) => {
    busy.current = true;
    try {
      const user = await api.adminSignIn(u, p);
      setState({ ready: true, role: "admin", studentId: null, uid: user.uid });
    } finally { busy.current = false; }
  }, []);

  const signOut = useCallback(async () => {
    setState(SIGNED_OUT);
    await api.signOut();
  }, []);

  return <AuthCtx.Provider value={{ ...state, signInStudent, signInAdmin, signOut }}>{children}</AuthCtx.Provider>;
}
