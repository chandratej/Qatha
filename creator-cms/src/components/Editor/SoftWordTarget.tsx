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
 * Serialized Story word band: 800–1,200 words.
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
  const te = locale === 'te';
  const inBand = wordCount >= min && wordCount <= max;
  const overSoft = wordCount > max && (hardMax == null || wordCount <= hardMax);

  const label = te
    ? `సిఫార్సు: ${min.toLocaleString('te')}–${max.toLocaleString('te')} పదాలు`
    : `Recommended: ${min.toLocaleString()}–${max.toLocaleString()} words`;

  let status: string;
  if (wordCount === 0) {
    status = te ? 'రాయడం ప్రారంభించండి' : 'Start writing';
  } else if (overHardMax || (hardMax != null && wordCount > hardMax)) {
    status = te
      ? `గరిష్ఠ ${hardMax!.toLocaleString('te')} పదాలు (ప్రస్తుతం ${wordCount})`
      : `Hard max ${hardMax!.toLocaleString()} words (now ${wordCount})`;
  } else if (belowMin || wordCount < min) {
    status = te
      ? `కనీసం ${min.toLocaleString('te')} పదాలు అవసరం (ప్రస్తుతం ${wordCount})`
      : `At least ${min.toLocaleString()} words to publish (now ${wordCount})`;
  } else if (inBand) {
    status = te ? 'సిఫార్సు పరిధిలో' : 'In recommended range';
  } else if (overSoft) {
    status = te
      ? `సిఫార్సు కంటే ఎక్కువ — ${hardMax ? `గరిష్ఠ ${hardMax.toLocaleString('te')}` : 'సరే'}`
      : `Above soft max — hard max ${hardMax?.toLocaleString() ?? '—'} words`;
  } else {
    status = te ? 'మార్గదర్శకం' : 'Guidance';
  }

  const stateClass =
    overHardMax || (hardMax != null && wordCount > hardMax)
      ? ' katha-soft-word-target--over-hard'
      : belowMin || wordCount < min
        ? ' katha-soft-word-target--below'
        : inBand
          ? ' katha-soft-word-target--in-band'
          : '';

  return (
    <span
      className={`katha-soft-word-target${stateClass}`}
      title={
        te
          ? `సాఫ్ట్ ${min}–${max} · హార్డ్ గరిష్ఠ ${hardMax ?? '—'} పదాలు (characters కాదు)`
          : `Soft ${min}–${max} · hard max ${hardMax ?? '—'} words (not characters)`
      }
      role="status"
    >
      <span className="katha-soft-word-target__text">
        <strong>{wordCount.toLocaleString()}</strong>
        {' · '}
        {label}
        {hardMax != null && (
          <span className="katha-soft-word-target__hard">
            {te ? ` · గరిష్ఠ ${hardMax.toLocaleString('te')}` : ` · hard max ${hardMax.toLocaleString()}`}
          </span>
        )}
        <span className="katha-soft-word-target__hint"> · {status}</span>
      </span>
    </span>
  );
}
