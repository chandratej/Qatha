import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import {
  applyLivePhoneticToPlainText,
  finalizePhoneticPlainText,
  mapCursorAfterLivePhonetic,
} from '../business/phoneticText';

type Base = {
  value: string;
  onChange: (value: string) => void;
  /** Live roman→Telugu phonetic (serial editor parity). Native Telugu IME always works. */
  phonetic?: boolean;
  className?: string;
  style?: CSSProperties;
  lang?: string;
};

type InputProps = Base &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
    multiline?: false;
  };

type AreaProps = Base &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
    multiline: true;
  };

/**
 * Telugu-safe field for titles, cast names, and chat lines.
 * - IME composition never interrupted by parent re-renders
 * - Optional live phonetic (amma → అమ్మ)
 * - No -webkit-text-fill so complex scripts paint correctly
 */
export function TeluguTextField(props: InputProps | AreaProps) {
  const {
    value,
    onChange,
    phonetic = true,
    className,
    style,
    lang = 'te',
    multiline,
    onFocus,
    onBlur,
    ...rest
  } = props as (InputProps | AreaProps) & {
    onFocus?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };

  const [local, setLocal] = useState(value);
  const composingRef = useRef(false);
  const focusedRef = useRef(false);
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (composingRef.current || focusedRef.current) return;
    if (value !== lastEmitted.current) {
      setLocal(value);
      lastEmitted.current = value;
    }
  }, [value]);

  const emit = useCallback(
    (next: string) => {
      lastEmitted.current = next;
      setLocal(next);
      onChange(next);
    },
    [onChange],
  );

  const process = useCallback(
    (raw: string, target: HTMLInputElement | HTMLTextAreaElement | null, finalize: boolean) => {
      if (composingRef.current) {
        setLocal(raw);
        return;
      }
      if (!phonetic) {
        emit(raw);
        return;
      }
      const old = local;
      const next = finalize
        ? finalizePhoneticPlainText(raw)
        : applyLivePhoneticToPlainText(raw).text;
      const cursor = target?.selectionStart ?? raw.length;
      emit(next);
      if (target && next !== raw) {
        const mapped = mapCursorAfterLivePhonetic(old, next, cursor);
        requestAnimationFrame(() => {
          try {
            target.setSelectionRange(mapped, mapped);
          } catch {
            /* ignore */
          }
        });
      }
    },
    [emit, local, phonetic],
  );

  const sharedHandlers = {
    className,
    lang,
    dir: 'auto' as const,
    spellCheck: false as const,
    autoComplete: 'off' as const,
    value: local,
    style: {
      fontFamily:
        "'Noto Serif Telugu', 'Noto Sans Telugu', var(--font-telugu, 'Noto Serif Telugu'), Georgia, serif",
      WebkitTextFillColor: 'unset',
      ...style,
    } as CSSProperties,
    onFocus: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      focusedRef.current = true;
      onFocus?.(e);
    },
    onBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      focusedRef.current = false;
      composingRef.current = false;
      process(e.currentTarget.value, e.currentTarget, true);
      onBlur?.(e);
    },
    onCompositionStart: () => {
      composingRef.current = true;
    },
    onCompositionEnd: (e: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      composingRef.current = false;
      process(
        (e.target as HTMLInputElement | HTMLTextAreaElement).value,
        e.target as HTMLInputElement | HTMLTextAreaElement,
        false,
      );
    },
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (composingRef.current) {
        setLocal(e.target.value);
        return;
      }
      process(e.target.value, e.target, false);
    },
  };

  if (multiline) {
    const r = rest as Omit<AreaProps, keyof Base | 'multiline'>;
    return <textarea {...r} {...sharedHandlers} />;
  }

  const r = rest as Omit<InputProps, keyof Base | 'multiline'>;
  return <input type="text" {...r} {...sharedHandlers} />;
}
