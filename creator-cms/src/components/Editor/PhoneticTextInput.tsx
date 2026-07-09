import type { CSSProperties, KeyboardEvent } from 'react';
import { applyPhoneticToTrailingWord } from '../../business/phoneticText';

interface PhoneticTextInputProps {
  value: string;
  onChange: (value: string) => void;
  phoneticLive: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  style?: CSSProperties;
  'aria-label'?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBlurExtra?: () => void;
}

export function PhoneticTextInput({
  value,
  onChange,
  phoneticLive,
  className,
  placeholder,
  maxLength,
  style,
  'aria-label': ariaLabel,
  onKeyDown,
  onBlurExtra,
}: PhoneticTextInputProps) {
  const handleChange = (raw: string) => {
    onChange(phoneticLive ? applyPhoneticToTrailingWord(raw) : raw);
  };

  return (
    <input
      type="text"
      className={className}
      style={style}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label={ariaLabel || placeholder}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => {
        if (phoneticLive && value) handleChange(applyPhoneticToTrailingWord(`${value} `).trimEnd());
        onBlurExtra?.();
      }}
    />
  );
}