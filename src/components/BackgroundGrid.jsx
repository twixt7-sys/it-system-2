import { useEffect, useMemo, useState } from "react";
import { isMobile } from "../lib/helpers";

/* Port of buildGrid(): a full-screen grid with a few randomly "lit" cells that pulse. */
export default function BackgroundGrid() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  useEffect(() => {
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setSize({ w: window.innerWidth, h: window.innerHeight }), 250); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);

  const grid = useMemo(() => {
    const cell = isMobile() ? 64 : 92;
    const cols = Math.ceil(size.w / cell), rows = Math.ceil(size.h / cell);
    const total = cols * rows, lit = new Map();
    while (lit.size < Math.min(14, Math.floor(total * 0.06))) {
      lit.set(Math.floor(Math.random() * total), {
        animationDelay: (Math.random() * 9).toFixed(2) + "s",
        animationDuration: (7 + Math.random() * 7).toFixed(1) + "s",
      });
    }
    return { cols, rows, total, lit };
  }, [size]);

  return (
    <div className="grid-layer"
      style={{ gridTemplateColumns: `repeat(${grid.cols},1fr)`, gridTemplateRows: `repeat(${grid.rows},1fr)` }}>
      {Array.from({ length: grid.total }, (_, i) =>
        grid.lit.has(i)
          ? <div key={i} className="grid-cell lit" style={grid.lit.get(i)} />
          : <div key={i} className="grid-cell" />
      )}
    </div>
  );
}
