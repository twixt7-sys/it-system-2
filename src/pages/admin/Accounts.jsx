import { useState } from "react";
import { Icon } from "../../lib/icons";
import { parseCSV, csvCell } from "../../lib/helpers";
import { useData } from "../../context/DataContext";
import { ModalBody, useUI } from "../../context/UIContext";
import IoModal from "../../components/IoModal";
import { saveStudent, deleteStudent, importStudents, UserError } from "../../data/api";

/* Port of studentModal(): name, number, block, and the subject/teacher list */
function StudentModal({ student, originalId = student?.id, groups, responsesFor }) {
  const isNew = !originalId;
  const s = student || { id: "", name: "", group: groups[0] || "BSIT 1-A", load: [] };
  const [name, setName] = useState(s.name);
  const [id, setId] = useState(s.id);
  const [group, setGroup] = useState(s.group);
  const [load, setLoad] = useState(() => s.load.map(x => ({ ...x })));
  const [busy, setBusy] = useState(false);
  const { closeModal, toast, confirm, openModal } = useUI();
  const groupOptions = [...new Set(["BSIT 1-A", "BSIT 1-B", ...groups, s.group].filter(Boolean))];

  const setRow = (i, k, v) => setLoad(l => l.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const save = async () => {
    const n = name.trim(), i = id.trim();
    if (!n || !i) return toast("Name and student number are required", "bad");
    const rec = { id: i, name: n, group, load };
    if (!isNew && i !== originalId && responsesFor(originalId) > 0) {
      const draft = { name, id, group, load };
      const ok = await confirm({
        title: "Change student number?",
        text: `${s.name} already submitted ${responsesFor(originalId)} form(s) under ${originalId}. Those stay counted under the old number, so this student would have to answer again.`,
        ok: "Change it",
      });
      if (!ok) {
        // reopen the editor with what was typed
        openModal(<StudentModal student={{ ...s, ...draft }} originalId={originalId} groups={groups} responsesFor={responsesFor} />);
        return;
      }
    }
    setBusy(true);
    try {
      await saveStudent(isNew ? null : originalId, rec);
      closeModal();
      toast(isNew ? "Student added" : "Student updated", "good");
    } catch (e) {
      if (e instanceof UserError) toast(e.message, "bad");
      else { console.error(e); toast("Could not save. Check your connection", "bad"); }
    } finally { setBusy(false); }
  };

  return (
    <ModalBody title={isNew ? "Add student" : "Edit student"} foot={<>
      <button className={`btn primary ${busy ? "busy" : ""}`} onClick={save}>{isNew ? "Add student" : "Save changes"}</button>
      <button className="btn ghost" onClick={closeModal}>Cancel</button>
    </>}>
      <div className="field"><label className="fl">Full name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label className="fl">Student number</label>
          <input className="input" value={id} onChange={e => setId(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label className="fl">Block</label>
          <select className="input" value={group} onChange={e => setGroup(e.target.value)}>
            {groupOptions.map(g => <option key={g}>{g}</option>)}
          </select></div>
      </div>
      <label className="fl">Subjects and teachers</label>
      <div>
        {load.map((x, i) => (
          <div style={{ display: "flex", gap: 8, marginBottom: 7 }} key={i}>
            <input className="input" value={x.course} placeholder="Course" onChange={e => setRow(i, "course", e.target.value)} />
            <input className="input" value={x.instructor} placeholder="Instructor" onChange={e => setRow(i, "instructor", e.target.value)} />
            <button className="icon-btn del" type="button" style={{ flex: "0 0 34px" }}
              onClick={() => setLoad(l => l.filter((_, j) => j !== i))}><Icon name="ri-close-line" /></button>
          </div>
        ))}
      </div>
      <button className="btn sm" type="button" onClick={() => setLoad(l => [...l, { course: "", instructor: "" }])}>
        <Icon name="ri-add-line" />Add subject</button>
    </ModalBody>
  );
}

/* mockup adminAccounts + account actions */
export default function Accounts() {
  const { students, responses } = useData();
  const { openModal, closeModal, toast, confirm } = useUI();
  const groups = [...new Set(students.map(s => s.group).filter(Boolean))].sort();
  const responsesFor = id => responses.filter(r => r.studentId === id).length;

  const edit = s => openModal(<StudentModal student={s} groups={groups} responsesFor={responsesFor} />);

  const del = async s => {
    const ok = await confirm({
      title: "Delete account?",
      text: `${s.name}, ${s.id}. Submitted responses stay in the results.`,
      ok: "Delete",
    });
    if (!ok) return;
    try { await deleteStudent(s.id); toast("Account deleted"); }
    catch (e) { console.error(e); toast("Could not delete. Check your connection", "bad"); }
  };

  const exportStudents = () => openModal(
    <IoModal title="Export student accounts" hint="Same columns as the enrollment file." filename="students.csv"
      text={"no,student id,name,group,course,instructor\n" +
        students.flatMap((s, i) => (s.load.length ? s.load : [{ course: "", instructor: "" }])
          .map(l => [i + 1, csvCell(s.id), csvCell(s.name), csvCell(s.group), csvCell(l.course), csvCell(l.instructor)].join(","))).join("\n")} />
  );

  const importAccounts = () => openModal(
    <IoModal title="Import student accounts"
      hint="CSV columns: no, student id, name, group, course, instructor. One row per subject. Rows sharing a student number are merged into one account."
      onApply={async txt => {
        let rows;
        try {
          rows = txt.trim().startsWith("[") ? JSON.parse(txt) : parseCSV(txt);
          if (!Array.isArray(rows)) throw 0;
          rows = rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase().replace(/[\s_]/g, ""), v])));
        } catch { toast("That file does not match the expected format", "bad"); return; }
        try {
          const { added, updated } = await importStudents(rows, students);
          closeModal();
          toast(`${added} accounts added${updated ? `, ${updated} updated` : ""}`, "good");
        } catch (e) { console.error(e); toast("Could not import. Check your connection", "bad"); }
      }} />
  );

  return (
    <>
      <div className="card" style={{ marginBottom: 14, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <p className="sub" style={{ margin: 0, flex: 1 }}>{students.length} accounts. Import replaces nothing; new rows are added.</p>
          <button className="btn sm" onClick={importAccounts}><Icon name="ri-upload-2-line" />Import CSV or JSON</button>
          <button className="btn sm" onClick={exportStudents}><Icon name="ri-download-2-line" />Export</button>
          <button className="btn primary sm" onClick={() => edit(null)}><Icon name="ri-user-add-line" />Add student</button>
        </div>
      </div>
      <div className="rowlist">
        {students.length ? students.map(s => (
          <div className="rrow" style={{ gridTemplateColumns: "1.6fr 1fr auto" }} key={s.id}>
            <div className="rname"><b>{s.name}</b><small>{s.id} &middot; {s.group}</small></div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{s.load.length} subjects</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="icon-btn" onClick={() => edit(s)} aria-label="Edit"><Icon name="ri-pencil-line" /></button>
              <button className="icon-btn del" onClick={() => del(s)} aria-label="Delete"><Icon name="ri-delete-bin-6-line" /></button>
            </div>
          </div>
        )) : <div className="empty">No student accounts yet. Add one or import a CSV.</div>}
      </div>
    </>
  );
}
