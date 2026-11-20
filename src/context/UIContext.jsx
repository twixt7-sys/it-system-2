import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Icon } from "../lib/icons";

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

function readTheme() {
  try {
    const t = localStorage.getItem("lcc-theme");
    if (t === "light" || t === "dark") return t;
  } catch { /* storage blocked */ }
  return "dark";
}

export function UIProvider({ children }) {
  /* ---- theme ---- */
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("lcc-theme", theme); } catch { /* storage blocked */ }
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);

  /* ---- toast ---- */
  const [toastState, setToastState] = useState({ msg: "", kind: "", on: false });
  const toastTimer = useRef();
  const toast = useCallback((msg, kind = "") => {
    setToastState({ msg, kind, on: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(s => ({ ...s, on: false })), 2600);
  }, []);

  /* ---- modal ---- */
  const [modalNode, setModalNode] = useState(null);
  const [modalOn, setModalOn] = useState(false);
  const clearTimer = useRef();
  const openModal = useCallback(node => {
    clearTimeout(clearTimer.current);
    setModalNode(node);
    setModalOn(true);
  }, []);
  const closeModal = useCallback(() => {
    setModalOn(false);
    clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setModalNode(null), 250);
  }, []);

  /* Promise-based confirm dialog: resolves true / false */
  const confirm = useCallback(({ title, text, ok = "Confirm", cancel = "Cancel", danger = true }) =>
    new Promise(resolve => {
      const done = v => { closeModal(); resolve(v); };
      openModal(
        <ModalBody title={title} onClose={() => done(false)}
          foot={<>
            <button className={`btn ${danger ? "danger" : "primary"}`} onClick={() => done(true)}>{ok}</button>
            <button className="btn ghost" onClick={() => done(false)}>{cancel}</button>
          </>}>
          <p className="sub" style={{ margin: 0 }}>{text}</p>
        </ModalBody>
      );
    }), [openModal, closeModal]);

  useEffect(() => {
    if (!modalOn) return;
    const onKey = e => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOn, closeModal]);

  return (
    <UICtx.Provider value={{ theme, toggleTheme, toast, openModal, closeModal, confirm }}>
      {children}
      <div className={`modal ${modalOn ? "on" : ""}`} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal-box">{modalNode}</div>
      </div>
      <div className={`toast ${toastState.on ? "on" : ""} ${toastState.kind}`.trim()} role="status" aria-live="polite">
        {toastState.msg}
      </div>
    </UICtx.Provider>
  );
}

/* Header + body + right-aligned footer, same layout as modal() in the mockup */
export function ModalBody({ title, children, foot, onClose }) {
  const { closeModal } = useUI();
  const headRef = useRef(null);
  // the modal is still visibility:hidden when it mounts, so autoFocus can't work; focus the first field once it shows
  useEffect(() => {
    const t = setTimeout(() => {
      const box = headRef.current?.closest(".modal-box");
      box?.querySelector("input:not([type=file]):not([readonly]), textarea:not([readonly]), select")?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <div className="mh" ref={headRef}>
        <h2>{title}</h2>
        <button className="icon-btn" onClick={onClose || closeModal} aria-label="Close"><Icon name="ri-close-line" /></button>
      </div>
      {children}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18, flexWrap: "wrap" }}>{foot}</div>
    </>
  );
}
