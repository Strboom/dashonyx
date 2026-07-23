import { AlertCircle, RotateCcw, Save } from 'lucide-react';

interface Props {
  onSave: () => void;
  onReset: () => void;
  saving?: boolean;
}

export default function UnsavedBanner({ onSave, onReset, saving }: Props) {
  return (
    <div className="unsaved-banner">
      <AlertCircle size={18} className="text-amber-400 shrink-0" />
      <span className="text-sm text-slate-200 font-medium whitespace-nowrap">
        You have unsaved changes
      </span>
      <div className="flex gap-2 ml-2">
        <button
          onClick={onReset}
          disabled={saving}
          className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <RotateCcw size={13} />
          Reset
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-indigo text-xs py-2 px-4 flex items-center gap-1.5"
        >
          {saving ? (
            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
