import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['V'], desc: 'Select tool' },
  { keys: ['T'], desc: 'Add text tool' },
  { keys: ['A'], desc: 'Annotate tool' },
  { keys: ['S'], desc: 'Add signature tool' },
  { keys: ['Delete'], desc: 'Remove the selected overlay or annotation' },
  { keys: ['Ctrl/⌘', 'Z'], desc: 'Undo' },
  { keys: ['Ctrl/⌘', 'Shift', 'Z'], desc: 'Redo' },
  { keys: ['?'], desc: 'Show this help' },
];

export default function ShortcutsHelpModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Keyboard Shortcuts</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="modal-body">
          <div className="shortcuts-list">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="shortcuts-row">
                <div className="shortcuts-keys">
                  {s.keys.map((k, j) => <kbd key={j} className="kbd">{k}</kbd>)}
                </div>
                <span className="shortcuts-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
