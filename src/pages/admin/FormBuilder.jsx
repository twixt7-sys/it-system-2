import { useState } from "react";
import { Icon } from "../../lib/icons";
import { parseCSV, normalizeScale } from "../../lib/helpers";
import { useData } from "../../context/DataContext";
import { ModalBody, useUI } from "../../context/UIContext";
import IoModal from "../../components/IoModal";
import { saveSections, replaceForm } from "../../data/api";

let memoForm = "faceval";

const cloneSections = form => JSON.parse(JSON.stringify(form.sections || []));

/* modal for adding / editing a question */
function ItemModal({ title, initial = "", initialOptions, saveLabel, onSave }) {
  const [text, setText] = useState(initial);
  const [opts, setOpts] = useState((initialOptions || []).join("\n"));
  const withOptions = Array.isArray(initialOptions);
  const [busy, setBusy] = useState(false);
  const { closeModal } = useUI();
  const save = async () => {
    setBusy(true);
    try { await onSave(text.trim(), opts.split(/\r?\n/).map(o => o.trim()).filter(Boolean)); }
    finally { setBusy(false); }
  };
  return (
    <ModalBody title={title} foot={<>
      <button className={`btn primary ${busy ? "busy" : ""}`} onClick={save}>{saveLabel}</button>
      <button className="btn ghost" onClick={closeModal}>Cancel</button>
    </>}>
      <div className="field"><label className="fl">Question text</label>
        <textarea className="input" style={{ minHeight: 80 }} value={text} onChange={e => setText(e.target.value)} autoFocus /></div>
      {withOptions && (
        <div className="field"><label className="fl">Choices, one per line</label>
          <textarea className="input" style={{ minHeight: 110 }} value={opts} onChange={e => setOpts(e.target.value)} /></div>
      )}
    </ModalBody>
  );
}

/* modal for adding / editing a section */
function SectionModal({ title, sec, saveLabel, onSave }) {
  const [t, setT] = useState(sec?.title || "");
  const [n, setN] = useState(sec?.note || "");
  const [k, setK] = useState("likert");
  const [busy, setBusy] = useState(false);
  const { closeModal } = useUI();
  const save = async () => { setBusy(true); try { await onSave({ title: t.trim(), note: n.trim(), kind: k }); } finally { setBusy(false); } };
  return (
    <ModalBody title={title} foot={<>
      <button className={`btn primary ${busy ? "busy" : ""}`} onClick={save}>{saveLabel}</button>
      <button className="btn ghost" onClick={closeModal}>Cancel</button>
    </>}>
      <div className="field"><label className="fl">Section title</label>
        <input className="input" value={t} onChange={e => setT(e.target.value)} autoFocus /></div>
      <div className="field"><label className="fl">{sec ? "Description" : "Description shown to students"}</label>
        <textarea className="input" style={{ minHeight: 70 }} value={n} onChange={e => setN(e.target.value)} /></div>
      {!sec && (
        <div className="field"><label className="fl">Answer type</label>
          <select className="input" value={k} onChange={e => setK(e.target.value)}>
            <option value="likert">Rating, 5 to 1</option>
            <option value="text">Open-ended</option>
          </select></div>
      )}
    </ModalBody>
  );
}

