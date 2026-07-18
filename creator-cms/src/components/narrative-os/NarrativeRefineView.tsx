import { useRef } from 'react';
import {
  ArrowLeft, BookOpen, Feather, Leaf, Moon, PenLine, Smartphone, Sun, Tablet,
} from 'lucide-react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { PreviewDevice, PreviewTheme } from '../../lib/editorPrefs';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';
import { sceneHasContent } from '../../lib/sceneContent';
import { sanitizeHtml } from '../../lib/sanitizeHtml';
import { refineEncouragement } from '../../lib/refineEncouragement';
import { useLocale } from '../../context/LocaleContext';
import { NarrativeRefineFindOverlay } from './NarrativeRefineFindOverlay';
import { stripHtml } from '../../lib/chapterFind';

interface NarrativeRefineViewProps {
  chapterTitle: string;
  chapterNum: number;
  scenes: SceneBlock[];
  narrativeFormat?: NarrativeFormat;
  device: PreviewDevice;
  theme: PreviewTheme;
  onDeviceChange: (d: PreviewDevice) => void;
  onThemeChange: (t: PreviewTheme) => void;
  totalWords: number;
  wordGoal: number;
  activeSceneId?: string;
  previewComfortStyle?: React.CSSProperties;
  onBackToWrite: () => void;
  onContinueWriting: () => void;
  findOpen: boolean;
  findQuery: string;
  findReplace: string;
  findShowReplace: boolean;
  findMatchIndex: number;
  findMatchCount: number;
  onFindQueryChange: (value: string) => void;
  onFindReplaceChange: (value: string) => void;
  onFindToggleReplace: () => void;
  onFindClose: () => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onFindReplace: () => void;
  onFindReplaceNext: () => void;
  onFindReplaceAll: () => void;
}

const DEVICES: { id: PreviewDevice; Icon: typeof BookOpen; labelKey: 'refineDeviceReader' | 'refineDevicePhone' | 'refineDeviceTablet' }[] = [
  { id: 'mobile', Icon: Smartphone, labelKey: 'refineDevicePhone' },
  { id: 'tablet', Icon: Tablet, labelKey: 'refineDeviceTablet' },
  { id: 'desktop', Icon: BookOpen, labelKey: 'refineDeviceReader' },
];

const THEMES: { id: PreviewTheme; Icon: typeof Sun; labelKey: 'refineThemeLight' | 'refineThemeSepia' | 'refineThemeDark' }[] = [
  { id: 'light', Icon: Sun, labelKey: 'refineThemeLight' },
  { id: 'sepia', Icon: Leaf, labelKey: 'refineThemeSepia' },
  { id: 'dark', Icon: Moon, labelKey: 'refineThemeDark' },
];

