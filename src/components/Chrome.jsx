import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { isMobile } from "../lib/helpers";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

const STUDENT_NAV = [
  ["home", "ri-home-5-line", "Home", "/home"],
  ["eval", "ri-user-star-line", "Faculty evaluation", "/eval"],
  ["survey", "ri-survey-line", "Course delivery survey", "/survey"],
  ["sep"],
  ["logout", "ri-logout-box-r-line", "Sign out"],
];
const ADMIN_NAV = [
  ["overview", "ri-dashboard-line", "Overview", "/admin/overview"],
  ["respondents", "ri-team-line", "Respondents", "/admin/respondents"],
  ["results", "ri-bar-chart-box-line", "Results", "/admin/results"],
  ["forms", "ri-file-list-3-line", "Form builder", "/admin/forms"],
  ["accounts", "ri-id-card-line", "Student accounts", "/admin/accounts"],
  ["sep"],
  ["logout", "ri-logout-box-r-line", "Sign out"],
];

function currentKey(pathname) {
  const p = pathname.split("/").filter(Boolean);
  if (p[0] === "admin") return p[1] || "overview";
  return p[0] || "";
}

/* Top bar + hover/pin sidebar + mobile backdrop (mockup sections 4 and the <header>). */
export default function Chrome() {
  const { role, signOut } = useAuth();
  const { theme, toggleTheme, toast } = useUI();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [backdrop, setBackdrop] = useState(false);
  const pinned = useRef(false);

  const openSide = useCallback(() => { setOpen(true); if (isMobile()) setBackdrop(true); }, []);
  const closeSide = useCallback(() => { setOpen(false); setBackdrop(false); pinned.current = false; }, []);

  useEffect(() => { if (!role) closeSide(); }, [role, closeSide]);

  const onBurgerClick = () => {
    if (!role) { toast("Sign in to open the menu"); return; }
    if (open && (pinned.current || isMobile())) closeSide();
    else { openSide(); pinned.current = true; }
  };

  const doSignOut = async () => {
    closeSide();
    await signOut();
    navigate("/login");
    toast("Signed out");
  };

  const onNav = item => {
    if (item[0] === "logout") { doSignOut(); return; }
    navigate(item[3]);
    if (isMobile() || pinned.current) closeSide();
  };

  const items = role === "admin" ? ADMIN_NAV : role === "student" ? STUDENT_NAV : [];
  const cur = currentKey(pathname);
  const onSurvey = cur === "survey";

  return (
    <>
      <header className="topbar">
        <button className="tb-circle" aria-label="Menu" onClick={onBurgerClick}
          onMouseEnter={() => { if (!isMobile() && role) openSide(); }}>
          <Icon name="ri-menu-line" />
        </button>
        <div className="tb-body">
          <div className="tb-brand">
            <span className="tb-mark">LCC</span>
            <span className="tb-title">BSIT Evaluation &amp; Survey System</span>
          </div>
          <div className="tb-right">
            <span className="tb-meta">SY 2025&ndash;2026</span>
            <button className="tb-theme" onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon name={theme === "dark" ? "ri-sun-line" : "ri-moon-line"} />
            </button>
          </div>
        </div>
        <button className="tb-circle" aria-label="Account"
          onClick={() => { if (role) navigate(role === "admin" ? "/admin/overview" : "/home"); }}>
          <Icon name={role === "admin" ? "ri-shield-user-line" : "ri-user-3-line"} />
          <span className="tb-role">{role ? (role === "admin" ? "Admin" : "Student") : "Guest"}</span>
        </button>
      </header>

      <div className={`backdrop ${backdrop ? "on" : ""}`} onClick={closeSide} />

      <aside className={`sidebar ${open ? "open" : ""}`}
        onMouseLeave={() => { if (!isMobile() && !pinned.current) closeSide(); }}>
        <div className="sb-head">
          <span>Navigation</span>
          <button className="sb-retract" aria-label="Close menu" onClick={closeSide}><Icon name="ri-arrow-left-s-line" /></button>
        </div>
        <div>
          {items.map((n, i) => {
            if (n[0] === "sep") return <div key={"sep" + i} className="sb-sep" />;
            const on = n[0] === cur;
            const gold = on && n[0] === "survey" && onSurvey;
            return (
              <button key={n[0]} className={`sb-item ${on ? "on" : ""}${gold ? " gold" : ""}`} onClick={() => onNav(n)}>
                <Icon name={n[1]} />{n[2]}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
