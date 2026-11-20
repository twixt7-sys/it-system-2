import { useNavigate } from "react-router-dom";
import { Icon } from "../../lib/icons";
import { evalDone, surveyDone } from "../../lib/helpers";
import { useData } from "../../context/DataContext";
import BarRow from "../../components/BarRow";

const pctOf = (a, b) => (b ? Math.round(a / b * 100) : 0);

/* mockup stats() + adminOverview */
export default function Overview() {
  const { students, responses } = useData();
  const navigate = useNavigate();

  const prog = students.map(s => ({ s, d: evalDone(s, responses), t: s.load.length, sv: surveyDone(s, responses) }));
  const need = prog.reduce((a, p) => a + p.t, 0);
  const got = prog.reduce((a, p) => a + p.d, 0);
  const sv = prog.filter(p => p.sv).length;
  const full = prog.filter(p => p.d === p.t && p.sv).length;
  const ratings = responses.filter(r => r.formId === "faceval")
    .flatMap(r => Object.values(r.answers || {}).filter(v => typeof v === "number"));
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const pend = prog.filter(p => p.d < p.t || !p.sv);
  const groups = [...new Set(students.map(s => s.group || "No block"))].sort();
  const allPct = pctOf(got + sv, need + students.length);

  const cards = [
    ["Students fully done", full, students.length, "ri-user-follow-line", "--accent"],
    ["Evaluations received", got, need, "ri-file-check-line", "--accent"],
    ["Survey responses", sv, students.length, "ri-survey-line", "--accent-2"],
    ["Average rating", avg.toFixed(2), null, "ri-star-line", "--accent-2"],
  ];

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        {cards.map(c => (
          <div className="card" style={{ padding: 18 }} key={c[0]}>
            <div className="shape sh-c" />
            <Icon name={c[3]} style={{ fontSize: 19, color: `var(${c[4]})` }} />
            <div className="stat" style={{ marginTop: 12 }}>
              {c[1]}{c[2] !== null && <span style={{ fontSize: 15, color: "var(--ink-3)" }}>/{c[2]}</span>}
            </div>
            <div className="stat-l">{c[0]}</div>
          </div>
        ))}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="shape sh-b" />
          <h2>Completion by block</h2>
          <p className="sub" style={{ marginBottom: 16 }}>Share of required forms received.</p>
          {groups.map(g => {
            const list = prog.filter(p => (p.s.group || "No block") === g);
            const n = list.reduce((a, p) => a + p.t + 1, 0);
            const k = list.reduce((a, p) => a + p.d + (p.sv ? 1 : 0), 0);
            const p = pctOf(k, n);
            return <BarRow key={g} label={g} pct={p} value={p + "%"} />;
          })}
          <BarRow style={{ marginTop: 18 }} labelStyle={{ color: "var(--ink-3)" }} label="All students" pct={allPct} value={allPct + "%"} />
        </div>

        <div className="card">
          <div className="shape sh-a" />
          <h2>Still waiting on {pend.length} students</h2>
          <p className="sub" style={{ marginBottom: 14 }}>Names are tracked for completion only.</p>
          {pend.length ? (
            <>
              <div className="rowlist">
                {pend.slice(0, 6).map(({ s, d, t, sv: done }) => (
                  <div className="rrow" style={{ gridTemplateColumns: "1fr auto" }} key={s.id}>
                    <div className="rname"><b>{s.name}</b><small>{s.id} &middot; {s.group}</small></div>
                    <span className="badge pend">{d}/{t} eval{done ? "" : <> &middot; no survey</>}</span>
                  </div>
                ))}
              </div>
              {pend.length > 6 && (
                <button className="btn sm" style={{ marginTop: 12 }} onClick={() => navigate("/admin/respondents")}>See all {pend.length}</button>
              )}
            </>
          ) : <div className="empty">Every student has submitted.</div>}
        </div>
      </div>
    </>
  );
}
