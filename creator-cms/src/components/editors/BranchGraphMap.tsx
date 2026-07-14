import { useMemo } from 'react';
import { useLocale } from '../../context/LocaleContext';
import type { BranchNode } from '../../lib/alternateEditorCache';
import { buildBranchEdges, normalizeBranchNodes } from '../../lib/branchingGraph';

interface Props {
  nodes: BranchNode[];
  activeNodeId?: string | null;
}

export function BranchGraphMap({ nodes, activeNodeId }: Props) {
  const { t } = useLocale();
  const normalized = useMemo(() => normalizeBranchNodes(nodes), [nodes]);
  const edges = useMemo(() => buildBranchEdges(normalized), [normalized]);
  const visible = normalized.filter((n) => n.body.trim() || n.choiceA.trim() || n.choiceB.trim());

  if (visible.length === 0) return null;

  return (
    <div className="branch-graph-map" aria-label={t('branchingEditor.graphMapLabel')}>
      <p className="branch-graph-map__label katha-token-eyebrow">{t('branchingEditor.graphMapLabel')}</p>
      <div className="branch-graph-map__nodes">
        {visible.map((node, index) => {
          const outEdges = edges.filter((e) => e.fromId === node.id);
          return (
            <div
              key={node.id}
              className={`branch-graph-map__node${activeNodeId === node.id ? ' branch-graph-map__node--active' : ''}`}
            >
              <span className="branch-graph-map__node-index" aria-hidden>{index + 1}</span>
              <span className="branch-graph-map__node-title">{node.title || t('branchingEditor.nodeTitle')}</span>
              {outEdges.length > 0 && (
                <ul className="branch-graph-map__edges">
                  {outEdges.map((edge) => {
                    const target = visible.find((n) => n.id === edge.toId);
                    const targetLabel = target?.title || edge.toId.slice(0, 8);
                    return (
                      <li key={`${edge.fromId}-${edge.choice}`} className={`branch-graph-map__edge branch-graph-map__edge--${edge.choice.toLowerCase()}`}>
                        <span className="branch-graph-map__edge-choice">{edge.choice}</span>
                        <span className="branch-graph-map__edge-arrow" aria-hidden>→</span>
                        <span className="branch-graph-map__edge-target">{targetLabel}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}