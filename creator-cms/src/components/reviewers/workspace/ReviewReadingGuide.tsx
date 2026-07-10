interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function ReviewReadingGuide({ visible, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <div className="rw-reading-guide" role="status">
      <p className="rw-reading-guide__title">You are reviewing literature</p>
      <p className="rw-reading-guide__body">
        Read at your own pace. Select any passage to leave a thoughtful observation.
        Open panels only when you need them — the manuscript stays center stage.
      </p>
      <button type="button" className="rw-reading-guide__dismiss" onClick={onDismiss}>
        Begin reading
      </button>
    </div>
  );
}