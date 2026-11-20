import { useState } from "react";
import { Icon } from "../lib/icons";
import { downloadText } from "../lib/helpers";
import { ModalBody, useUI } from "../context/UIContext";

/* Port of ioModal(): upload a file or paste content, then Apply (import) — or Copy / Download (export). */
export default function IoModal({ title, hint, text = "", onApply, filename }) {
  const [value, setValue] = useState(text);
  const [busy, setBusy] = useState(false);
  const { toast, closeModal } = useUI();

  const onFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setValue(String(r.result));
    r.readAsText(f);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(value); toast("Copied", "good"); }
    catch { toast("Copy was blocked by the browser. Use Download instead", "bad"); }
  };

  const apply = async () => {
    setBusy(true);
    try { await onApply(value); } finally { setBusy(false); }
  };

  const isJson = (filename || "").endsWith(".json");

  return (
    <ModalBody title={title} foot={<>
      {onApply
        ? <button className={`btn primary ${busy ? "busy" : ""}`} onClick={apply}>{busy ? "Applying…" : "Apply"}</button>
        : <>
            <button className="btn primary" onClick={copy}>Copy</button>
            {filename && <button className="btn" onClick={() => downloadText(filename, value, isJson ? "application/json" : "text/csv")}>
              <Icon name="ri-download-2-line" />Download</button>}
          </>}
      <button className="btn ghost" onClick={closeModal}>Close</button>
    </>}>
      <p className="sub" style={{ margin: "0 0 14px" }}>{hint}</p>
      {onApply && (
        <div className="field"><label className="fl">Upload a file</label>
          <input className="input" type="file" accept=".csv,.json,.txt" onChange={onFile} /></div>
      )}
      <div className="field"><label className="fl">{onApply ? "Or paste the content" : "Content"}</label>
        <textarea className="input" value={value} onChange={e => setValue(e.target.value)} readOnly={!onApply}
          style={{ minHeight: 190, fontFamily: "'Space Grotesk',monospace", fontSize: 12 }} /></div>
    </ModalBody>
  );
}