function renderSceneBody(scene: SceneBlock, format: NarrativeFormat) {
  if (!sceneHasContent(scene.content)) return null;
  const html = sanitizeHtml(scene.content);
  if (format === 'chat') {
    const plain = stripHtml(scene.content);
    const lines = plain.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return <div className="nos-refine-reader__prose nos-refine-reader__prose--chat" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return (
      <div className="nos-refine-chat">
        {lines.map((line, i) => (
          <div key={`${scene.id}-b${i}`} className={`nos-refine-chat__bubble${i % 2 === 1 ? ' nos-refine-chat__bubble--alt' : ''}`}>
            {line}
          </div>
        ))}
      </div>
    );
  }
  if (format === 'letter') {
    return <div className="nos-refine-reader__prose nos-refine-reader__prose--letter" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  if (format === 'choice') {
    return (
      <div className="nos-refine-choice">
        <div className="nos-refine-reader__prose" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="nos-refine-choice__forks" aria-hidden>
          <span className="nos-refine-choice__fork">A · …</span>
          <span className="nos-refine-choice__fork">B · …</span>
        </div>
      </div>
    );
  }
  return <div className="nos-refine-reader__prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function NarrativeRefineView({
  chapterTitle,
  chapterNum,
  scenes,
  narrativeFormat = 'novel',
  device,
  theme,
  onDeviceChange,
  onThemeChange,
  totalWords,
  wordGoal,
  activeSceneId,
  previewComfortStyle,
  onBackToWrite,
  onContinueWriting,
  findOpen,
  findQuery,
  findReplace,
  findShowReplace,
  findMatchIndex,
  findMatchCount,
  onFindQueryChange,
  onFindReplaceChange,
  onFindToggleReplace,
  onFindClose,
  onFindNext,
  onFindPrev,
  onFindReplace,
  onFindReplaceNext,
  onFindReplaceAll,
}: NarrativeRefineViewProps) {
  const { t, locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const readMins = Math.max(0, Math.round(totalWords / 200)) || (totalWords > 0 ? 1 : 0);
  const resolvedTheme = theme === 'high-contrast' ? 'sepia' : theme;
  const filledScenes = scenes.filter((s) => sceneHasContent(s.content)).length;
  const encouragement = refineEncouragement(totalWords, wordGoal, locale);

  return (
    <div className="nos-refine-theater">
      <NarrativeRefineFindOverlay
        open={findOpen}
        query={findQuery}
        replaceText={findReplace}
        showReplace={findShowReplace}
        matchIndex={findMatchIndex}
        matchCount={findMatchCount}
        activeSceneId={activeSceneId ?? ''}
        onQueryChange={onFindQueryChange}
        onReplaceTextChange={onFindReplaceChange}
        onToggleReplace={onFindToggleReplace}
        onClose={onFindClose}
        onNext={onFindNext}
        onPrev={onFindPrev}
        onReplace={onFindReplace}
        onReplaceNext={onFindReplaceNext}
        onReplaceAll={onFindReplaceAll}
      />

      <header className="nos-refine-theater__header">
        <button type="button" className="nos-refine-theater__back" onClick={onBackToWrite}>
          <ArrowLeft size={15} aria-hidden />
          {locale === 'te' ? 'ప్రివ్యూ మూసివేయండి' : t('narrativeOs.backToWrite')}
        </button>

        <div className="nos-refine-theater__intro">
          <p className="nos-refine-theater__eyebrow">
            <span className="nos-refine-theater__dot" aria-hidden />
            {locale === 'te' ? 'పాఠకుల ప్రివ్యూ — ఇది మీ పాఠకులు చూసేది' : t('narrativeOs.refineEyebrow')}
          </p>
          <p className="nos-refine-theater__tagline">{t('narrativeOs.refineTagline')}</p>
        </div>

        <div className="nos-refine-theater__controls">
          <div className="nos-refine-dock" role="group" aria-label={t('narrativeOs.refineDeviceLabel')}>
            {DEVICES.map(({ id, Icon, labelKey }) => (
              <button
                key={id}
                type="button"
                className={`nos-refine-dock__btn${device === id ? ' active' : ''}`}
                onClick={() => onDeviceChange(id)}
                aria-pressed={device === id}
              >
                <Icon size={14} aria-hidden />
                <span>{t(`narrativeOs.${labelKey}`)}</span>
              </button>
            ))}
          </div>
          <div className="nos-refine-dock nos-refine-dock--theme" role="group" aria-label={t('narrativeOs.refineThemeLabel')}>
            {THEMES.map(({ id, Icon, labelKey }) => (
              <button
                key={id}
                type="button"
                className={`nos-refine-dock__btn nos-refine-dock__btn--icon${resolvedTheme === id ? ' active' : ''}`}
                onClick={() => onThemeChange(id)}
                aria-pressed={resolvedTheme === id}
                title={t(`narrativeOs.${labelKey}`)}
              >
                <Icon size={14} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="nos-refine-theater__stage">
        {totalWords === 0 ? (
          <div className="nos-refine-theater__empty">
            <div className="nos-refine-theater__empty-icon" aria-hidden>
              <BookOpen size={40} strokeWidth={1.2} />
            </div>
            <h3>{encouragement.headline}</h3>
            <p>{encouragement.subline}</p>
            <button type="button" className="nos-refine-theater__cta" onClick={onContinueWriting}>
              <PenLine size={16} aria-hidden />
              {t('narrativeOs.refineStartWriting')}
            </button>
          </div>
        ) : (
          <div className={`nos-refine-frame nos-refine-frame--${device} nos-refine-frame--format-${narrativeFormat}`}>
            {device !== 'desktop' && <div className="nos-refine-frame__bezel" aria-hidden />}
            <article
              className={`nos-refine-frame__screen nos-refine-frame__screen--${narrativeFormat}`}
              data-preview-theme={resolvedTheme}
              data-narrative-format={narrativeFormat}
              style={previewComfortStyle}
            >
              <p className="nos-refine-reader__chapter nos-refine-reader__eyebrow">
                {locale === 'te' ? `అధ్యాయం ${chapterNum}` : `Chapter ${chapterNum}`}
              </p>
              <h1 className="nos-refine-reader__title" lang={locale === 'te' ? 'te' : 'en'}>
                {chapterTitle || t('narrativeOs.refineUntitled')}
              </h1>
              <div className="nos-refine-reader__divider" aria-hidden />
              {scenes.map((scene, index) => (
                <section
                  key={scene.id}
                  className={`nos-refine-reader__scene${activeSceneId === scene.id ? ' active' : ''}`}
                  data-scene-id={scene.id}
                >
                  {scene.title && scene.title !== 'New Scene' && scene.title !== `Scene ${index + 1}` && (
                    <h2 className="nos-refine-reader__scene-title" lang={locale === 'te' ? 'te' : 'en'}>
                      {scene.title}
                    </h2>
                  )}
                  {renderSceneBody(scene, narrativeFormat)}
                </section>
              ))}
            </article>
          </div>
        )}
      </div>

      <footer className="nos-refine-theater__motivation nos-refine-theater__bottom">
        <div className="nos-refine-momentum">
          <div className="nos-refine-momentum__copy">
            <Feather size={15} aria-hidden />
            <div>
              <p className="nos-refine-momentum__headline">
                {locale === 'te'
                  ? 'ప్రతి గొప్ప కథ ఒక వాక్యంతో మొదలవుతుంది. మీరు ఇప్పటికే ప్రారంభించారు.'
                  : encouragement.headline}
              </p>
              <p className="nos-refine-momentum__sub">{encouragement.subline}</p>
            </div>
          </div>
          {totalWords > 0 && (
            <div className="nos-refine-momentum__stats" aria-label={t('narrativeOs.refineStatsLabel')}>
              <span>{totalWords.toLocaleString()} {t('narrativeOs.refineWords')}</span>
              <span className="nos-refine-momentum__dot" aria-hidden>·</span>
              <span>{readMins < 1 ? '<1' : readMins} {t('narrativeOs.refineMinRead')}</span>
              <span className="nos-refine-momentum__dot" aria-hidden>·</span>
              <span>{filledScenes}/{scenes.length} {t('narrativeOs.refineScenes')}</span>
            </div>
          )}
        </div>
        <button type="button" className="nos-refine-theater__write-cta" onClick={onContinueWriting}>
          <PenLine size={15} aria-hidden />
          {locale === 'te' ? 'రాయడం కొనసాగించండి' : t('narrativeOs.refineKeepWriting')}
        </button>
      </footer>
    </div>
  );
}