import { Feather } from 'lucide-react';
import {
  getScenePacing,
  scenePacingLabel,
  type ScenePacing,
} from '../../lib/scenePacing';

interface ScenePacingHintProps {
  wordCount: number;
  sceneIndex: number;
  sceneCount: number;
}

export function ScenePacingHint({ wordCount, sceneIndex, sceneCount }: ScenePacingHintProps) {
  const pacing = getScenePacing(wordCount);

  return (
    <span
      className={`katha-scene-pacing katha-scene-pacing--${pacing}`}
      title={`Scene ${sceneIndex + 1} of ${sceneCount} — ${wordCount} words`}
    >
      <Feather size={12} aria-hidden />
      <span className="katha-scene-pacing__label">
        Scene {sceneIndex + 1}/{sceneCount} · {scenePacingLabel(pacing)}
      </span>
    </span>
  );
}

export type { ScenePacing };