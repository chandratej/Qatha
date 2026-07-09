export function ReadingSkeleton() {
  return (
    <div className="reading-skeleton" aria-hidden>
      <div className="reading-skeleton__line reading-skeleton__line--lg" />
      <div className="reading-skeleton__line" />
      <div className="reading-skeleton__line" />
      <div className="reading-skeleton__line reading-skeleton__line--md" />
      <div className="reading-skeleton__line" />
      <div className="reading-skeleton__line reading-skeleton__line--short" />
    </div>
  );
}