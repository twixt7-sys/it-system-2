import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { initials, evalDone, targetIdOf } from "../lib/helpers";
import { useData } from "../context/DataContext";

/* mockup viewEvalPicker */
export default function EvalPicker() {
  const { me: s, responses } = useData();
  const navigate = useNavigate();
  const doneIds = new Set(responses.filter(r => r.formId === "faceval").map(r => r.targetId));
  const done = evalDone(s, responses);
  const total = s.load.length;

  return (
    <div className="fade">
      <div className="page-head">
        <div>
          <h1>Faculty evaluation</h1>
          <p className="sub">{done} of {total} finished. Each subject is rated separately.</p>
        </div>
        <button className="btn sm" onClick={() => navigate("/home")}><Icon name="ri-arrow-left-line" />Back</button>
      </div>
      <div className={`pbar ${done === total ? "ok" : ""}`} style={{ marginBottom: 18 }}>
        <i style={{ width: (total ? Math.round(done / total * 100) : 0) + "%" }} />
      </div>
      <div className="tlist">
        {total === 0 && <div className="empty">No subjects are listed on your account yet.</div>}
        {s.load.map(l => {
          const tid = targetIdOf(l.course, l.instructor);
          const isDone = doneIds.has(tid);
          return (
            <button key={tid} className={`titem ${isDone ? "done" : ""}`}
              onClick={isDone ? undefined : () => navigate("/eval/" + tid)}>
              <div className="tinit">{isDone ? <Icon name="ri-check-line" style={{ fontSize: 19 }} /> : initials(l.instructor)}</div>
              <div className="tbody"><b>{l.instructor}</b><small>{l.course}</small></div>
              <span className={`badge ${isDone ? "done" : ""}`}>{isDone ? "Submitted" : "Answer"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
