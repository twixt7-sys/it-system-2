import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { UserError } from "../data/api";
import { DEMO_MODE, firebaseConfigured } from "../firebase";

/* Sign-in page (mockup viewAuth). Students sign in with their student number only — no OTP yet. */
export default function Auth() {
  const [tab, setTab] = useState("student");
  const [sid, setSid] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const { signInStudent, signInAdmin } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();

  const fail = e => {
    if (e instanceof UserError) toast(e.message, "bad");
    else if (e?.code === "auth/operation-not-allowed") toast("Sign-in method is not enabled in Firebase Authentication", "bad");
    else if (e?.code === "auth/network-request-failed") toast("No connection. Check your internet and try again", "bad");
    else if (e?.code === "auth/too-many-requests") toast("Too many attempts. Wait a minute and try again", "bad");
    else { console.error(e); toast("Something went wrong. Try again", "bad"); }
  };

  const onStudent = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const s = await signInStudent(sid);
      navigate("/home");
      toast("Signed in as " + s.name.split(" ")[0], "good");
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const onAdmin = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await signInAdmin(user, pass);
      navigate("/admin/overview");
      toast("Signed in as administrator", "good");
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap fade">
      {!firebaseConfigured && (
        <div className="notice" style={{ borderColor: "var(--bad)" }}>
          <b>Firebase is not configured.</b> Copy <code>.env.example</code> to <code>.env.local</code>, fill in your web app config, then restart <code>npm run dev</code>.
        </div>
      )}
      <div className="notice">
        <b>Access is limited.</b> This survey system is for first year BSIT students of Legacy College of Compostela only.
      </div>
      <div className="card">
        <div className="shape sh-a" /><div className="shape sh-c" />
        <h2>Sign in</h2>
        <p className="sub" style={{ marginBottom: 18 }}>Use your student number, or the administrator account.</p>
        <div className="tabs">
          <button className={`tab ${tab === "student" ? "on" : ""}`} onClick={() => setTab("student")}>Student</button>
          <button className={`tab ${tab === "admin" ? "on" : ""}`} onClick={() => setTab("admin")}>Administrator</button>
        </div>

        {tab === "student" ? (
          <form className="plain" onSubmit={onStudent}>
            <div className="field">
              <label className="fl" htmlFor="sidInput">Student number</label>
              <input className="input" id="sidInput" placeholder="2025-1101" autoComplete="username"
                value={sid} onChange={e => setSid(e.target.value)} autoFocus />
            </div>
            <button type="submit" className={`btn primary ${busy ? "busy" : ""}`} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "Checking…" : "Continue"}
            </button>
            {DEMO_MODE && (
              <div className="demo-chip"><Icon name="ri-user-line" />Demo IDs <b>2025-1101</b> &middot; <b>2025-1202</b></div>
            )}
          </form>
        ) : (
          <form className="plain" onSubmit={onAdmin}>
            <div className="field">
              <label className="fl" htmlFor="admU">Username</label>
              <input className="input" id="admU" placeholder="admin" autoComplete="username"
                value={user} onChange={e => setUser(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label className="fl" htmlFor="admP">Password</label>
              <input className="input" id="admP" type="password" placeholder="••••••••" autoComplete="current-password"
                value={pass} onChange={e => setPass(e.target.value)} />
            </div>
            <button type="submit" className={`btn primary ${busy ? "busy" : ""}`} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {DEMO_MODE && (
              <div className="demo-chip"><Icon name="ri-key-2-line" />Username <b>admin</b> &middot; password set during setup</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
