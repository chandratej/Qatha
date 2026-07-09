import React, { useEffect, useRef } from 'react';
import { MessageSquare, BookOpen, Tablet, Smartphone, Sun, Moon, Coffee, MoreHorizontal } from 'lucide-react';
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
}

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
      <div className="katha-proto-preview-header">Preview</div>

      <div className="katha-proto-preview-toolbar">
        <button type="button" className="katha-proto-preview-icon-btn" title="Comments">
          <MessageSquare size={16} />
        </button>
        <button
          type="button"
          className={`katha-proto-preview-icon-btn${device === 'desktop' ? ' active' : ''}`}
          onClick={() => onDeviceChange('desktop')}
          title="Desktop"
        >
          <BookOpen size={16} />
        </button>
        <button
          type="button"
          className={`katha-proto-preview-icon-btn${device === 'tablet' ? ' active' : ''}`}
          onClick={() => onDeviceChange('tablet')}
          title="Tablet"
        >
          <Tablet size={16} />
        </button>
        <button
          type="button"
          className={`katha-proto-preview-icon-btn${device === 'mobile' ? ' active' : ''}`}
          onClick={() => onDeviceChange('mobile')}
          title="Mobile"
        >
          <Smartphone size={16} />
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className={`katha-proto-preview-icon-btn${resolvedTheme === 'sepia' ? ' active' : ''}`}
          onClick={() => onThemeChange('sepia')}
          title="Sepia (recommended)"
        >
          <Coffee size={16} />
        </button>
        <button
          type="button"
          className={`katha-proto-preview-icon-btn${resolvedTheme === 'light' ? ' active' : ''}`}
          onClick={() => onThemeChange('light')}
          title="Light"
        >
          <Sun size={16} />
        </button>
        <button
          type="button"
          className={`katha-proto-preview-icon-btn${resolvedTheme === 'dark' ? ' active' : ''}`}
          onClick={() => onThemeChange('dark')}
          title="Dark"
        >
          <Moon size={16} />
        </button>
        <button type="button" className="katha-proto-preview-icon-btn" title="More">
          <MoreHorizontal size={16} />
        </button>
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
          <div className="katha-proto-chapter-dots">• • •</div>

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
        <span>{totalWords} words • ~{readMins} min read</span>
        <span>{scenes.length} scene{scenes.length === 1 ? '' : 's'}</span>
      </div>
    </aside>
  );
}