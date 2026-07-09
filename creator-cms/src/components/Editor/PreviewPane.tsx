import React, { useEffect, useRef } from 'react';
import { BookOpen, Ellipsis, Leaf, Moon, PanelRightClose, Smartphone, Sun, Tablet } from 'lucide-react';
import type { SceneBlock } from './SceneSidebar';
import type { PreviewDevice, PreviewTheme } from '../../lib/editorPrefs';
import { sceneHasContent } from '../../lib/sceneContent';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';

interface PreviewPaneProps {
  chapterTitle: string;
  chapterNum: number;
  scenes: SceneBlock[];
  device: PreviewDevice;
  theme: PreviewTheme;
  onThemeChange: (theme: PreviewTheme) => void;
  onDeviceChange: (device: PreviewDevice) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  editorScrollRef?: React.RefObject<HTMLDivElement | null>;
  syncScroll: boolean;
  totalWords: number;
  activeSceneId?: string;
  previewComfortStyle?: React.CSSProperties;
  onCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const DEVICE_OPTIONS: {
  id: PreviewDevice;
  label: string;
  Icon: typeof BookOpen;
}[] = [
  { id: 'desktop', label: 'Reader', Icon: BookOpen },
  { id: 'mobile', label: 'Phone', Icon: Smartphone },
  { id: 'tablet', label: 'Tablet', Icon: Tablet },
];

const THEME_OPTIONS: {
  id: PreviewTheme;
  label: string;
  Icon: typeof Sun;
}[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'sepia', label: 'Sepia', Icon: Leaf },
  { id: 'dark', label: 'Dark', Icon: Moon },
];

