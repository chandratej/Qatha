import { useMemo } from 'react';
import { useLocale } from '../../context/LocaleContext';
import type { BranchNode } from '../../lib/alternateEditorCache';
import {
  buildBranchEdges,
  computeBranchLayout,
  findNode,
  normalizeBranchNodes,
} from '../../lib/branchingGraph';

const NODE_W = 128;
const NODE_H = 52;

interface Props {
  nodes: BranchNode[];
  activeNodeId?: string | null;
  issues?: Array<{ nodeId?: string; severity: string }>;
  onSelectNode?: (nodeId: string) => void;
  compact?: boolean;
}

export function BranchGraphCanvas({
  nodes,
  activeNodeId,
  issues = [],
  onSelectNode,
  compact = false,
}: Props) {
  const { t } = useLocale();
  const normalized = useMemo(() => normalizeBranchNodes(nodes), [nodes]);
  const edges = useMemo(() => buildBranchEdges(normalized), [normalized]);
  const positions = useMemo(() => computeBranchLayout(normalized), [normalized]);
  const posMap = useMemo(
    () => new Map(positions.map((p) => [p.id, p])),
    [positions],
  );

  const issueNodes = useMemo(
    () => new Set(issues.filter((i) => i.nodeId).map((i) => i.nodeId!)),
    [issues],
  );

  const width = Math.max(320, ...positions.map((p) => p.x + NODE_W + 32));
  const height = Math.max(200, ...positions.map((p) => p.y + NODE_H + 32));

  if (normalized.length === 0) return null;

  return (
    <div
      className={`branch-graph-canvas${compact ? ' branch-graph-canvas--compact' : ''}`}
      aria-label={t('branchingEditor.canvasLabel')}
    >
      {!compact && (
        <p className="branch-graph-canvas__label katha-token-eyebrow">{t('branchingEditor.canvasLabel')}</p>
      )}
      <div className="branch-graph-canvas__viewport">
        <svg className="branch-graph-canvas__lines" width={width} height={height} aria-hidden>
          {edges.map((edge) => {
            const from = posMap.get(edge.fromId);
            const to = posMap.get(edge.toId);
            if (!from || !to) return null;
            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;
            return (
              <g key={`${edge.fromId}-${edge.choice}-${edge.toId}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={`branch-graph-canvas__line branch-graph-canvas__line--${edge.choice.toLowerCase()}`}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  className="branch-graph-canvas__edge-label"
                >
                  {edge.choice}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="branch-graph-canvas__nodes" style={{ width, height }}>
          {positions.map((pos) => {
            const node = findNode(normalized, pos.id);
            if (!node) return null;
            const hasIssue = issueNodes.has(pos.id);
            return (
              <button
                key={pos.id}
                type="button"
                className={[
                  'branch-graph-canvas__node',
                  activeNodeId === pos.id ? 'branch-graph-canvas__node--active' : '',
                  hasIssue ? 'branch-graph-canvas__node--issue' : '',
                ].filter(Boolean).join(' ')}
                style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
                onClick={() => onSelectNode?.(pos.id)}
              >
                <span className="branch-graph-canvas__node-title">
                  {node.title || t('branchingEditor.nodeTitle')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}