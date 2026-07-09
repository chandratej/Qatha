import React, { useEffect, useRef } from 'react';
import { BookOpen, Tablet, Smartphone, Sun, Moon, Coffee, PanelRightClose } from 'lucide-react';
import type { SceneBlock } from './SceneSidebar';
import type { PreviewDevice, PreviewTheme } from '../../lib/editorPrefs';
import { sceneHasContent } from '../../lib/sceneContent';

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
  previewComfortStyle?: React.CSSProperties;
  onCollapse?: () => void;
}

const DEVICE_OPTIONS: { id: PreviewDevice; label: string; icon: typeof BookOpen }[] = [
  { id: 'desktop', label: 'Book', icon: BookOpen },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
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
  previewComfortStyle,
  onCollapse,
}: PreviewPaneProps) {
  const syncingRef = useRef(false);
  const readMins = Math.max(1, Math.round(totalWords / 200));

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
    editorEl.addEventListener('scroll', onEditorScroll, { passive: true });
    return () => editorEl.removeEventListener('scroll', onEditorScroll);
  }, [syncScroll, editorScrollRef, scrollRef]);

  const resolvedTheme = theme === 'high-contrast' ? 'sepia' : theme;

  return (
    <aside className="katha-proto-preview">
      <div className="katha-proto-preview-header">
        <span>Preview</span>
        {onCollapse && (
          <button
            type="button"
            className="katha-proto-preview-collapse"
            onClick={onCollapse}
            title="Hide preview"
            aria-label="Hide preview panel"
          >
            <PanelRightClose size={16} />
          </button>
        )}
      </div>

      <div className="katha-proto-preview-toolbar">
        <div className="katha-proto-device-switcher" role="group" aria-label="Preview device">
          {DEVICE_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`katha-proto-device-btn${device === id ? ' active' : ''}`}
              onClick={() => onDeviceChange(id)}
              title={`${label} preview`}
              aria-pressed={device === id}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="katha-proto-preview-theme-group" role="group" aria-label="Preview theme">
          <button
            type="button"
            className={`katha-proto-preview-icon-btn${resolvedTheme === 'sepia' ? ' active' : ''}`}
            onClick={() => onThemeChange('sepia')}
            title="Sepia (recommended)"
            aria-pressed={resolvedTheme === 'sepia'}
          >
            <Coffee size={16} />
          </button>
          <button
            type="button"
            className={`katha-proto-preview-icon-btn${resolvedTheme === 'light' ? ' active' : ''}`}
            onClick={() => onThemeChange('light')}
            title="Light"
            aria-pressed={resolvedTheme === 'light'}
          >
            <Sun size={16} />
          </button>
          <button
            type="button"
            className={`katha-proto-preview-icon-btn${resolvedTheme === 'dark' ? ' active' : ''}`}
            onClick={() => onThemeChange('dark')}
            title="Dark"
            aria-pressed={resolvedTheme === 'dark'}
          >
            <Moon size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="katha-proto-preview-body">
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
          <div className="katha-proto-chapter-dots" aria-hidden>• • •</div>

          {scenes.map((scene, index) => (
            <React.Fragment key={scene.id}>
              {index > 0 && <hr className="katha-proto-preview-scene-break" aria-hidden />}
              <div className="katha-proto-preview-scene-block">
                {scene.title && scene.title !== 'New Scene' && (
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
      </div>

      <div className="katha-proto-preview-footer">
        <span>{totalWords.toLocaleString()} words · ~{readMins} min</span>
        <span>{scenes.length} scene{scenes.length === 1 ? '' : 's'}</span>
      </div>
    </aside>
  );
}