import { useRef } from 'react';
import {
  ArrowLeft, BookOpen, Feather, Leaf, Moon, PenLine, Smartphone, Sun, Tablet,
} from 'lucide-react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { PreviewDevice, PreviewTheme } from '../../lib/editorPrefs';
import { sceneHasContent } from '../../lib/sceneContent';
import { sanitizeHtml } from '../../lib/sanitizeHtml';
import { refineEncouragement } from '../../lib/refineEncouragement';
import { useLocale } from '../../context/LocaleContext';
import { NarrativeRefineFindOverlay } from './NarrativeRefineFindOverlay';

interface NarrativeRefineViewProps {
  chapterTitle: string;
  chapterNum: number;
  scenes: SceneBlock[];
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

export function NarrativeRefineView({
  chapterTitle,
  chapterNum,
  scenes,
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
  const goalPct = Math.min(100, Math.round((totalWords / wordGoal) * 100));

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
          {t('narrativeOs.backToWrite')}
        </button>

        <div className="nos-refine-theater__intro">
          <p className="nos-refine-theater__eyebrow">{t('narrativeOs.refineEyebrow')}</p>
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
          <div className={`nos-refine-frame nos-refine-frame--${device}`}>
            {device !== 'desktop' && <div className="nos-refine-frame__bezel" aria-hidden />}
            <article
              className="nos-refine-frame__screen"
              data-preview-theme={resolvedTheme}
              style={previewComfortStyle}
            >
              <p className="nos-refine-reader__chapter">
                {locale === 'te' ? `అధ్యాయం ${chapterNum}` : `Chapter ${chapterNum}`}
              </p>
              <h1 className="nos-refine-reader__title">{chapterTitle || t('narrativeOs.refineUntitled')}</h1>
              <div className="nos-refine-reader__divider" aria-hidden />
              {scenes.map((scene, index) => (
                <section
                  key={scene.id}
                  className={`nos-refine-reader__scene${activeSceneId === scene.id ? ' active' : ''}`}
                  data-scene-id={scene.id}
                >
                  {scene.title && scene.title !== 'New Scene' && scene.title !== `Scene ${index + 1}` && (
                    <h2 className="nos-refine-reader__scene-title">{scene.title}</h2>
                  )}
                  {sceneHasContent(scene.content) ? (
                    <div className="nos-refine-reader__prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(scene.content) }} />
                  ) : null}
                </section>
              ))}
            </article>
          </div>
        )}
      </div>

      <footer className="nos-refine-theater__motivation">
        <div className="nos-refine-momentum">
          <div className="nos-refine-momentum__copy">
            <Feather size={15} aria-hidden />
            <div>
              <p className="nos-refine-momentum__headline">{encouragement.headline}</p>
              <p className="nos-refine-momentum__sub">{encouragement.subline}</p>
            </div>
          </div>
          {totalWords > 0 && (
            <div className="nos-refine-momentum__stats" aria-label={t('narrativeOs.refineStatsLabel')}>
              <span>{totalWords.toLocaleString()} {t('narrativeOs.refineWords')}</span>
              <span className="nos-refine-momentum__dot" aria-hidden>·</span>
              <span>{readMins} {t('narrativeOs.refineMinRead')}</span>
              <span className="nos-refine-momentum__dot" aria-hidden>·</span>
              <span>{filledScenes}/{scenes.length} {t('narrativeOs.refineScenes')}</span>
            </div>
          )}
          <div className="nos-refine-momentum__progress" role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100}>
            <span className="nos-refine-momentum__fill" style={{ width: `${goalPct}%` }} />
          </div>
        </div>
        <button type="button" className="nos-refine-theater__write-cta" onClick={onContinueWriting}>
          <PenLine size={15} aria-hidden />
          {t('narrativeOs.refineKeepWriting')}
        </button>
      </footer>
    </div>
  );
}