import { useEffect, useMemo, useState } from 'react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';
import { NARRATIVE_FORMAT_LABELS } from '../../lib/narrativeOsTypes';
import { EditorComfortControls } from '../Editor/EditorComfortControls';
import type { FontScale } from '../../lib/comfortPrefs';
import { useLocale } from '../../context/LocaleContext';
import { FEATURE_FLAGS } from '../../config/feature_flags';

const FORMATS: NarrativeFormat[] = ['novel', 'chat', 'letter'];

const TAB_KEYS = ['scene', 'people', 'notes', 'settings'] as const;
type InspectorTab = typeof TAB_KEYS[number];

export interface NarrativeInspectorPanelProps {
  activeScene?: SceneBlock;
  narrativeFormat: NarrativeFormat;
  onNarrativeFormatChange: (format: NarrativeFormat) => void;
  wordCount: number;
  charCount: number;
  charLimit: number;
  phoneticLive: boolean;
  onTogglePhonetic: () => void;
  fontScale: FontScale;
  onFontScaleChange: (scale: FontScale) => void;
  peopleSlot?: React.ReactNode;
  notesSlot?: React.ReactNode;
  readOnly?: boolean;
  /** MVP1: story format is fixed at creation — no per-chapter mode switch. */
  formatLocked?: boolean;
  storyContentType?: string | null;
  activeTab?: InspectorTab;
  onTabChange?: (tab: InspectorTab) => void;
}

export function NarrativeInspectorPanel({
  activeScene,
  narrativeFormat,
  onNarrativeFormatChange,
  wordCount,
  phoneticLive,
  onTogglePhonetic,
  fontScale,
  onFontScaleChange,
  peopleSlot,
  notesSlot,
  readOnly = false,
  formatLocked = true,
  storyContentType = null,
  activeTab: controlledTab,
  onTabChange,
}: NarrativeInspectorPanelProps) {
  const { t, locale } = useLocale();
  const [internalTab, setInternalTab] = useState<InspectorTab>('scene');
  const tab = controlledTab ?? internalTab;
  const setTab = (id: InspectorTab) => {
    onTabChange?.(id);
    if (!controlledTab) setInternalTab(id);
  };

  /**
   * §3.4 Studio tab integrity — never show empty / non-functional tabs to beta writers.
   * People requires craftEntities + a real slot; notes requires a notes slot when hiding incompletes.
   */
  const visibleTabs = useMemo(() => {
    return TAB_KEYS.filter((id) => {
      if (id === 'scene' || id === 'settings') return true;
      if (id === 'people') {
        if (!FEATURE_FLAGS.craftEntities) return false;
        if (FEATURE_FLAGS.hideIncompleteStudioTabs && !peopleSlot) return false;
        return true;
      }
      if (id === 'notes') {
        if (FEATURE_FLAGS.hideIncompleteStudioTabs && !notesSlot) return false;
        return true;
      }
      return true;
    });
  }, [peopleSlot, notesSlot]);

  useEffect(() => {
    if (!visibleTabs.includes(tab)) {
      setTab(visibleTabs[0] ?? 'scene');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-home when visibility changes
  }, [visibleTabs.join('|'), tab]);

  const tabLabel = (id: InspectorTab) => {
    if (id === 'scene') return t('narrativeOs.inspectorScene');
    if (id === 'people') return t('narrativeOs.inspectorPeople');
    if (id === 'notes') return t('narrativeOs.inspectorNotes');
    return t('narrativeOs.inspectorSettings');
  };

  return (
    <>
      <h4>{t('narrativeOs.inspector')}</h4>
      <div className="nos-insp-tabs" role="tablist" aria-label={t('narrativeOs.inspector')}>
        {visibleTabs.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`nos-insp-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`nos-insp-panel-${id}`}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {tabLabel(id)}
          </button>
        ))}
      </div>

      {tab === 'scene' && (
        <div className="nos-insp-body" role="tabpanel" id="nos-insp-panel-scene" aria-labelledby="nos-insp-tab-scene">
          <div className="insp-row">
            <div className="insp-label">Scene</div>
            <div className="insp-value">{activeScene?.title || 'Untitled'}</div>
          </div>
          <div className="insp-row">
            <div className="insp-label">{locale === 'te' ? 'కథా ఫార్మాట్' : 'Story format'}</div>
            {formatLocked ? (
              <div className="insp-value nos-format-locked">
                {NARRATIVE_FORMAT_LABELS[narrativeFormat]}
                <span className="nos-format-locked__hint">
                  {locale === 'te'
                    ? 'కథ సృష్టి సమయంలో సెట్ — MVP1లో ఎడిటర్‌లో మార్చలేరు'
                    : 'Set at story creation — locked in MVP1'}
                  {storyContentType ? ` (${storyContentType})` : ''}
                </span>
              </div>
            ) : (
              <div className="nos-format-picks">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`nos-format-pick${narrativeFormat === f ? ' active' : ''}`}
                    onClick={() => !readOnly && onNarrativeFormatChange(f)}
                    disabled={readOnly}
                    aria-pressed={narrativeFormat === f}
                  >
                    {NARRATIVE_FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="insp-row">
            <div className="insp-label">Words</div>
            <div className="insp-value">{wordCount.toLocaleString()}</div>
          </div>
          {/* Character ceiling removed — length is word-based for serials. */}
        </div>
      )}

      {tab === 'people' && (
        <div className="nos-insp-body nos-insp-body--scroll" role="tabpanel" id="nos-insp-panel-people" aria-labelledby="nos-insp-tab-people">
          {peopleSlot ?? <p className="nos-empty-hint">{t('narrativeOs.inspectorEmptyPeople')}</p>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="nos-insp-body nos-insp-body--scroll" role="tabpanel" id="nos-insp-panel-notes" aria-labelledby="nos-insp-tab-notes">
          {notesSlot ?? <p className="nos-empty-hint">{t('narrativeOs.inspectorEmptyNotes')}</p>}
        </div>
      )}

      {tab === 'settings' && (
        <div className="nos-insp-body" role="tabpanel" id="nos-insp-panel-settings" aria-labelledby="nos-insp-tab-settings">
          <div className="insp-row">
            <div className="insp-label">Phonetic input</div>
            <button
              type="button"
              className={`nos-toggle${phoneticLive ? ' on' : ''}`}
              onClick={onTogglePhonetic}
              disabled={readOnly}
              aria-pressed={phoneticLive}
            >
              {phoneticLive ? 'On' : 'Off'}
            </button>
          </div>
          <div className="insp-row">
            <div className="insp-label">Text size</div>
            <EditorComfortControls fontScale={fontScale} onFontScaleChange={onFontScaleChange} compact />
          </div>
        </div>
      )}
    </>
  );
}