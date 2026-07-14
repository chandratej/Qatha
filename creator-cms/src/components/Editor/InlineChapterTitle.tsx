import { useState, useRef, useEffect } from 'react';
import { PhoneticTextInput } from './PhoneticTextInput';

interface InlineChapterTitleProps {
  value: string;
  onChange: (value: string) => void;
  phoneticLive: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  readOnly?: boolean;
}

export function InlineChapterTitle({
  value,
  onChange,
  phoneticLive,
  className = '',
  placeholder = 'Untitled Chapter',
  maxLength = 60,
  readOnly = false,
}: InlineChapterTitleProps) {
  const [editing, setEditing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    const input = wrapRef.current?.querySelector('input');
    input?.focus();
    input?.select();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [editing]);

  if (readOnly) {
    return (
      <span className={`katha-inline-title ${className}`} aria-label={`Chapter title: ${value || placeholder}`}>
        {value || placeholder}
      </span>
    );
  }

  if (editing) {
    return (
      <div ref={wrapRef} className={`katha-inline-title-wrap ${className}`}>
        <PhoneticTextInput
          className="katha-inline-title-input"
          value={value}
          onChange={onChange}
          phoneticLive={phoneticLive}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-label="Chapter title"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`katha-inline-title ${className}`}
      onClick={() => setEditing(true)}
      title="Click to edit chapter title"
      aria-label={`Chapter title: ${value || placeholder}. Click to edit.`}
    >
      {value || placeholder}
    </button>
  );
}