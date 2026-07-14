import { useMemo } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import type { BranchNode } from '../../lib/alternateEditorCache';
import { validateBranchGraph, type BranchGraphIssue } from '../../lib/branchingGraph';

const ISSUE_KEYS: Record<BranchGraphIssue['type'], 'branchingEditor.issueCycle' | 'branchingEditor.issueOrphan' | 'branchingEditor.issueUnreachable' | 'branchingEditor.issueDeadEnd' | 'branchingEditor.issueInvalidTarget'> = {
  cycle: 'branchingEditor.issueCycle',
  orphan: 'branchingEditor.issueOrphan',
  unreachable: 'branchingEditor.issueUnreachable',
  dead_end: 'branchingEditor.issueDeadEnd',
  invalid_target: 'branchingEditor.issueInvalidTarget',
};

interface Props {
  nodes: BranchNode[];
}

export function BranchGraphValidation({ nodes }: Props) {
  const { t } = useLocale();
  const issues = useMemo(() => validateBranchGraph(nodes), [nodes]);

  if (issues.length === 0) {
    return (
      <p className="branch-graph-validation branch-graph-validation--ok input-hint" role="status">
        {t('branchingEditor.graphValid')}
      </p>
    );
  }

  return (
    <ul className="branch-graph-validation" role="list" aria-label={t('branchingEditor.graphIssuesLabel')}>
      {issues.map((issue, i) => {
        const Icon = issue.severity === 'error' ? AlertCircle : AlertTriangle;
        const node = issue.nodeId ? nodes.find((n) => n.id === issue.nodeId) : null;
        const nodeLabel = node?.title || issue.nodeId;
        return (
          <li
            key={`${issue.type}-${issue.nodeId ?? i}`}
            className={`branch-graph-validation__item branch-graph-validation__item--${issue.severity}`}
          >
            <Icon size={14} aria-hidden />
            <span>{t(ISSUE_KEYS[issue.type])}{nodeLabel ? `: ${nodeLabel}` : ''}</span>
          </li>
        );
      })}
    </ul>
  );
}