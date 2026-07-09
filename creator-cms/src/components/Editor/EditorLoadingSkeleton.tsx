export function EditorLoadingSkeleton() {
  return (
    <div className="katha-proto-layout katha-editor-loading" aria-busy="true" aria-label="Loading chapter">
      <div className="katha-editor-chrome katha-editor-loading__chrome">
        <div className="katha-editor-loading__bar katha-editor-loading__bar--wide" />
        <div className="katha-editor-loading__bar katha-editor-loading__bar--narrow" />
      </div>
      <div className="katha-proto-workspace katha-editor-loading__workspace">
        <aside className="katha-editor-loading__sidebar" aria-hidden>
          <div className="katha-editor-loading__bar" />
          <div className="katha-editor-loading__card" />
          <div className="katha-editor-loading__card" />
          <div className="katha-editor-loading__card" />
        </aside>
        <main className="katha-editor-loading__editor" aria-hidden>
          <div className="katha-editor-loading__canvas">
            <div className="katha-editor-loading__bar katha-editor-loading__bar--title" />
            <div className="katha-editor-loading__line" />
            <div className="katha-editor-loading__line" />
            <div className="katha-editor-loading__line katha-editor-loading__line--short" />
            <div className="katha-editor-loading__line" />
            <div className="katha-editor-loading__line katha-editor-loading__line--medium" />
          </div>
        </main>
        <aside className="katha-editor-loading__preview" aria-hidden>
          <div className="katha-editor-loading__bar katha-editor-loading__bar--narrow" />
          <div className="katha-editor-loading__preview-card" />
        </aside>
      </div>
      <p className="katha-editor-loading__label">Opening your manuscript…</p>
    </div>
  );
}
