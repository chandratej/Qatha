import { useEffect, useRef, useState } from 'react';
import { Plus, Search, MoreVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import type { SceneBlock } from '../Editor/SceneSidebar';
import { PhoneticTextInput } from '../Editor/PhoneticTextInput';
import {
  sceneMatchesQuery,
  sceneSearchSuggestions,
} from '../../lib/sceneSearch';
import { useLocale } from '../../context/LocaleContext';

import { getSceneWordCount } from '../../lib/scenePacing';

interface SceneRowProps {
  idx: number;
  scene: SceneBlock;
  active: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  draggable?: boolean;
}

function DragDots() {
  return (
    <span className="nos-drag-dots" aria-hidden>
      <span /><span /><span /><span /><span /><span />
    </span>
  );
}

function ExplorerSceneRow({
  idx, scene, active, onClick, onDelete, onDuplicate, draggable, locale = 'en',
}: SceneRowProps & { locale?: string }) {
  const words = getSceneWordCount(scene.content, locale);
  const dragControls = useDragControls();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const row = (
    <div
      className={`nos-scene-row${active ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-current={active ? 'true' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
    >
      {draggable && (
        <button
          type="button"
          className="nos-drag-handle"
          aria-label="Drag to reorder"
          onPointerDown={(e) => { e.stopPropagation(); dragControls.start(e); }}
          onClick={(e) => e.stopPropagation()}
        >
          <DragDots />
        </button>
      )}
      <span className="n">{String(idx + 1).padStart(2, '0')}</span>
      <div className="nos-scene-row__body">
        <span className="nos-scene-row__title">{scene.title || 'Untitled'}</span>
        {words > 0 && <span className="nos-scene-row__meta">{words}w</span>}
      </div>
      <div className="nos-scene-menu" ref={menuRef}>
        <button
          type="button"
          className="nos-scene-menu__btn"
          aria-label="Scene options"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (onDuplicate || onDelete) && (
          <div className="nos-scene-menu__drop" role="menu">
            {onDuplicate && (
              <button type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); onDuplicate(scene.id); setMenuOpen(false); }}>
                Duplicate
              </button>
            )}
            {onDelete && (
              <button type="button" role="menuitem" className="danger" onClick={(e) => { e.stopPropagation(); onDelete(scene.id); setMenuOpen(false); }}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!draggable) return row;
  return (
    <Reorder.Item value={scene} dragListener={false} dragControls={dragControls}>
      {row}
    </Reorder.Item>
  );
}

export interface NarrativeExplorerPanelProps {
  scenes: SceneBlock[];
  activeSceneId: string;
  view: 'structure' | 'beats';
  onViewChange: (view: 'structure' | 'beats') => void;
  onSwitchScene: (id: string) => void;
  onAddScene: () => void;
  onReorderScenes: (scenes: SceneBlock[]) => void;
  onDeleteScene?: (id: string) => void;
  onDuplicateScene?: (id: string) => void;
  onUpdateBeatName: (sceneId: string, beatName: string) => void;
  phoneticLive?: boolean;
  chapterTitle: string;
  chapterNum: number;
  readOnly?: boolean;
  locale?: string;
}

export function NarrativeExplorerPanel({
  scenes,
  activeSceneId,
  view,
  onViewChange,
  onSwitchScene,
  onAddScene,
  onReorderScenes,
  onDeleteScene,
  onDuplicateScene,
  onUpdateBeatName,
  phoneticLive = true,
  chapterTitle,
  chapterNum,
  readOnly = false,
  locale = 'en',
}: NarrativeExplorerPanelProps) {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = scenes.filter((s) => sceneMatchesQuery(s, searchTerm));
  const suggestions = sceneSearchSuggestions(scenes, searchTerm);
  const list = searchTerm.trim() ? filtered : scenes;

  return (
    <>
      <h4>{t('narrativeOs.explorer')}</h4>
      <div className="nos-chapter-head">
        <span className="nos-chapter-head__title">{chapterTitle || `Chapter ${chapterNum}`}</span>
        <span className="nos-chapter-head__meta">Ch. {chapterNum} · {scenes.length} scenes</span>
      </div>
      <div className="seg">
        <button type="button" className={view === 'structure' ? 'active' : ''} onClick={() => onViewChange('structure')}>
          {t('narrativeOs.structure')}
        </button>
        <button type="button" className={view === 'beats' ? 'active' : ''} onClick={() => onViewChange('beats')}>
          {t('narrativeOs.beats')}
        </button>
      </div>

      {view === 'structure' ? (
        <div className="structure-view">
          <div className="nos-search">
            <Search size={13} aria-hidden />
            <PhoneticTextInput
              ref={searchRef}
              type="search"
              placeholder="Search scenes…"
              value={searchTerm}
              onChange={setSearchTerm}
              phoneticLive={phoneticLive}
              aria-label="Search scenes"
            />
          </div>
          {searchTerm.trim() && suggestions.length > 0 && (
            <ul className="nos-search-suggestions">
              {suggestions.map((s) => (
                <li key={s.sceneId}>
                  <button type="button" onClick={() => { onSwitchScene(s.sceneId); setSearchTerm(''); }}>
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="scene-list">
            {list.length === 0 ? (
              <p className="nos-empty-hint">{searchTerm.trim() ? 'No matches' : 'No scenes yet'}</p>
            ) : searchTerm.trim() ? (
              list.map((scene) => {
                const idx = scenes.findIndex((s) => s.id === scene.id);
                return (
                  <ExplorerSceneRow
                    key={scene.id}
                    idx={idx}
                    scene={scene}
                    active={activeSceneId === scene.id}
                    onClick={() => onSwitchScene(scene.id)}
                    onDelete={readOnly ? undefined : onDeleteScene}
                    onDuplicate={readOnly ? undefined : onDuplicateScene}
                    locale={locale}
                  />
                );
              })
            ) : (
              <Reorder.Group axis="y" values={scenes} onReorder={readOnly ? () => {} : onReorderScenes}>
                {scenes.map((scene, idx) => (
                  <ExplorerSceneRow
                    key={scene.id}
                    idx={idx}
                    scene={scene}
                    active={activeSceneId === scene.id}
                    onClick={() => onSwitchScene(scene.id)}
                    onDelete={readOnly ? undefined : onDeleteScene}
                    onDuplicate={readOnly ? undefined : onDuplicateScene}
                    draggable={!readOnly}
                    locale={locale}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>
          {!readOnly && (
            <button type="button" className="nos-add-scene" onClick={onAddScene}>
              <Plus size={14} /> Add scene
            </button>
          )}
        </div>
      ) : (
        <div className="beats active">
          <div className="beat-line">
            {scenes.map((scene, idx) => {
              const beat = scene.beatName ?? scene.title ?? `Beat ${idx + 1}`;
              return (
                <button
                  key={scene.id}
                  type="button"
                  className={`beat-item${scene.id === activeSceneId ? ' active' : ''}`}
                  onClick={() => onSwitchScene(scene.id)}
                  onDoubleClick={readOnly ? undefined : (e) => {
                    e.preventDefault();
                    const next = window.prompt('Beat name', beat);
                    if (next?.trim()) onUpdateBeatName(scene.id, next.trim());
                  }}
                >
                  <span className="beat-dot" />
                  {beat}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}