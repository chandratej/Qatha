import type { BranchNode } from './alternateEditorCache';

export type BranchChoice = 'A' | 'B';

function cleanTarget(raw: string | null | undefined): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw == null || raw === '') return null;
  return raw;
}

/** Ensure every node has explicit graph targets (migrates legacy linear drafts). */
export function normalizeBranchNodes(nodes: BranchNode[]): BranchNode[] {
  return nodes.map((node, index) => {
    const a = cleanTarget(node.choiceATarget);
    const b = cleanTarget(node.choiceBTarget);
    return {
      ...node,
      // undefined = never set → default linear next; null = explicit ending
      choiceATarget: a === undefined ? (nodes[index + 1]?.id ?? null) : a,
      choiceBTarget: b === undefined
        ? (nodes[index + 2]?.id ?? nodes[index + 1]?.id ?? null)
        : b,
    };
  });
}

export function getStartNodeId(nodes: BranchNode[]): string | null {
  if (nodes.length === 0) return null;
  return nodes[0].id;
}

export function findNode(nodes: BranchNode[], id: string): BranchNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function resolveChoiceTarget(
  nodes: BranchNode[],
  nodeId: string,
  choice: BranchChoice,
): string | null {
  const normalized = normalizeBranchNodes(nodes);
  const node = findNode(normalized, nodeId);
  if (!node) return null;
  const raw = choice === 'A' ? node.choiceATarget : node.choiceBTarget;
  if (!raw) return null;
  return findNode(normalized, raw) ? raw : null;
}

export function nodeHasChoices(node: BranchNode): boolean {
  const a = node.choiceA.trim();
  const b = node.choiceB.trim();
  return Boolean(a || b);
}

export function isTerminalNode(nodes: BranchNode[], nodeId: string): boolean {
  const node = findNode(normalizeBranchNodes(nodes), nodeId);
  if (!node) return true;
  const normalized = normalizeBranchNodes(nodes);
  const aTarget = node.choiceATarget && findNode(normalized, node.choiceATarget);
  const bTarget = node.choiceBTarget && findNode(normalized, node.choiceBTarget);
  if (!nodeHasChoices(node)) return true;
  return !aTarget && !bTarget;
}

export interface BranchGraphEdge {
  fromId: string;
  toId: string;
  choice: BranchChoice;
  label: string;
}

export function buildBranchEdges(nodes: BranchNode[]): BranchGraphEdge[] {
  const normalized = normalizeBranchNodes(nodes);
  const edges: BranchGraphEdge[] = [];
  for (const node of normalized) {
    if (node.choiceATarget && findNode(normalized, node.choiceATarget)) {
      edges.push({
        fromId: node.id,
        toId: node.choiceATarget,
        choice: 'A',
        label: node.choiceA.trim() || 'A',
      });
    }
    if (node.choiceBTarget && findNode(normalized, node.choiceBTarget)) {
      edges.push({
        fromId: node.id,
        toId: node.choiceBTarget,
        choice: 'B',
        label: node.choiceB.trim() || 'B',
      });
    }
  }
  return edges;
}

export type BranchGraphIssueType =
  | 'cycle'
  | 'orphan'
  | 'unreachable'
  | 'dead_end'
  | 'invalid_target';

export interface BranchGraphIssue {
  type: BranchGraphIssueType;
  nodeId?: string;
  severity: 'error' | 'warning';
}

function reachableFromStart(nodes: BranchNode[], startId: string | null): Set<string> {
  const reached = new Set<string>();
  if (!startId) return reached;
  const normalized = normalizeBranchNodes(nodes);
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (reached.has(id)) continue;
    reached.add(id);
    const node = findNode(normalized, id);
    if (!node) continue;
    if (node.choiceATarget && findNode(normalized, node.choiceATarget)) {
      queue.push(node.choiceATarget);
    }
    if (node.choiceBTarget && findNode(normalized, node.choiceBTarget)) {
      queue.push(node.choiceBTarget);
    }
  }
  return reached;
}

