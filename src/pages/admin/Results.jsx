import { Icon } from "../../lib/icons";
import { csvCell } from "../../lib/helpers";
import { useData } from "../../context/DataContext";
import { useUI } from "../../context/UIContext";
import IoModal from "../../components/IoModal";
import BarRow from "../../components/BarRow";

function sectionAverages(form, list, skipKinds) {
  if (!form) return [];
  return form.sections.filter(s => !skipKinds.includes(s.kind)).map(s => {
    let sum = 0, n = 0;
    list.forEach(r => s.items.forEach(it => {
      const v = r.answers?.[it.id];
      if (typeof v === "number") { sum += v; n++; }
    }));
    return [s.title, n ? sum / n : 0, s.id];
  });
}

/* mockup adminResults */
export default function Results() {
  const { responses, forms } = useData();
  const { openModal } = useUI();
  const faceval = forms.faceval, survey = forms.survey;
  const evals = responses.filter(r => r.formId === "faceval").sort((a, b) => a.atMs - b.atMs);
  const sv = responses.filter(r => r.formId === "survey");

  /* average per teacher */
  const byIns = {};
  evals.forEach(r => {
    const k = r.instructor || "Unknown";
    byIns[k] = byIns[k] || { n: 0, sum: 0 };
    Object.values(r.answers || {}).forEach(v => { if (typeof v === "number") { byIns[k].sum += v; byIns[k].n++; } });
  });
  const insRows = Object.entries(byIns).filter(([, v]) => v.n)
    .sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n);

  const secAvg = sectionAverages(faceval, evals, ["text", "multiselect"]);
  const svAvg = sectionAverages(survey, sv, ["text", "multiselect"]);

  const msTally = (survey?.sections || []).filter(s => s.kind === "multiselect").flatMap(sec => sec.items.map(it => ({
    question: it.text, id: it.id, total: sv.length,
    counts: (it.options || []).map(o => [o, sv.filter(r => Array.isArray(r.answers?.[it.id]) && r.answers[it.id].includes(o)).length]),
  })));

  /* open-ended comments: first text item = "what helped", second = "what to improve" */
  const textItems = (faceval?.sections || []).filter(s => s.kind === "text").flatMap(s => s.items);
  const helpId = textItems[0]?.id || "Q1", impId = textItems[1]?.id || "Q2";
  const latest = id => evals.filter(r => String(r.answers?.[id] || "").trim()).slice(-7).reverse();
  const comments = latest(helpId), improve = latest(impId);

  const exportResults = () => {
    const rows = ["form,course,instructor,item,rating"];
    responses.forEach(r => Object.entries(r.answers || {}).forEach(([k, v]) => {
      if (typeof v === "number") rows.push([r.formId, csvCell(r.course), csvCell(r.instructor), k, v].join(","));
      else if (Array.isArray(v) && v.length) rows.push([r.formId, csvCell(r.course), csvCell(r.instructor), k, csvCell(v.join("; "))].join(","));
    }));
    openModal(<IoModal title="Results export" hint="Ratings only, without student identifiers." text={rows.join("\n")} filename="results.csv" />);
  };

  const exportRaw = () => {
    // eslint-disable-next-line no-unused-vars
    const clean = responses.map(({ studentId, _id, atMs, at, ...r }) => ({ ...r, at: atMs }));
    openModal(<IoModal title="Raw responses" hint="Full JSON of every submitted response." text={JSON.stringify(clean, null, 2)} filename="responses.json" />);
  };

  return (
    <>
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <div className="card"><div className="shape sh-a" />
          <h2>Average rating per teacher</h2>
          <p className="sub" style={{ marginBottom: 16 }}>Scale of 1 to 5, all sections combined.</p>
          {insRows.length ? insRows.map(([k, v]) => {
            const avg = v.sum / v.n;
            return <BarRow key={k} title={k} label={k.replace(/^(Engr\.|Ms\.|Mr\.|Mrs\.|Dr\.|Prof\.)\s/, "")} pct={avg / 5 * 100} value={avg.toFixed(2)} />;
          }) : <div className="empty">No evaluations yet.</div>}
        </div>
        <div className="card"><div className="shape sh-b" />
          <h2>Faculty evaluation by section</h2>
          <p className="sub" style={{ marginBottom: 16 }}>Where the program is strong and weak.</p>
          {secAvg.map(([t, v, id]) => <BarRow key={id} label={t} pct={v / 5 * 100} value={v.toFixed(2)} />)}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}><div className="shape sh-c" />
        <h2>Course delivery survey</h2>
        <p className="sub" style={{ marginBottom: 16 }}>{sv.length} responses.</p>
        {svAvg.map(([t, v, id]) => <BarRow key={id} label={t} pct={v / 5 * 100} value={v.toFixed(2)} color="var(--accent-2)" />)}
      </div>

      <div className="card" style={{ marginBottom: 14 }}><div className="shape sh-b" />
        <h2>Learning resources &amp; skills</h2>
        <p className="sub" style={{ marginBottom: 16 }}>Share of respondents who selected each option.</p>
        {msTally.length ? msTally.map(q => (
          <div key={q.id}>
            <h3 style={{ margin: "14px 0 10px", fontSize: 13.5 }}>{q.question}</h3>
            {q.counts.map(([opt, n]) => (
              <BarRow key={opt} label={opt} pct={q.total ? n / q.total * 100 : 0} value={n} color="var(--accent-2)" />
            ))}
          </div>
        )) : <div className="empty">No responses yet.</div>}
      </div>

      <div className="grid g2">
        <div className="card"><h2>What helped students learn</h2>
          <p className="sub" style={{ marginBottom: 14 }}>Latest comments, names removed.</p>
          {comments.length ? comments.map(r => (
            <div className="comment" key={r._id}><small>{r.course} &middot; {r.instructor}</small>{r.answers[helpId]}</div>
          )) : <div className="empty">No comments yet.</div>}
        </div>
        <div className="card"><h2>What to improve</h2>
          <p className="sub" style={{ marginBottom: 14 }}>Latest comments, names removed.</p>
          {improve.length ? improve.map(r => (
            <div className="comment" style={{ borderLeftColor: "var(--warn)" }} key={r._id}><small>{r.course} &middot; {r.instructor}</small>{r.answers[impId]}</div>
          )) : <div className="empty">No comments yet.</div>}
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn sm" onClick={exportResults}><Icon name="ri-download-2-line" />Export results CSV</button>
        <button className="btn sm" onClick={exportRaw}><Icon name="ri-code-s-slash-line" />Export raw JSON</button>
      </div>
    </>
  );
}
