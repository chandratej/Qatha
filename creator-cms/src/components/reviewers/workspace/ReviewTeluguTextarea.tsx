import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react';
import {
  applyLivePhoneticToPlainText,
  finalizePhoneticPlainText,
  mapCursorAfterLivePhonetic,
  replaceTrailingRomanInPlainText,
} from '../../../business/phoneticText';
import {
  getPhoneticSuggestions,
  getSemanticAlternatives,
  type Suggestion,
} from '../../../lib/phonetic';
import { PhoneticSuggestionsMenu } from '../../Editor/PhoneticSuggestionsMenu';

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  phoneticLive: boolean;
}

export function ReviewTeluguTextarea({
  value,
  onChange,
  phoneticLive,
  className,
  rows = 3,
  placeholder,
  ...rest
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trailingWord, setTrailingWord] = useState('');
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();

  const updateSuggestionMenu = useCallback((trailing: string) => {
    if (!phoneticLive || !trailing) {
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
  }, [phoneticLive]);

  const positionMenu = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 220),
      zIndex: 10000,
    });
  }, []);

  useLayoutEffect(() => {
    if (cursorRef.current === null || !textareaRef.current) return;
    const pos = cursorRef.current;
    textareaRef.current.setSelectionRange(pos, pos);
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

  const insertSuggestion = useCallback((suggestion: Suggestion, suffix = '') => {
    const next = replaceTrailingRomanInPlainText(value, suggestion.value) + suffix;
    commitValue(next, '', next.length);
    setShowSuggestions(false);
  }, [value, commitValue]);

  const handleChange = (raw: string) => {
    const el = textareaRef.current;
    const cursorBefore = el?.selectionStart ?? raw.length;
    if (!phoneticLive) {
      commitValue(raw);
      return;
    }
    const { text, trailingWord: trailing } = applyLivePhoneticToPlainText(raw);
    const nextCursor = mapCursorAfterLivePhonetic(raw, text, cursorBefore);
    commitValue(text, trailing, nextCursor);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (phoneticLive && showSuggestions && suggestions.length > 0) {
      const pick = suggestions[selectedIndex] ?? suggestions[0];
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
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (pick) insertSuggestion(pick);
        return;
      }
      if ((e.key === ' ' || e.key === 'Spacebar') && !e.shiftKey) {
        e.preventDefault();
        if (pick) insertSuggestion(pick, ' ');
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }
  };

  return (
    <div className="katha-phonetic-input-wrap">
      <textarea
        ref={textareaRef}
        className={`rw-textarea rw-textarea--telugu${className ? ` ${className}` : ''}`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        lang="te"
        dir="auto"
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (phoneticLive) {
            const { trailingWord: trailing } = applyLivePhoneticToPlainText(value);
            updateSuggestionMenu(trailing);
            if (trailing) positionMenu();
          }
        }}
        onBlur={() => {
          window.setTimeout(() => setShowSuggestions(false), 120);
          if (phoneticLive && value) {
            const finalized = finalizePhoneticPlainText(value);
            if (finalized !== value) commitValue(finalized);
          }
        }}
        {...rest}
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
}