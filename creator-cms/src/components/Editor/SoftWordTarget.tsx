interface SoftWordTargetProps {
  wordCount: number;
  min: number;
  max: number;
  hardMax?: number | null;
  locale?: string;
  belowMin?: boolean;
  overHardMax?: boolean;
}

/**
 * Soft chapter-length guidance only (recommended 1,000–1,500 for serials).
 * Never blocks publish — any length is allowed.
 */
export function SoftWordTarget({
  wordCount,
  min,
  max,
  hardMax = null,
  locale = 'en',
  belowMin = false,
  overHardMax = false,
}: SoftWordTargetProps) {
  void hardMax;
  void overHardMax;
  const te = locale === 'te';
  const inBand = wordCount >= min && wordCount <= max;
  const overSoft = wordCount > max;
  const underSoft = belowMin || (wordCount > 0 && wordCount < min);

  const label = te
    ? `సిఫార్సు: ${min.toLocaleString('te')}–${max.toLocaleString('te')} పదాలు`
    : `Recommended: ${min.toLocaleString()}–${max.toLocaleString()} words`;

  let status: string;
  if (wordCount === 0) {
    status = te ? 'రాయడం ప్రారంభించండి' : 'Start writing';
  } else if (underSoft) {
    status = te
      ? `సిఫార్సు కంటే తక్కువ (ప్రస్తుతం ${wordCount}) — ప్రచురించవచ్చు`
      : `Below recommended (now ${wordCount}) — still publishable`;
  } else if (inBand) {
    status = te ? 'సిఫార్సు పరిధిలో' : 'In recommended range';
  } else if (overSoft) {
    status = te
      ? `సిఫార్సు కంటే ఎక్కువ — ప్రచురించవచ్చు`
      : 'Above recommended — still publishable';
  } else {
    status = te ? 'మార్గదర్శకం' : 'Guidance';
  }

  const stateClass = inBand
    ? ' katha-soft-word-target--in-band'
    : underSoft
      ? ' katha-soft-word-target--below'
      : '';

  return (
    <span
      className={`katha-soft-word-target${stateClass}`}
      title={
        te
          ? `సిఫార్సు ${min}–${max} పదాలు · ఏ పొడవు అయినా ప్రచురించవచ్చు`
          : `Recommended ${min}–${max} words · publish any length`
      }
      role="status"
    >
      <span className="katha-soft-word-target__text">
        <strong>{wordCount.toLocaleString()}</strong>
        {' · '}
        {label}
        <span className="katha-soft-word-target__hint"> · {status}</span>
      </span>
    </span>
  );
}
