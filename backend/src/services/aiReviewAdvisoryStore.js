/**
 * Advisory AI suggestions store — LRC-07-D3
 * Auditable accept/ignore events; suggestions never auto-apply to manuscript.
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getAssignmentById, getPeerReviewRequestById } from './peerReviewStore.js';
import { loadBlindManuscriptForAssignment } from './reviewManuscriptStore.js';
import { generateAdvisorySuggestions } from './aiAdvisoryProvider.js';
import { registerAdvisorySuggestionForGovernance } from './aiGovernanceStore.js';

/** @type {object[]} */
const suggestionsDb = [];

function manuscriptExcerpt(manuscript) {
  const ch = manuscript?.chapters?.[0];
  if (!ch) return '';
  const paras = (ch.paragraphs || []).slice(0, 6);
  return paras.map((p) => p.plainText || '').join('\n\n');
}

export async function listAdvisorySuggestions(assignmentId) {
  if (isMockMode()) {
    return suggestionsDb
      .filter((s) => s.assignment_id === assignmentId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const { data, error } = await supabase
    .from('ai_review_suggestions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function ensureAdvisorySuggestions(assignmentId, reviewerSlot) {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  if (assignment.reviewer_slot !== reviewerSlot) {
    throw new Error('Assignment does not belong to this reviewer slot');
  }

  const existing = await listAdvisorySuggestions(assignmentId);
  const pending = existing.filter((s) => s.status === 'pending');
  if (pending.length > 0) return { suggestions: existing, generated: false };

  const request = await getPeerReviewRequestById(assignment.request_id);
  if (!request) throw new Error('Review request not found');

  let excerpt = '';
  try {
    const manuscript = await loadBlindManuscriptForAssignment(assignment, request);
    excerpt = manuscriptExcerpt(manuscript);
  } catch {
    excerpt = request.story_title || '';
  }

  const generated = await generateAdvisorySuggestions({
    genre: assignment.story_genre || request.story_genre,
    excerpt,
  });

  const rows = [];
  for (const g of generated) {
    const row = {
      id: randomUUID(),
      assignment_id: assignmentId,
      request_id: assignment.request_id,
      reviewer_slot: reviewerSlot,
      category: g.category,
      body: g.body,
      evidence: g.evidence || '',
      confidence: g.confidence,
      status: 'pending',
      provider: g.provider,
      metadata: {},
      created_at: new Date().toISOString(),
      resolved_at: null,
    };

    if (isMockMode()) {
      suggestionsDb.unshift(row);
      registerAdvisorySuggestionForGovernance(row);
      rows.push(row);
    } else {
      const { data, error } = await supabase
        .from('ai_review_suggestions')
        .insert({
          assignment_id: row.assignment_id,
          request_id: row.request_id,
          reviewer_slot: row.reviewer_slot,
          category: row.category,
          body: row.body,
          evidence: row.evidence,
          confidence: row.confidence,
          status: row.status,
          provider: row.provider,
          metadata: row.metadata,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      rows.push(data);
    }
  }

  const all = await listAdvisorySuggestions(assignmentId);
  return { suggestions: all, generated: rows.length > 0 };
}

export async function respondToAdvisorySuggestion(suggestionId, action) {
  if (!['accepted', 'ignored'].includes(action)) {
    throw new Error('action must be accepted or ignored');
  }

  if (isMockMode()) {
    const idx = suggestionsDb.findIndex((s) => s.id === suggestionId);
    if (idx < 0) throw new Error('Suggestion not found');
    suggestionsDb[idx] = {
      ...suggestionsDb[idx],
      status: action,
      resolved_at: new Date().toISOString(),
    };
    return suggestionsDb[idx];
  }

  const { data, error } = await supabase
    .from('ai_review_suggestions')
    .update({ status: action, resolved_at: new Date().toISOString() })
    .eq('id', suggestionId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}