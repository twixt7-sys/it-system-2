import { useState } from "react";
import { Icon } from "../../lib/icons";
import { evalDone, surveyDone, csvCell } from "../../lib/helpers";
import { useData } from "../../context/DataContext";
import { useUI } from "../../context/UIContext";
import IoModal from "../../components/IoModal";

/* search + filter survive switching admin tabs, like S.rq / S.rf in the mockup */
let memo = { q: "", f: "all" };

/* mockup adminRespondents */
export default function Respondents() {
  const { students, responses } = useData();
  const { openModal } = useUI();
  const [q, setQ] = useState(memo.q);
  const [f, setF] = useState(memo.f);
  memo = { q, f };

  const prog = students.map(s => {
    const d = evalDone(s, responses), t = s.load.length, sv = surveyDone(s, responses);
    return { s, d, t, sv, full: d === t && sv };
  });
  let list = prog.filter(p => (p.s.name + p.s.id + p.s.group).toLowerCase().includes(q.toLowerCase()));
  if (f === "done") list = list.filter(p => p.full);
  if (f === "pending") list = list.filter(p => !p.full);

  const exportCompletion = () => openModal(
    <IoModal title="Completion export" hint="One row per student." filename="completion.csv"
      text={"student id,name,group,evaluations done,evaluations required,survey\n" +
        prog.map(p => [csvCell(p.s.id), csvCell(p.s.name), csvCell(p.s.group), p.d, p.t, p.sv ? "submitted" : "pending"].join(",")).join("\n")} />
  );

  return (
    <>
      <div className="card" style={{ marginBottom: 14, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input className="input" placeholder="Search name, ID, or block" style={{ flex: 1, minWidth: 180 }}
            value={q} onChange={e => setQ(e.target.value)} />
          <div style={{ display: "flex", gap: 6 }}>
            {[["all", "All"], ["done", "Complete"], ["pending", "Pending"]].map(t => (
              <button key={t[0]} className={`step ${f === t[0] ? "on" : ""}`} onClick={() => setF(t[0])}>{t[1]}</button>
            ))}
          </div>
          <button className="btn sm" onClick={exportCompletion}><Icon name="ri-download-2-line" />Export CSV</button>
        </div>
      </div>
      <div className="rrow-h"><div>Student</div><div>Faculty evaluation</div><div>Course survey</div><div>Status</div></div>
      <div className="rowlist">
        {list.length ? list.map(({ s, d, t, sv, full }) => (
          <div className="rrow" key={s.id}>
            <div className="rname"><b>{s.name}</b><small>{s.id} &middot; {s.group}</small></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className={`pbar ${d === t ? "ok" : ""}`} style={{ flex: 1, minWidth: 60 }}><i style={{ width: (t ? d / t * 100 : 0) + "%" }} /></div>
              <span style={{ fontFamily: "'Space Grotesk'", fontSize: 12.5, color: "var(--ink-3)" }}>{d}/{t}</span>
            </div>
            <div className="rcol-3"><span className={`badge ${sv ? "done" : "pend"}`}>{sv ? "Submitted" : "Not yet"}</span></div>
            <div><span className={`badge ${full ? "done" : "pend"}`}>{full ? "Complete" : "Pending"}</span></div>
          </div>
        )) : <div className="empty">No student matches that search.</div>}
      </div>
    </>
  );
}
