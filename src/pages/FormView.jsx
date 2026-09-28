import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "../lib/icons";
import { itemsOf, isAnswered, targetIdOf, normalizeScale } from "../lib/helpers";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";
import { submitResponse, UserError } from "../data/api";

/* mockup openForm / viewForm / validateSection / submitForm / refreshFooter */
export default function FormView({ formId }) {
  const { targetId: routeTarget } = useParams();
  const { forms, me, responses } = useData();
  const { toast, confirm } = useUI();
  const navigate = useNavigate();

  const form = forms[formId];
  const target = formId === "faceval"
    ? me.load.find(l => targetIdOf(l.course, l.instructor) === routeTarget) || null
    : null;
  const tId = formId === "faceval" ? routeTarget : "once";
  const existing = responses.find(r => r.formId === formId && r.targetId === tId);

  const [draft, setDraft] = useState({});
  const [step, setStep] = useState(0);
  const [missing, setMissing] = useState(() => new Set());
  const [scrollTick, setScrollTick] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirty = Object.keys(draft).length > 0 && !submitted;
  const cardRefs = useRef({});

  const secs = form?.sections || [];
  const curStep = Math.min(step, Math.max(0, secs.length - 1));
  const sec = secs[curStep];
  const all = useMemo(() => itemsOf(form), [form]);
  const scale = useMemo(() => normalizeScale(form?.scale), [form]);
  const answered = all.filter(i => isAnswered(draft[i.id])).length;
  const pct = all.length ? Math.round(answered / all.length * 100) : 0;
  const backTo = formId === "faceval" ? "/eval" : "/home";

  // go("form") in the mockup scrolls to the top on every step
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [curStep]);
  // ...then, if validation failed, bring the first missing card into view
  useEffect(() => {
    if (!scrollTick) return;
    const first = secs[curStep]?.items.find(it => missing.has(it.id));
    const el = first && cardRefs.current[first.id];
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTick]);

  // warn before closing the tab with unsent answers
  useEffect(() => {
    if (!dirty) return;
    const h = e => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const wrapClass = `fade${formId === "survey" ? " theme-gold" : ""}`;

  if (!form) {
    return <div className={wrapClass}><div className="card"><div className="empty">This form is not available yet.</div>
      <div style={{ textAlign: "center" }}><button className="btn sm" onClick={() => navigate(backTo)}>Back</button></div></div></div>;
  }
  if (formId === "faceval" && !target && !existing) {
    return <div className={wrapClass}><div className="card"><div className="empty">This subject is not on your list.</div>
      <div style={{ textAlign: "center" }}><button className="btn sm" onClick={() => navigate("/eval")}>Back to teacher list</button></div></div></div>;
  }

  /* ---------- done panel ---------- */
  if (existing || submitted) {
    const ins = target?.instructor || existing?.instructor, crs = target?.course || existing?.course;
    return (
      <div className={wrapClass}>
        <div className="card donewrap">
          <div className="shape sh-a" /><div className="shape sh-b" />
          <div className="donemark"><Icon name="ri-check-line" /></div>
          <h2>{form.title} submitted</h2>
          <p className="sub" style={{ maxWidth: 420, margin: "8px auto 22px" }}>
            {formId === "faceval" ? <>{ins} &middot; {crs}</> : "Recorded for this term"}.
            {" "}Answers are final and cannot be edited.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {formId === "faceval" && <button className="btn primary" onClick={() => navigate("/eval")}>Back to teacher list</button>}
            <button className="btn" onClick={() => navigate("/home")}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (!sec) {
    return <div className={wrapClass}><div className="card"><div className="empty">This form has no questions yet.</div></div></div>;
  }

  /* ---------- actions ---------- */
  const missingIn = i => secs[i].items.filter(it => !isAnswered(draft[it.id])).map(it => it.id);

  const validateSection = () => {
    const miss = missingIn(curStep);
    setMissing(new Set(miss));
    if (miss.length) { toast("Answer every item in this section", "bad"); setScrollTick(t => t + 1); }
    return miss.length === 0;
  };

  const setAnswer = (id, v) => {
    setDraft(d => ({ ...d, [id]: v }));
    if (missing.has(id)) setMissing(m => { const n = new Set(m); n.delete(id); return n; });
  };

  const toggleMs = (id, opt) => {
    setDraft(d => {
      const arr = Array.isArray(d[id]) ? d[id].slice() : [];
      const i = arr.indexOf(opt);
      if (i > -1) arr.splice(i, 1); else arr.push(opt);
      return { ...d, [id]: arr };
    });
    if (missing.has(id)) setMissing(m => { const n = new Set(m); n.delete(id); return n; });
  };

  const goStep = i => {
    if (i > curStep && !validateSection()) return;
    setMissing(new Set());
    setStep(i);
  };

  const leave = async () => {
    if (dirty) {
      const ok = await confirm({
        title: "Leave without submitting?",
        text: "Answers on this form are not saved yet. They will be cleared.",
        ok: "Leave", cancel: "Stay",
      });
      if (!ok) return;
    }
    setDraft({});
    navigate(backTo);
  };

  const submit = async () => {
    if (!validateSection()) return;
    for (let i = 0; i < secs.length; i++) {
      const miss = missingIn(i);
      if (miss.length) {
        setStep(i); setMissing(new Set(miss));
        toast("Answer every item in this section", "bad"); setScrollTick(t => t + 1);
        return;
      }
    }
    // keep only answers to items that exist in the current version of the form
    const answers = {};
    all.forEach(it => { if (isAnswered(draft[it.id])) answers[it.id] = typeof draft[it.id] === "string" ? draft[it.id].trim() : draft[it.id]; });
    setBusy(true);
    try {
      await submitResponse(me.id, formId, target, answers);
      setSubmitted(true); setDraft({});
      toast("Submitted", "good");
    } catch (e) {
      if (e instanceof UserError) toast(e.message, "bad");
      else { console.error(e); toast("Could not submit. Check your connection and try again", "bad"); }
    } finally { setBusy(false); }
  };

  /* ---------- questions ---------- */
  const kind = sec.kind || "likert";
  const cardProps = it => ({
    className: `qcard ${missing.has(it.id) ? "missing" : ""}`,
    ref: el => { cardRefs.current[it.id] = el; },
  });

  const qs = sec.items.map((it, n) => {
    const head = <div className="qtext"><span className="qno">{n + 1}</span><span>{it.text}</span></div>;
    if (kind === "text") {
      return (
        <div key={it.id} {...cardProps(it)}>
          {head}
          <textarea className="input" placeholder={it.ph || ""} value={draft[it.id] || ""}
            onChange={e => setAnswer(it.id, e.target.value)} />
        </div>
      );
    }
    if (kind === "multiselect") {
      const sel = Array.isArray(draft[it.id]) ? draft[it.id] : [];
      return (
        <div key={it.id} {...cardProps(it)}>
          {head}
          <p className="sub" style={{ margin: "-6px 0 12px" }}>Select all that apply.</p>
          <div className="msgrid">
            {(it.options || []).map(opt => (
              <button key={opt} className={`msopt ${sel.includes(opt) ? "on" : ""}`} onClick={() => toggleMs(it.id, opt)}>
                <span className="mscheck"><Icon name="ri-check-line" /></span><span>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div key={it.id} {...cardProps(it)}>
        {head}
        <div className="likert">
          {scale.map(({ value, label }) => (
            <button key={value} className={`lk ${String(draft[it.id]) === String(value) ? "on" : ""}`} onClick={() => setAnswer(it.id, value)}>
              <b>{value}</b><span>{label}</span>
            </button>
          ))}
        </div>
        {scale.length > 0 && (
          <div className="lk-mini">
            {scale[0].value} {scale[0].label.toLowerCase()} &rarr; {scale[scale.length - 1].value} {scale[scale.length - 1].label.toLowerCase()}
          </div>
        )}
      </div>
    );
  });

  const last = curStep === secs.length - 1;

  return (
    <div className={wrapClass} key={curStep}>
      <div className="page-head">
        <div>
          <h1>{form.title}</h1>
          <p className="sub">{target ? <>{target.instructor} &middot; {target.course}</> : form.subtitle}</p>
        </div>
        <button className="btn sm" onClick={leave}><Icon name="ri-close-line" />Leave</button>
      </div>

      <div className="qhead">
        <div className="steps">
          {secs.map((x, i) => {
            const f = x.items.every(it => isAnswered(draft[it.id]));
            return (
              <button key={x.id + i} className={`step ${i === curStep ? "on" : ""} ${f ? "filled" : ""}`} onClick={() => goStep(i)}>
                {f && <Icon name="ri-check-line" />}{x.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="shape sh-a" />
        <h2>{sec.title}</h2>
        <div className="sec-note">{sec.note}</div>
        {qs}
      </div>

      <div className="formfoot">
        <div className="ff-txt"><b>{answered}</b> of <b>{all.length}</b> answered</div>
        <div className="pbar" style={{ flex: 1, maxWidth: 190 }}><i style={{ width: pct + "%" }} /></div>
        {curStep > 0 && <button className="btn sm" onClick={() => { setMissing(new Set()); setStep(curStep - 1); }}>Back</button>}
        {last
          ? <button className={`btn primary sm ${busy ? "busy" : ""}`} onClick={submit}>{busy ? "Submitting…" : "Submit"}</button>
          : <button className="btn primary sm" onClick={() => { if (validateSection()) { setMissing(new Set()); setStep(curStep + 1); } }}>Next</button>}
      </div>
    </div>
  );
}
