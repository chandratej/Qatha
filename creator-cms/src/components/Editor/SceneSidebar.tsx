import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Trash2, PlusCircle, MoreVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';

export interface SceneBlock {
  id: string;
  title: string;
  content: string;
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
}: SceneSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = scenes.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (collapsed) {
    return (
      <div className="katha-proto-sidebar" style={{ width: 48, minWidth: 48 }}>
        <button type="button" className="katha-proto-nav-btn" onClick={onToggleCollapse} style={{ margin: 12 }}>
          <PlusCircle size={18} />
        </button>
      </div>
    );
  }

  const list = searchTerm ? filtered : scenes;

  return (
    <aside className="katha-proto-sidebar">
      <div className="katha-proto-sidebar-header">
        <div className="katha-proto-sidebar-title">Scenes</div>
        <div className="katha-proto-search">
          <Search size={14} color="var(--ink-muted)" />
          <input
            type="text"
            placeholder="Search scenes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button type="button" className="katha-proto-new-scene-btn" onClick={onAddScene}>
          <Plus size={16} /> New Scene
        </button>
      </div>

      <div className="katha-proto-scene-list">
        {searchTerm ? (
          list.map(scene => {
            const idx = scenes.findIndex(s => s.id === scene.id);
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
        >
          <Trash2 size={14} /> Trash
        </button>
        <div className="katha-proto-collapse-controls">
          <button type="button" onClick={onToggleCollapse} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}>
            ‹‹
          </button>
          <button type="button" onClick={onToggleCollapse} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}>
            Collapse
          </button>
          <button type="button" onClick={onAddScene} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}>
            +
          </button>
        </div>
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
        <p className="sc-u-scene-meta">{idx + 1}w • {words} words</p>
      </div>

      <div className="sc-u-menu-wrap sc-u-shrink-0" ref={menuRef}>
        <button
          type="button"
          className="sc-u-menu-btn"
          aria-label="Scene options"
          aria-expanded={menuOpen}
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
        >
          <MoreVertical size={16} strokeWidth={2} />
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