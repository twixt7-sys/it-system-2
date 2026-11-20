import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useData } from "../../context/DataContext";
import Overview from "./Overview";
import Respondents from "./Respondents";
import Results from "./Results";
import FormBuilder from "./FormBuilder";
import Accounts from "./Accounts";

export const ADMIN_TABS = [
  ["overview", "Overview", Overview],
  ["respondents", "Respondents", Respondents],
  ["results", "Results", Results],
  ["forms", "Form builder", FormBuilder],
  ["accounts", "Student accounts", Accounts],
];

/* mockup viewAdmin */
export default function AdminLayout() {
  const { tab } = useParams();
  const { students } = useData();
  const navigate = useNavigate();
  const cur = ADMIN_TABS.find(t => t[0] === tab);
  if (!cur) return <Navigate to="/admin/overview" replace />;
  const Body = cur[2];

  return (
    <div className="fade" key={tab}>
      <div className="page-head">
        <div>
          <h1>{cur[1]}</h1>
          <p className="sub">BSIT first year &middot; SY 2025&ndash;2026 &middot; {students.length} enrolled students</p>
        </div>
      </div>
      <div className="atabs">
        {ADMIN_TABS.map(t => (
          <button key={t[0]} className={`step ${tab === t[0] ? "on" : ""}`} onClick={() => navigate("/admin/" + t[0])}>{t[1]}</button>
        ))}
      </div>
      <div><Body /></div>
    </div>
  );
}

