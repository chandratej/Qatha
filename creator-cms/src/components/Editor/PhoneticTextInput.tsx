import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  applyLivePhoneticToPlainText,
  finalizePhoneticPlainText,
  mapCursorAfterLivePhonetic,
  replaceTrailingRomanInPlainText,
} from '../../business/phoneticText';
import {
  getPhoneticSuggestions,
  getSemanticAlternatives,
  type Suggestion,
} from '../../lib/phonetic';
import { PhoneticSuggestionsMenu } from './PhoneticSuggestionsMenu';

interface PhoneticTextInputProps {
  value: string;
  onChange: (value: string) => void;
  phoneticLive: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  style?: CSSProperties;
  type?: 'text' | 'search';
  enableSuggestions?: boolean;
  'aria-label'?: string;
  'aria-autocomplete'?: 'none' | 'list' | 'inline' | 'both';
  'aria-controls'?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlurExtra?: () => void;
}

export const PhoneticTextInput = forwardRef<HTMLInputElement, PhoneticTextInputProps>(function PhoneticTextInput({
  value,
  onChange,
  phoneticLive,
  className,
  placeholder,
  maxLength,
  style,
  type = 'text',
  enableSuggestions = true,
  'aria-label': ariaLabel,
  'aria-autocomplete': ariaAutocomplete,
  'aria-controls': ariaControls,
  onKeyDown,
  onFocus,
  onBlurExtra,
}, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trailingWord, setTrailingWord] = useState('');
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const updateSuggestionMenu = useCallback((trailing: string) => {
    if (!phoneticLive || !enableSuggestions || !trailing) {
      setTrailingWord('');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const phonetic = getPhoneticSuggestions(trailing);
    const semantic = getSemanticAlternatives(trailing);
    const merged = [...phonetic, ...semantic.filter((s) => !phonetic.some((p) => p.value === s.value))];

    setTrailingWord(trailing);
    setSuggestions(merged);
    setShowSuggestions(merged.length > 0);
    setSelectedIndex(0);
  }, [phoneticLive, enableSuggestions]);

  const positionMenu = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 220),
      zIndex: 10000,
    });
  }, []);

  useLayoutEffect(() => {
    if (cursorRef.current === null || !inputRef.current) return;
    const pos = cursorRef.current;
    inputRef.current.setSelectionRange(pos, pos);
    cursorRef.current = null;
  }, [value]);

  useEffect(() => {
    if (!showSuggestions) return;
    positionMenu();
    const onReposition = () => positionMenu();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [showSuggestions, value, positionMenu]);

  const commitValue = useCallback((next: string, trailing = '', nextCursor?: number) => {
    onChange(next);
    updateSuggestionMenu(trailing);
    if (nextCursor !== undefined) cursorRef.current = nextCursor;
  }, [onChange, updateSuggestionMenu]);

  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    const next = replaceTrailingRomanInPlainText(value, suggestion.value);
    commitValue(next, '', next.length);
    setShowSuggestions(false);
  }, [value, commitValue]);

  const handleChange = (raw: string) => {
    const input = inputRef.current;
    const cursorBefore = input?.selectionStart ?? raw.length;

    if (!phoneticLive) {
      commitValue(raw);
      return;
    }

    const { text, trailingWord: trailing } = applyLivePhoneticToPlainText(raw);
    const nextCursor = mapCursorAfterLivePhonetic(raw, text, cursorBefore);
    commitValue(text, trailing, nextCursor);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (phoneticLive && showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((p) => (p + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((p) => (p - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="katha-phonetic-input-wrap">
      <input
        ref={inputRef}
        type={type}
        className={className}
        style={style}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-label={ariaLabel || placeholder}
        aria-autocomplete={ariaAutocomplete}
        aria-controls={ariaControls}
        lang="te"
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (phoneticLive && enableSuggestions) {
            const { trailingWord: trailing } = applyLivePhoneticToPlainText(value);
            updateSuggestionMenu(trailing);
            if (trailing) positionMenu();
          }
          onFocus?.();
        }}
        onBlur={() => {
          window.setTimeout(() => setShowSuggestions(false), 120);
          if (phoneticLive && value) {
            const finalized = finalizePhoneticPlainText(value);
            if (finalized !== value) commitValue(finalized);
          }
          onBlurExtra?.();
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <PhoneticSuggestionsMenu
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          trailingWord={trailingWord}
          onSelect={insertSuggestion}
          style={menuStyle}
        />
      )}
    </div>
  );
});