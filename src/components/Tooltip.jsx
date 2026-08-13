export default function Tooltip({ label, children }) {
  return (
    <div className="tooltip-wrap" data-tooltip={label}>
      {children}
    </div>
  );
}
