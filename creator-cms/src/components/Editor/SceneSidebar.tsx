import { useState } from 'react';
import { Plus, Search, Trash2, PlusCircle } from 'lucide-react';
import { Reorder } from 'framer-motion';

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
              />
            );
          })
        ) : (
          <Reorder.Group axis="y" values={scenes} onReorder={onReorderScenes} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {scenes.map((scene, idx) => (
              <Reorder.Item key={scene.id} value={scene}>
                <SceneRow
                  idx={idx}
                  scene={scene}
                  active={activeSceneId === scene.id}
                  onClick={() => onSwitchScene(scene.id)}
                />
              </Reorder.Item>
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

function SceneRow({ idx, scene, active, onClick }: { idx: number; scene: SceneBlock; active: boolean; onClick: () => void }) {
  const words = getWordCount(scene.content);
  return (
    <div className={`katha-proto-scene-item${active ? ' active' : ''}`} onClick={onClick}>
      <div className="katha-proto-scene-item-title">
        {idx + 1} {scene.title || 'Untitled'}
      </div>
      <div className="katha-proto-scene-item-meta">
        {idx + 1}w • {words} words
      </div>
    </div>
  );
}