import { useState } from 'react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';
import { NARRATIVE_FORMAT_LABELS } from '../../lib/narrativeOsTypes';
import { EditorComfortControls } from '../Editor/EditorComfortControls';
import type { FontScale } from '../../lib/comfortPrefs';
import { useLocale } from '../../context/LocaleContext';

const FORMATS: NarrativeFormat[] = ['novel', 'chat', 'letter', 'choice'];

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
}: NarrativeInspectorPanelProps) {
  const { t } = useLocale();
  const [tab, setTab] = useState<'scene' | 'people' | 'notes' | 'settings'>('scene');

  return (
    <>
      <h4>{t('narrativeOs.inspector')}</h4>
      <div className="nos-insp-tabs">
        {(['scene', 'people', 'notes', 'settings'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {id === 'scene' ? 'Scene' : id === 'people' ? 'People' : id === 'notes' ? 'Notes' : 'Settings'}
          </button>
        ))}
      </div>

      {tab === 'scene' && (
        <div className="nos-insp-body">
          <div className="insp-row">
            <div className="insp-label">Scene</div>
            <div className="insp-value">{activeScene?.title || 'Untitled'}</div>
          </div>
          <div className="insp-row">
            <div className="insp-label">Format</div>
            <div className="nos-format-picks">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`nos-format-pick${narrativeFormat === f ? ' active' : ''}`}
                  onClick={() => onNarrativeFormatChange(f)}
                >
                  {NARRATIVE_FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="insp-row">
            <div className="insp-label">Words</div>
            <div className="insp-value">{wordCount.toLocaleString()}</div>
          </div>
          <div className="insp-row">
            <div className="insp-label">Characters</div>
            <div className={`insp-value${charCount > charLimit ? ' nos-over-limit' : ''}`}>
              {charCount.toLocaleString()} / {charLimit.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {tab === 'people' && (
        <div className="nos-insp-body nos-insp-body--scroll">
          {peopleSlot ?? <p className="nos-empty-hint">No characters linked to this scene.</p>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="nos-insp-body nos-insp-body--scroll">
          {notesSlot ?? <p className="nos-empty-hint">No author notes for this scene.</p>}
        </div>
      )}

      {tab === 'settings' && (
        <div className="nos-insp-body">
          <div className="insp-row">
            <div className="insp-label">Phonetic input</div>
            <button type="button" className={`nos-toggle${phoneticLive ? ' on' : ''}`} onClick={onTogglePhonetic}>
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