import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { initials, firstName, evalDone, surveyDone } from "../lib/helpers";
import { useData } from "../context/DataContext";

/* mockup viewHome */
export default function StudentHome() {
  const { me: s, responses } = useData();
  const navigate = useNavigate();
  const done = evalDone(s, responses), total = s.load.length, sv = surveyDone(s, responses);
  const pct = Math.round(((done + (sv ? 1 : 0)) / (total + 1)) * 100);

  return (
    <div className="fade">
      <div className="page-head">
        <div>
          <h1>{firstName(s.name)}, here is what is left</h1>
          <p className="sub">Two things to finish this term: evaluate each of your teachers, then answer the course delivery survey once.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="shape sh-a" /><div className="shape sh-b" />
        <div className="idcard">
          <div className="avatar">{initials(s.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{s.name}</h2>
            <p className="sub" style={{ marginTop: 2 }}>{s.group} &middot; {s.load.length} subjects enrolled</p>
          </div>
          <span className={`badge ${pct === 100 ? "done" : "pend"}`}>{pct === 100 ? "All complete" : pct + "% complete"}</span>
        </div>
        <div className="meta-row">
          <div><span>Student number</span>{s.id}</div>
          <div><span>Block</span>{s.group}</div>
          <div><span>Teachers to evaluate</span>{done} of {total} done</div>
          <div><span>Course survey</span>{sv ? "Submitted" : "Not yet answered"}</div>
        </div>
        <div className={`pbar ${pct === 100 ? "ok" : ""}`} style={{ marginTop: 16 }}><i style={{ width: pct + "%" }} /></div>
      </div>

      <div className="grid g2">
        <button className="pick" onClick={() => navigate("/eval")}>
          <div className="shape sh-c" />
          <div className="pi"><Icon name="ri-user-star-line" /></div>
          <div className="pt"><b>Faculty evaluation</b><small>One form for every teacher and subject</small></div>
          <span className={`badge ${done === total ? "done" : "pend"}`}>{done}/{total}</span>
        </button>
        <button className="pick gold" onClick={() => navigate("/survey")}>
          <div className="shape sh-c" />
          <div className="pi"><Icon name="ri-survey-line" /></div>
          <div className="pt"><b>Course delivery survey</b><small>Answered once for the whole term</small></div>
          <span className={`badge ${sv ? "done" : "pend"}`}>{sv ? "Done" : "To do"}</span>
        </button>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 10 }}>Before you answer</h3>
        <p className="sub" style={{ lineHeight: 1.75, margin: 0 }}>
          Be honest and objective. Do not leave any item blank. Evaluate every teacher, including one who handles two of your subjects, once per subject. Your ID is used only to record that you finished; ratings and comments are shown to the department without your name.
        </p>
      </div>
    </div>
  );
}
