import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useData } from "./context/DataContext";
import BackgroundGrid from "./components/BackgroundGrid";
import Chrome from "./components/Chrome";
import Auth from "./pages/Auth";
import StudentHome from "./pages/StudentHome";
import EvalPicker from "./pages/EvalPicker";
import FormView from "./pages/FormView";
import AdminLayout from "./pages/admin/AdminLayout";

export function Loading({ text = "Loading…" }) {
  return <div className="empty">{text}</div>;
}

function homeFor(role) {
  return role === "admin" ? "/admin/overview" : role === "student" ? "/home" : "/login";
}

/* Waits for auth + the live snapshots, then renders the page or sends the visitor to the right place. */
function RequireRole({ role, children }) {
  const auth = useAuth();
  const data = useData();
  if (!auth.ready) return <Loading />;
  if (auth.role !== role) return <Navigate to={homeFor(auth.role)} replace />;
  if (data.error) {
    return <div className="card"><h2>Could not load data</h2>
      <p className="sub">{String(data.error.message || data.error)}</p></div>;
  }
  if (!data.ready) return <Loading />;
  if (role === "student" && !data.me) {
    return <div className="card"><h2>Account not found</h2>
      <p className="sub">Your student record was removed. Ask the department office, then sign out and in again.</p></div>;
  }
  return children;
}

function GuestOnly({ children }) {
  const { ready, role } = useAuth();
  if (!ready) return <Loading />;
  if (role) return <Navigate to={homeFor(role)} replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);

  return (
    <>
      <div className="bg-photo" />
      <div className="bg-tint" />
      <BackgroundGrid />
      <Chrome />
      <main className="shell">
        <Routes>
          <Route path="/login" element={<GuestOnly><Auth /></GuestOnly>} />
          <Route path="/home" element={<RequireRole role="student"><StudentHome /></RequireRole>} />
          <Route path="/eval" element={<RequireRole role="student"><EvalPicker /></RequireRole>} />
          <Route path="/eval/:targetId" element={<RequireRole role="student"><FormView formId="faceval" /></RequireRole>} />
          <Route path="/survey" element={<RequireRole role="student"><FormView formId="survey" /></RequireRole>} />
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="/admin/:tab" element={<RequireRole role="admin"><AdminLayout /></RequireRole>} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </main>
    </>
  );
}

function RootRedirect() {
  const { ready, role } = useAuth();
  if (!ready) return <Loading />;
  return <Navigate to={homeFor(role)} replace />;
}