/* mockup adminForms + form-builder actions */
export default function FormBuilder() {
  const { formList, forms, responses } = useData();
  const { openModal, closeModal, toast, confirm } = useUI();
  const [builderForm, setBuilderForm] = useState(memoForm);
  memoForm = builderForm;
  const f = forms[builderForm] || formList[0];

  if (!f) return <div className="card"><div className="empty">No forms found. Run the seed script (npm run seed) to create them.</div></div>;

  const answeredCount = responses.filter(r => r.formId === f.id).length;

  const write = async (sections, okMsg) => {
    try { await saveSections(f.id, sections); closeModal(); toast(okMsg, "good"); }
    catch (e) { console.error(e); toast("Could not save. Check your connection", "bad"); }
  };

  const warnIfAnswered = async what => {
    if (!answeredCount) return true;
    return confirm({
      title: `${what}?`,
      text: `${answeredCount} response${answeredCount === 1 ? " has" : "s have"} already been submitted for this form. Removed questions will no longer appear in the results.`,
      ok: what,
    });
  };

  const addItem = si => openModal(
    <ItemModal title="Add item" saveLabel="Add item" initialOptions={f.sections[si].kind === "multiselect" ? [] : undefined} onSave={async (v, options) => {
      if (!v) return toast("Write the question first", "bad");
      const ms = f.sections[si].kind === "multiselect";
      if (ms && !options.length) return toast("Add at least one choice", "bad");
      const secs = cloneSections(f);
      secs[si].items.push({ id: secs[si].id + "_" + Date.now().toString(36), text: v, ...(ms ? { options } : {}) });
      await write(secs, "Item added");
    }} />
  );
  const editItem = (si, ii) => openModal(
    <ItemModal title="Edit item" saveLabel="Save changes" initial={f.sections[si].items[ii].text}
      initialOptions={f.sections[si].kind === "multiselect" ? f.sections[si].items[ii].options || [] : undefined}
      onSave={async (v, options) => {
      const secs = cloneSections(f);
      secs[si].items[ii].text = v || secs[si].items[ii].text;
      if (secs[si].kind === "multiselect" && options.length) secs[si].items[ii].options = options;
      await write(secs, "Item updated");
    }} />
  );
  const delItem = async (si, ii) => {
    if (!(await warnIfAnswered("Delete item"))) return;
    const secs = cloneSections(f);
    secs[si].items.splice(ii, 1);
    try { await saveSections(f.id, secs); toast("Item deleted"); } catch { toast("Could not save. Check your connection", "bad"); }
  };
  const addSection = () => openModal(
    <SectionModal title="Add section" saveLabel="Add section" onSave={async ({ title, note, kind }) => {
      if (!title) return toast("Name the section first", "bad");
      const s = { id: "X" + Date.now().toString(36), title, note, items: [] };
      if (kind === "text") s.kind = "text";
      await write([...cloneSections(f), s], "Section added");
    }} />
  );
  const editSection = si => openModal(
    <SectionModal title="Edit section" saveLabel="Save changes" sec={f.sections[si]} onSave={async ({ title, note }) => {
      const secs = cloneSections(f);
      secs[si].title = title || secs[si].title;
      secs[si].note = note;
      await write(secs, "Section updated");
    }} />
  );
  const delSection = async si => {
    if (!(await warnIfAnswered("Delete section"))) return;
    const secs = cloneSections(f);
    secs.splice(si, 1);
    try { await saveSections(f.id, secs); toast("Section deleted"); } catch { toast("Could not save. Check your connection", "bad"); }
  };

  const exportForm = () => {
    // eslint-disable-next-line no-unused-vars
    const { updatedAt, ...rest } = f;
    openModal(<IoModal title={"Export " + f.title} hint="Form structure as JSON. Save it, edit it, import it back."
      text={JSON.stringify(rest, null, 2)} filename={f.id + "-form.json"} />);
  };

  const importForm = () => openModal(
    <IoModal title="Import questions"
      hint="JSON accepts a full form object. CSV needs the columns: section, item. Rows with the same section are grouped."
      onApply={async txt => {
        let next;
        try {
          const v = txt.trim();
          if (v.startsWith("{")) {
            const o = JSON.parse(v);
            if (!Array.isArray(o.sections)) throw 0;
            next = { ...o, id: f.id, scale: normalizeScale(o.scale).length ? normalizeScale(o.scale) : f.scale };
          } else {
            const rows = parseCSV(v);
            if (!rows.length || !("section" in rows[0]) || !("item" in rows[0])) throw 0;
            const secs = [];
            rows.forEach(r => {
              let s = secs.find(x => x.title === r.section);
              if (!s) {
                s = { id: "X" + secs.length, title: r.section, note: r.description || "", items: [] };
                if ((r.type || "").toLowerCase() === "text") s.kind = "text";
                secs.push(s);
              }
              s.items.push({ id: "i" + Math.random().toString(36).slice(2, 7), text: r.item });
            });
            next = { ...f, sections: secs };
          }
        } catch { toast("That file does not match the expected format", "bad"); return; }
        if (answeredCount) {
          closeModal();
          if (!(await warnIfAnswered("Replace questions"))) return;
        }
        try {
          // eslint-disable-next-line no-unused-vars
          const { updatedAt, ...data } = next;
          await replaceForm(f.id, data);
          closeModal(); toast("Questions imported", "good");
        } catch (e) { console.error(e); toast("Could not save. Check your connection", "bad"); }
      }} />
  );

  return (
    <>
      <div className="card" style={{ marginBottom: 14, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {formList.map(x => (
              <button key={x.id} className={`step ${f.id === x.id ? "on" : ""}`} onClick={() => setBuilderForm(x.id)}>{x.title}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn sm" onClick={importForm}><Icon name="ri-upload-2-line" />Import CSV or JSON</button>
          <button className="btn sm" onClick={exportForm}><Icon name="ri-download-2-line" />Export</button>
          <button className="btn primary sm" onClick={addSection}><Icon name="ri-add-line" />Section</button>
        </div>
      </div>
      {f.sections.map((s, si) => (
        <div className="card" style={{ marginBottom: 12 }} key={s.id + si}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h3 style={{ flex: 1 }}>{s.title} <span style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: 12 }}>
              {s.kind === "text" ? "open-ended" : s.kind === "multiselect" ? "multi-select" : s.items.length + " items"}</span></h3>
            <button className="icon-btn" onClick={() => editSection(si)} aria-label="Edit section"><Icon name="ri-pencil-line" /></button>
            <button className="icon-btn del" onClick={() => delSection(si)} aria-label="Delete section"><Icon name="ri-delete-bin-6-line" /></button>
          </div>
          <p className="sub" style={{ margin: "0 0 14px" }}>{s.note}</p>
          {s.items.map((it, ii) => (
            <div className="qitem-row" key={it.id + ii}>
              <span className="qno" style={{ fontFamily: "'Space Grotesk'" }}>{ii + 1}</span>
              <div className="qi-t">{it.text}</div>
              <button className="icon-btn" onClick={() => editItem(si, ii)} aria-label="Edit item"><Icon name="ri-pencil-line" /></button>
              <button className="icon-btn del" onClick={() => delItem(si, ii)} aria-label="Delete item"><Icon name="ri-close-line" /></button>
            </div>
          ))}
          <button className="btn sm" style={{ marginTop: 8 }} onClick={() => addItem(si)}><Icon name="ri-add-line" />Add item</button>
        </div>
      ))}
    </>
  );
}
