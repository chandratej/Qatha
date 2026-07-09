import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Trash2, PanelLeftClose, PanelLeftOpen, MoreVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { applyPhoneticToTrailingWord } from '../../business/phoneticText';
import {
  detectSceneSearchInputMode,
  dismissSceneSearchHelper,
  sceneMatchesQuery,
  sceneSearchSuggestions,
  shouldShowSceneSearchHelper,
} from '../../lib/sceneSearch';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';
import { saveEditorPrefs, type SceneSearchInputMode } from '../../lib/editorPrefs';

export interface SceneBlock {
  id: string;
  title: string;
  content: string;
  keywords?: string[];
  aliases?: string[];
}

interface SceneSidebarProps {
  scenes: SceneBlock[];
  activeSceneId: string;
  onSwitchScene: (id: string) => void;
  onAddScene: () => void;
  onReorderScenes: (scenes: SceneBlock[]) => void;
  onDeleteScene?: (id: string) => void;
  onDuplicateScene?: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  drawerMode?: boolean;
  onCloseDrawer?: () => void;
  phoneticLive?: boolean;
  storyId?: string;
  chapterNum?: number;
  sceneSearchInputMode?: SceneSearchInputMode;
}

function getWordCount(html: string) {
  if (!html) return 0;
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.textContent || '';
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function SceneSidebar({
  scenes,
  activeSceneId,
  onSwitchScene,
  onAddScene,
  onReorderScenes,
  onDeleteScene,
  onDuplicateScene,
  collapsed,
  onToggleCollapse,
  drawerMode = false,
  onCloseDrawer,
  phoneticLive = true,
  storyId,
  chapterNum,
  sceneSearchInputMode,
}: SceneSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelper, setShowHelper] = useState(shouldShowSceneSearchHelper);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = scenes.filter((s) => sceneMatchesQuery(s, searchTerm));
  const suggestions = sceneSearchSuggestions(scenes, searchTerm);

  const handleSearchChange = (raw: string) => {
    const next = phoneticLive ? applyPhoneticToTrailingWord(raw) : raw;
    setSearchTerm(next);
    setSuggestionsOpen(next.trim().length > 0);
    if (storyId && chapterNum !== undefined && next.trim()) {
      const mode = detectSceneSearchInputMode(next);
      if (mode !== sceneSearchInputMode) {
        saveEditorPrefs(storyId, chapterNum, { sceneSearchInputMode: mode });
      }
    }
  };

  const dismissHelper = () => {
    dismissSceneSearchHelper();
    setShowHelper(false);
  };

  if (collapsed && !drawerMode) {
    return (
      <aside className="katha-proto-sidebar katha-proto-sidebar--collapsed-rail">
        <button
          type="button"
          className="katha-proto-sidebar-rail-btn"
          onClick={onToggleCollapse}
          title="Expand scenes"
          aria-label="Expand scenes panel"
        >
          <PanelLeftOpen size={18} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
        <span className="katha-proto-sidebar-rail-label" aria-hidden>Scenes</span>
      </aside>
    );
  }

  const list = searchTerm.trim() ? filtered : scenes;

  return (
    <aside className={`katha-proto-sidebar${drawerMode ? ' katha-proto-sidebar--drawer' : ''}`}>
      {drawerMode && onCloseDrawer && (
        <button type="button" className="katha-proto-sidebar-drawer-close" onClick={onCloseDrawer} aria-label="Close scenes">
          ×
        </button>
      )}
      <div className="katha-proto-sidebar-header">
        <div className="katha-proto-sidebar-title-row">
          <div className="katha-proto-sidebar-title">
            Scenes
            <span className="katha-proto-sidebar-count" aria-label={`${scenes.length} scenes`}>
              {scenes.length}
            </span>
          </div>
          {!drawerMode && (
            <button
              type="button"
              className="katha-proto-sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title="Collapse scenes"
              aria-label="Collapse scenes panel"
            >
              <PanelLeftClose size={16} strokeWidth={EDITOR_ICON_STROKE} />
            </button>
          )}
        </div>
        <div className="katha-proto-search-wrap">
          <div className="katha-proto-search">
            <Search size={14} color="var(--ink-muted)" strokeWidth={EDITOR_ICON_STROKE} aria-hidden />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search scenes (Telugu / English phonetic)..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchTerm.trim() && setSuggestionsOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setSuggestionsOpen(false), 120);
                if (phoneticLive && searchTerm) {
                  handleSearchChange(`${searchTerm} `);
                }
              }}
              aria-label="Search scenes by title or content"
              aria-autocomplete="list"
              aria-controls={suggestionsOpen ? 'katha-scene-search-suggestions' : undefined}
              lang="te"
            />
          </div>
          {showHelper && (
            <p className="katha-proto-search-helper">
              You can type Telugu using English letters.
              <button type="button" className="katha-proto-search-helper__dismiss" onClick={dismissHelper}>
                Got it
              </button>
            </p>
          )}
          {suggestionsOpen && suggestions.length > 0 && (
            <ul id="katha-scene-search-suggestions" className="katha-proto-search-suggestions" role="listbox">
              {suggestions.map((s) => (
                <li key={s.sceneId} role="option">
                  <button
                    type="button"
                    className="katha-proto-search-suggestion"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSwitchScene(s.sceneId);
                      setSearchTerm('');
                      setSuggestionsOpen(false);
                      searchRef.current?.blur();
                    }}
                  >
                    <span className="katha-proto-search-suggestion__title">{s.label}</span>
                    <span className="katha-proto-search-suggestion__meta">
                      {s.matchField === 'content' ? 'in content' : 'title'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="katha-proto-new-scene-btn" onClick={onAddScene}>
          <Plus size={16} strokeWidth={EDITOR_ICON_STROKE} /> New scene
        </button>
      </div>

      <div className="katha-proto-scene-list" role="listbox" aria-label="Chapter scenes">
        {searchTerm.trim() ? (
          list.length > 0 ? (
            list.map((scene) => {
              const idx = scenes.findIndex((s) => s.id === scene.id);
              return (
                <SceneRow
                  key={scene.id}
                  idx={idx}
                  scene={scene}
                  active={activeSceneId === scene.id}
                  onClick={() => onSwitchScene(scene.id)}
                  onDelete={onDeleteScene}
                  onDuplicate={onDuplicateScene}
                  draggable={false}
                />
              );
            })
          ) : (
            <div className="katha-proto-scene-search-empty">
              <p>No scenes match “{searchTerm.trim()}”.</p>
              <button type="button" className="katha-proto-scene-search-empty__clear" onClick={() => setSearchTerm('')}>
                Clear search
              </button>
            </div>
          )
        ) : scenes.length === 0 ? (
          <div className="katha-proto-scene-search-empty">
            <p>No scenes yet. Create your first beat.</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={scenes} onReorder={onReorderScenes} className="sc-u-list-reset">
            {scenes.map((scene, idx) => (
              <SceneRow
                key={scene.id}
                idx={idx}
                scene={scene}
                active={activeSceneId === scene.id}
                onClick={() => onSwitchScene(scene.id)}
                onDelete={onDeleteScene}
                onDuplicate={onDuplicateScene}
                draggable
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      <div className="katha-proto-sidebar-footer">
        <button
          type="button"
          className="katha-proto-trash-btn"
          onClick={() => onDeleteScene?.(activeSceneId)}
          disabled={scenes.length <= 1}
          title={scenes.length <= 1 ? 'Keep at least one scene' : 'Delete active scene'}
        >
          <Trash2 size={14} strokeWidth={EDITOR_ICON_STROKE} /> Delete
        </button>
        {!drawerMode && (
          <button
            type="button"
            className="katha-proto-sidebar-footer-collapse"
            onClick={onToggleCollapse}
          >
            Collapse
          </button>
        )}
      </div>
    </aside>
  );
}

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
    <span className="sc-u-drag-dots" aria-hidden="true">
      <span /><span /><span /><span /><span /><span />
    </span>
  );
}

function SceneRow({ idx, scene, active, onClick, onDelete, onDuplicate, draggable }: SceneRowProps) {
  const words = getWordCount(scene.content);
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

  const card = (
    <article
      className={`sc-card sc-u-flex-row sc-u-items-center sc-u-gap-2 sc-u-px-3 sc-u-py-3 sc-u-mb-2 sc-u-min-w-0${active ? ' sc-card--active' : ' sc-card--idle'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-current={active ? 'true' : undefined}
    >
      <div className="sc-u-flex-row sc-u-items-center sc-u-gap-1 sc-u-shrink-0">
        <button
          type="button"
          className="sc-u-drag-btn"
          aria-label="Drag to reorder"
          onPointerDown={e => {
            e.stopPropagation();
            if (draggable) dragControls.start(e);
          }}
          onClick={e => e.stopPropagation()}
        >
          <DragDots />
        </button>
        <span className="sc-u-scene-num">{idx + 1}</span>
      </div>

      <div className="sc-u-flex-col sc-u-flex-1 sc-u-min-w-0 sc-u-gap-0">
        <h3 className="sc-u-scene-title">{scene.title || 'Untitled'}</h3>
        {words > 0 && <p className="sc-u-scene-meta">{words} words</p>}
      </div>

      <div className="sc-u-menu-wrap sc-u-shrink-0" ref={menuRef}>
        <button
          type="button"
          className="sc-u-menu-btn"
          aria-label="Scene options"
          aria-expanded={menuOpen}
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
        >
          <MoreVertical size={16} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
        {menuOpen && (onDuplicate || onDelete) && (
          <div className="sc-u-menu-dropdown" role="menu">
            {onDuplicate && (
              <button
                type="button"
                role="menuitem"
                className="sc-u-menu-item"
                onClick={e => { e.stopPropagation(); onDuplicate(scene.id); setMenuOpen(false); }}
              >
                Duplicate
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                className="sc-u-menu-item sc-u-menu-item--danger"
                onClick={e => { e.stopPropagation(); onDelete(scene.id); setMenuOpen(false); }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );

  if (!draggable) return card;

  return (
    <Reorder.Item value={scene} dragListener={false} dragControls={dragControls} className="sc-u-list-item">
      {card}
    </Reorder.Item>
  );
}