function findCycleNodeIds(nodes: BranchNode[]): string[] {
  const normalized = normalizeBranchNodes(nodes);
  const edges = buildBranchEdges(normalized);
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.fromId) ?? [];
    list.push(e.toId);
    adj.set(e.fromId, list);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleNodes: string[] = [];

  const dfs = (id: string): boolean => {
    if (visiting.has(id)) {
      cycleNodes.push(id);
      return true;
    }
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of adj.get(id) ?? []) {
      if (dfs(next)) {
        cycleNodes.push(id);
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  for (const node of normalized) {
    if (!visited.has(node.id)) dfs(node.id);
  }
  return [...new Set(cycleNodes)];
}

/** Validate branch graph structure for authoring QA. */
export function validateBranchGraph(nodes: BranchNode[]): BranchGraphIssue[] {
  const normalized = normalizeBranchNodes(nodes);
  const issues: BranchGraphIssue[] = [];
  if (normalized.length === 0) return issues;

  const startId = getStartNodeId(normalized);
  const targeted = new Set<string>();
  for (const n of normalized) {
    if (n.choiceATarget) targeted.add(n.choiceATarget);
    if (n.choiceBTarget) targeted.add(n.choiceBTarget);
  }

  for (const n of normalized) {
    if (n.id !== startId && !targeted.has(n.id)) {
      issues.push({ type: 'orphan', nodeId: n.id, severity: 'warning' });
    }
    if (n.choiceATarget && !findNode(normalized, n.choiceATarget)) {
      issues.push({ type: 'invalid_target', nodeId: n.id, severity: 'error' });
    }
    if (n.choiceBTarget && !findNode(normalized, n.choiceBTarget)) {
      issues.push({ type: 'invalid_target', nodeId: n.id, severity: 'error' });
    }
    const hasChoiceText = n.choiceA.trim() || n.choiceB.trim();
    const hasTarget = (n.choiceATarget && findNode(normalized, n.choiceATarget))
      || (n.choiceBTarget && findNode(normalized, n.choiceBTarget));
    if (hasChoiceText && !hasTarget && !n.body.trim()) {
      issues.push({ type: 'dead_end', nodeId: n.id, severity: 'warning' });
    }
  }

  const reached = reachableFromStart(normalized, startId);
  for (const n of normalized) {
    if (startId && n.id !== startId && !reached.has(n.id)) {
      issues.push({ type: 'unreachable', nodeId: n.id, severity: 'warning' });
    }
  }

  for (const id of findCycleNodeIds(normalized)) {
    issues.push({ type: 'cycle', nodeId: id, severity: 'error' });
  }

  return issues;
}

export interface BranchNodePosition {
  id: string;
  x: number;
  y: number;
  level: number;
}

/** Layout nodes in columns by BFS depth for canvas rendering. */
export function computeBranchLayout(nodes: BranchNode[]): BranchNodePosition[] {
  const normalized = normalizeBranchNodes(nodes);
  const startId = getStartNodeId(normalized);
  if (!startId) return [];

  const levels = new Map<string, number>();
  const queue: Array<{ id: string; level: number }> = [{ id: startId, level: 0 }];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    levels.set(id, level);
    const node = findNode(normalized, id);
    if (!node) continue;
    if (node.choiceATarget && findNode(normalized, node.choiceATarget)) {
      queue.push({ id: node.choiceATarget, level: level + 1 });
    }
    if (node.choiceBTarget && findNode(normalized, node.choiceBTarget)) {
      queue.push({ id: node.choiceBTarget, level: level + 1 });
    }
  }

  for (const n of normalized) {
    if (!levels.has(n.id)) levels.set(n.id, 0);
  }

  const byLevel = new Map<number, string[]>();
  for (const [id, level] of levels) {
    const list = byLevel.get(level) ?? [];
    list.push(id);
    byLevel.set(level, list);
  }

  const positions: BranchNodePosition[] = [];
  const colW = 168;
  const rowH = 88;

  for (const [level, ids] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
    ids.forEach((id, row) => {
      positions.push({
        id,
        x: 24 + level * colW,
        y: 24 + row * rowH,
        level,
      });
    });
  }

  return positions;
}