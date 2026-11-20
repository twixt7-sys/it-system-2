/* shared bar-row used by Overview and Results */
export default function BarRow({ label, pct, value, color, title, labelStyle, style }) {
  return (
    <div className="bar-row" style={style}>
      <div className="bar-lab" title={title || label} style={labelStyle}>{label}</div>
      <div className="bar-track"><div className="bar-fill" style={{ width: Math.max(0, Math.min(100, pct || 0)) + "%", background: color }} /></div>
      <div className="bar-val">{value}</div>
    </div>
  );
}
