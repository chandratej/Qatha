import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

export interface DateRange {
  start: Date;
  end: Date;
}

function toInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fromInputValue(v: string) {
  return new Date(v + 'T12:00:00');
}

function formatLabel(range: DateRange) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

const PRESETS: { id: string; label: string; days: number }[] = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
];

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(toInputValue(value.start));
  const [draftEnd, setDraftEnd] = useState(toInputValue(value.end));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftStart(toInputValue(value.start));
    setDraftEnd(toInputValue(value.end));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const apply = () => {
    const start = fromInputValue(draftStart);
    const end = fromInputValue(draftEnd);
    if (start <= end) {
      onChange({ start, end });
      setOpen(false);
    }
  };

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    onChange({ start, end });
    setOpen(false);
  };

  return (
    <div className="date-range-picker" ref={rootRef}>
      <button
        type="button"
        className="dashboard-date-picker date-range-picker__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Date range: ${formatLabel(value)}`}
      >
        <CalendarDays size={16} aria-hidden />
        {formatLabel(value)}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div className="date-range-picker__panel cms-panel" role="dialog" aria-label="Select date range">
          <div className="date-range-picker__presets">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className="date-range-picker__preset" onClick={() => applyPreset(p.days)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="date-range-picker__fields">
            <label className="input-group">
              <span>From</span>
              <input type="date" className="cms-input" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
            </label>
            <label className="input-group">
              <span>To</span>
              <input type="date" className="cms-input" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} />
            </label>
          </div>
          <button type="button" className="dashboard-cta date-range-picker__apply" onClick={apply}>
            Apply range
          </button>
        </div>
      )}
    </div>
  );
}

export function defaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return { start, end };
}