export function PreviewPane({
  chapterTitle,
  chapterNum,
  scenes,
  device,
  theme,
  onThemeChange,
  onDeviceChange,
  scrollRef,
  editorScrollRef,
  syncScroll,
  totalWords,
  activeSceneId,
  previewComfortStyle,
  onCollapse,
  mobileOpen = false,
  onCloseMobile,
}: PreviewPaneProps) {
  const syncingRef = useRef(false);
  const readMins = Math.max(0, Math.round(totalWords / 200)) || (totalWords > 0 ? 1 : 0);

  useEffect(() => {
    if (!activeSceneId || !scrollRef.current) return;
    const block = scrollRef.current.querySelector<HTMLElement>(
      `[data-scene-id="${activeSceneId}"]`,
    );
    block?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSceneId, scrollRef]);

  useEffect(() => {
    if (!syncScroll || !editorScrollRef?.current || !scrollRef.current) return;
    const editorEl = editorScrollRef.current;
    const previewEl = scrollRef.current;
    const onEditorScroll = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      const ratio = editorEl.scrollTop / Math.max(1, editorEl.scrollHeight - editorEl.clientHeight);
      previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
      requestAnimationFrame(() => { syncingRef.current = false; });
    };
    const onPreviewScroll = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      const ratio = previewEl.scrollTop / Math.max(1, previewEl.scrollHeight - previewEl.clientHeight);
      editorEl.scrollTop = ratio * (editorEl.scrollHeight - editorEl.clientHeight);
      requestAnimationFrame(() => { syncingRef.current = false; });
    };
    editorEl.addEventListener('scroll', onEditorScroll, { passive: true });
    previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });
    return () => {
      editorEl.removeEventListener('scroll', onEditorScroll);
      previewEl.removeEventListener('scroll', onPreviewScroll);
    };
  }, [syncScroll, editorScrollRef, scrollRef]);

  const resolvedTheme = theme === 'high-contrast' ? 'sepia' : theme;

  const filledScenes = scenes.filter((s) => sceneHasContent(s.content)).length;

  return (
    <aside className={`katha-proto-preview${mobileOpen ? ' katha-proto-preview--mobile-open' : ''}`}>
      <div className="katha-proto-preview-header">
        <div className="katha-proto-preview-header__titles">
          <span>Reader preview</span>
          {syncScroll && (
            <span className="katha-proto-preview-sync" title="Scroll is synced with the editor">
              Synced
            </span>
          )}
        </div>
        <div className="katha-proto-preview-header__actions">
          {mobileOpen && onCloseMobile && (
            <button
              type="button"
              className="katha-proto-preview-collapse"
              onClick={onCloseMobile}
              title="Close preview"
              aria-label="Close preview"
            >
              <PanelRightClose size={15} strokeWidth={EDITOR_ICON_STROKE} />
            </button>
          )}
          {!mobileOpen && onCollapse && (
            <button
              type="button"
              className="katha-proto-preview-collapse"
              onClick={onCollapse}
              title="Hide preview"
              aria-label="Hide preview panel"
            >
              <PanelRightClose size={15} strokeWidth={EDITOR_ICON_STROKE} />
            </button>
          )}
        </div>
      </div>

      <div className="katha-proto-preview-toolbar">
        <div className="katha-preview-segmented" role="group" aria-label="Preview device">
          {DEVICE_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`katha-preview-segmented__btn${device === id ? ' katha-preview-segmented__btn--active' : ''}`}
              onClick={() => onDeviceChange(id)}
              title={`${label} preview`}
              aria-pressed={device === id}
            >
              <Icon size={14} strokeWidth={EDITOR_ICON_STROKE} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div
          className="katha-preview-theme-segmented"
          role="group"
          aria-label="Preview theme"
        >
          {THEME_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`katha-preview-theme-segmented__btn${resolvedTheme === id ? ' katha-preview-theme-segmented__btn--active' : ''}`}
              onClick={() => onThemeChange(id)}
              title={`${label} theme`}
              aria-pressed={resolvedTheme === id}
              aria-label={`${label} theme`}
            >
              <Icon size={14} strokeWidth={EDITOR_ICON_STROKE} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`katha-proto-preview-body${syncScroll ? ' katha-proto-preview-body--synced' : ''}`}
      >
        {totalWords === 0 ? (
          <div className="katha-proto-preview-empty">
            <p className="katha-proto-preview-empty__title">Your reader view is empty</p>
            <p className="katha-proto-preview-empty__copy">
              As you write scenes, this panel shows the chapter exactly as readers will experience it.
            </p>
          </div>
        ) : (
          <div
            className="katha-proto-reader-card"
            data-device={device}
            data-preview-theme={resolvedTheme}
            style={{
              maxWidth: device === 'mobile' ? 280 : device === 'tablet' ? 360 : '100%',
              margin: '0 auto',
              ...previewComfortStyle,
            }}
          >
            <div className="katha-proto-chapter-label">Chapter {chapterNum}</div>
            <h1 className="katha-proto-chapter-title">{chapterTitle || 'Untitled Chapter'}</h1>
            <div className="katha-proto-chapter-dots" aria-hidden>
              <Ellipsis size={18} strokeWidth={EDITOR_ICON_STROKE} />
            </div>

            {scenes.map((scene, index) => (
              <React.Fragment key={scene.id}>
                {index > 0 && <hr className="katha-proto-preview-scene-break" aria-hidden />}
                <div
                  className={`katha-proto-preview-scene-block${activeSceneId === scene.id ? ' katha-proto-preview-scene-block--active' : ''}`}
                  data-scene-id={scene.id}
                >
                  {scene.title && scene.title !== 'New Scene' && scene.title !== `Scene ${index + 1}` && (
                    <h3 className="katha-proto-preview-scene-title">{scene.title}</h3>
                  )}
                  {sceneHasContent(scene.content) ? (
                    <div
                      className="katha-proto-preview-scene-body"
                      dangerouslySetInnerHTML={{ __html: scene.content }}
                    />
                  ) : (
                    <p className="katha-proto-preview-scene-empty">Start writing this scene…</p>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="katha-proto-preview-footer">
        <span>
          {totalWords.toLocaleString()} words
          {totalWords > 0 ? ` · ~${readMins} min` : ''}
        </span>
        <span>
          {filledScenes}/{scenes.length} scene{scenes.length === 1 ? '' : 's'} written
        </span>
      </div>
    </aside>
  );
}