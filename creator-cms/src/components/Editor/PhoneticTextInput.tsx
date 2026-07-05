import type { CSSProperties } from 'react';
import { applyPhoneticToTrailingWord } from '../../business/phoneticText';

interface PhoneticTextInputProps {
  value: string;
  onChange: (value: string) => void;
  phoneticLive: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  style?: CSSProperties;
}

export function PhoneticTextInput({
  value,
  onChange,
  phoneticLive,
  className,
  placeholder,
  maxLength,
  style,
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
      onChange={(e) => handleChange(e.target.value)}
      onBlur={() => {
        if (phoneticLive && value) handleChange(applyPhoneticToTrailingWord(`${value} `).trimEnd());
      }}
    />
  );
}