import { useState } from 'react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';
import { NARRATIVE_FORMAT_LABELS } from '../../lib/narrativeOsTypes';
import { EditorComfortControls } from '../Editor/EditorComfortControls';
import type { FontScale } from '../../lib/comfortPrefs';
import { useLocale } from '../../context/LocaleContext';
import { UI_CONFIG } from '../../config/ui_config';

const FORMATS: NarrativeFormat[] = ['novel', 'chat', 'letter'];
const CHAR_WARN_RATIO = UI_CONFIG.editor.charWarnRatio;

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
  charCount,
  charLimit,
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
        {TAB_KEYS.map((id) => (
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
          {/* Character limit is a real product constraint (~50k) but constant chrome
              mid-scene is noise. Surface only when approaching or over the limit. */}
          {charCount > charLimit * CHAR_WARN_RATIO && (
            <div className="insp-row insp-row--warning">
              <div className="insp-label">{charCount > charLimit ? 'Over limit' : 'Nearing limit'}</div>
              <div className={`insp-value${charCount > charLimit ? ' nos-over-limit' : ' nos-near-limit'}`}>
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'people' && (
        <div className="nos-insp-body nos-insp-body--scroll" role="tabpanel" id="nos-insp-panel-people" aria-labelledby="nos-insp-tab-people">
          {peopleSlot ?? <p className="nos-empty-hint">No characters linked to this scene.</p>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="nos-insp-body nos-insp-body--scroll" role="tabpanel" id="nos-insp-panel-notes" aria-labelledby="nos-insp-tab-notes">
          {notesSlot ?? <p className="nos-empty-hint">No author notes for this scene.</p>}
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