/**
 * Events persistence — ARC-01 Wave 1 (migration 014)
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const DEFAULT_SPLIT = { platformPct: 15, organizerPct: 10, taxPct: 18 };

/** @type {Map<string, object>} */
const eventsDb = new Map();
/** @type {Map<string, object>} */
const registrationsDb = new Map();

export const EVENT_TYPES = [
  'writing_contest', 'first_chapter_challenge', 'short_story_challenge', 'novel_challenge',
  'flash_fiction_challenge', 'festival_challenge', 'genre_challenge', 'district_challenge',
  'prompt_challenge', 'writing_sprint', 'collaboration_challenge', 'beta_reader_event',
  'editing_challenge', 'translation_challenge', 'publishing_pitch_event',
];

function escrowSplit(fee) {
  const platformInr = Math.round(fee * (DEFAULT_SPLIT.platformPct / 100) * 100) / 100;
  const organizerInr = Math.round(fee * (DEFAULT_SPLIT.organizerPct / 100) * 100) / 100;
  const taxInr = Math.round(fee * (DEFAULT_SPLIT.taxPct / 100) * 100) / 100;
  const prizePoolInr = Math.round((fee - platformInr - organizerInr - taxInr) * 100) / 100;
  return { platformInr, organizerInr, taxInr, prizePoolInr };
}

export function acceptsRegistration(event) {
  if (!['registration_open', 'submissions_open', 'published'].includes(event.status)) return false;
  if (event.registration_closes_at && Date.parse(event.registration_closes_at) < Date.now()) return false;
  return true;
}

function rowToEvent(row, counts = {}) {
  return {
    id: row.id,
    organizer_id: row.organizer_id,
    title: row.title,
    description: row.description,
    event_type: row.event_type,
    status: row.status,
    judging_model: row.judging_model,
    entry_fee_inr: row.entry_fee_inr ?? row.custom_entry_fee_inr ?? 0,
    prize_pool_inr: Number(row.prize_pool_inr) || 0,
    platform_commission_pct: Number(row.platform_commission_pct) || 15,
    organizer_commission_pct: Number(row.organizer_commission_pct) || 10,
    registration_count: counts.registration_count ?? 0,
    submission_count: counts.submission_count ?? 0,
    registration_opens_at: row.registration_opens_at,
    registration_closes_at: row.registration_closes_at,
    submissions_close_at: row.submissions_close_at,
  };
}

function seedIfEmpty() {
  if (eventsDb.size) return;
  const now = Date.now();
  const seed = [
    {
      id: 'evt-first-chapter',
      organizer_id: 'platform',
      title: 'First Chapter Challenge — Telugu New Voices',
      description: 'Submit your opening chapter. Free entry · acquisition funnel.',
      event_type: 'first_chapter_challenge',
      status: 'registration_open',
      judging_model: 'double_blind',
      entry_fee_inr: 0,
      prize_pool_inr: 25000,
      platform_commission_pct: 15,
      organizer_commission_pct: 0,
      registration_count: 0,
      submission_count: 0,
      registration_opens_at: new Date(now - 86400000).toISOString(),
      registration_closes_at: new Date(now + 30 * 86400000).toISOString(),
    },
  ];
  for (const e of seed) eventsDb.set(e.id, e);
}

export async function listEvents() {
  if (isMockMode()) {
    seedIfEmpty();
    return [...eventsDb.values()];
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const events = data || [];
  if (!events.length) return [];

  const ids = events.map((e) => e.id);
  const [{ data: regs }, { data: subs }] = await Promise.all([
    supabase.from('event_registrations').select('event_id').in('event_id', ids),
    supabase.from('event_submissions').select('event_id').in('event_id', ids),
  ]);

  const regCounts = {};
  const subCounts = {};
  for (const r of regs || []) regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
  for (const s of subs || []) subCounts[s.event_id] = (subCounts[s.event_id] || 0) + 1;

  return events.map((row) => rowToEvent(row, {
    registration_count: regCounts[row.id] || 0,
    submission_count: subCounts[row.id] || 0,
  }));
}

export async function getEventById(eventId) {
  if (isMockMode()) {
    seedIfEmpty();
    return eventsDb.get(eventId) || null;
  }

  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const [{ count: regCount }, { count: subCount }] = await Promise.all([
    supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('event_submissions').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
  ]);

  return rowToEvent(data, {
    registration_count: regCount || 0,
    submission_count: subCount || 0,
  });
}

export async function createEvent(userId, body) {
  const {
    title,
    event_type,
    entry_fee_inr = 0,
    description = '',
    prize_pool_inr = 0,
    judging_model = 'weighted_rubric',
    open_registration = true,
  } = body || {};

  if (!title || !event_type) throw new Error('title and event_type required');
  if (!EVENT_TYPES.includes(event_type)) throw new Error('invalid event_type');

  const now = new Date();
  const closes = new Date(now.getTime() + 30 * 86400000);

  if (isMockMode()) {
    seedIfEmpty();
    const id = `evt-${Date.now()}`;
    const event = {
      id,
      organizer_id: userId,
      title,
      description,
      event_type,
      status: open_registration ? 'registration_open' : 'draft',
      judging_model,
      entry_fee_inr: Number(entry_fee_inr) || 0,
      prize_pool_inr: Number(prize_pool_inr) || 0,
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
      registration_count: 0,
      submission_count: 0,
      registration_opens_at: now.toISOString(),
      registration_closes_at: closes.toISOString(),
    };
    eventsDb.set(id, event);
    return event;
  }

  const { data, error } = await supabase.from('events').insert({
    organizer_id: userId,
    title,
    description,
    event_type,
    status: open_registration ? 'registration_open' : 'draft',
    judging_model,
    entry_fee_inr: Number(entry_fee_inr) || 0,
    prize_pool_inr: Number(prize_pool_inr) || 0,
    registration_opens_at: now.toISOString(),
    registration_closes_at: closes.toISOString(),
  }).select('*').single();
  if (error) throw new Error(error.message);
  return rowToEvent(data);
}

export async function registerForEvent(userId, eventId) {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');
  if (!acceptsRegistration(event)) throw new Error('Registration is closed for this event');

  const regKey = `${eventId}:${userId}`;

  if (isMockMode()) {
    if (registrationsDb.has(regKey)) {
      return { registration: registrationsDb.get(regKey), event, alreadyRegistered: true };
    }
    const fee = event.entry_fee_inr || 0;
    const split = fee > 0 ? escrowSplit(fee) : { platformInr: 0, organizerInr: 0, taxInr: 0, prizePoolInr: 0 };
    const registration = {
      id: `ereg-${Date.now()}`,
      event_id: eventId,
      participant_id: userId,
      entry_fee_paid_inr: fee,
      payment_status: fee <= 0 ? 'waived' : 'paid',
      registered_at: new Date().toISOString(),
      platform_fee_inr: split.platformInr,
      prize_pool_contribution_inr: split.prizePoolInr,
    };
    registrationsDb.set(regKey, registration);
    event.registration_count = (event.registration_count || 0) + 1;
    if (fee > 0) {
      event.prize_pool_inr = Math.round((event.prize_pool_inr || 0) + split.prizePoolInr);
      revenueLedgerMock.unshift({
        id: `rev-${Date.now()}`,
        event_id: eventId,
        registration_id: registration.id,
        entry_fee_inr: fee,
        platform_fee_inr: split.platformInr,
        organizer_fee_inr: split.organizerInr,
        tax_inr: split.taxInr,
        prize_pool_inr: split.prizePoolInr,
        created_at: new Date().toISOString(),
      });
    }
    eventsDb.set(eventId, event);
    return { registration, event, escrow: split, alreadyRegistered: false };
  }

  const { data: existing } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('participant_id', userId)
    .maybeSingle();
  if (existing) {
    return { registration: existing, event, alreadyRegistered: true };
  }

  const fee = event.entry_fee_inr || 0;
  const split = fee > 0 ? escrowSplit(fee) : { platformInr: 0, organizerInr: 0, taxInr: 0, prizePoolInr: 0 };
  const { data: registration, error } = await supabase.from('event_registrations').insert({
    event_id: eventId,
    participant_id: userId,
    entry_fee_paid_inr: fee,
    payment_status: fee <= 0 ? 'waived' : 'paid',
  }).select('*').single();
  if (error) throw new Error(error.message);

  if (fee > 0) {
    await supabase.from('events').update({
      prize_pool_inr: Math.round((event.prize_pool_inr || 0) + split.prizePoolInr),
    }).eq('id', eventId);

    await supabase.from('event_transactions').insert({
      event_id: eventId,
      registration_id: registration.id,
      txn_type: 'entry_fee',
      amount_inr: fee,
      metadata: {
        platform_fee_inr: split.platformInr,
        organizer_fee_inr: split.organizerInr,
        tax_inr: split.taxInr,
        prize_pool_inr: split.prizePoolInr,
      },
    });
  }

  return { registration, event, escrow: split, alreadyRegistered: false };
}

export async function getRegistration(eventId, userId) {
  if (isMockMode()) {
    seedIfEmpty();
    return registrationsDb.get(`${eventId}:${userId}`) || null;
  }
  const { data } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('participant_id', userId)
    .maybeSingle();
  return data;
}

export async function submitToEvent(userId, eventId, { story_id, story_title }) {
  if (!story_id) throw new Error('story_id required');

  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const reg = await getRegistration(eventId, userId);
  if (!reg) throw new Error('Register before submitting');
  if (reg.payment_status === 'pending' || reg.payment_status === 'failed') {
    throw new Error('Complete entry payment first');
  }

  if (isMockMode()) {
    reg.story_id = story_id;
    reg.story_title = story_title || null;
    registrationsDb.set(`${eventId}:${userId}`, reg);
    event.submission_count = (event.submission_count || 0) + 1;
    eventsDb.set(eventId, event);
    return {
      submission: {
        id: `esub-${Date.now()}`,
        event_id: eventId,
        registration_id: reg.id,
        story_id,
        story_title,
        validation_status: 'pending',
        submitted_at: new Date().toISOString(),
      },
      registration: reg,
    };
  }

  const { data: submission, error } = await supabase.from('event_submissions').insert({
    event_id: eventId,
    registration_id: reg.id,
    story_id,
    content: story_title || null,
    validation_status: 'pending',
    submitted_at: new Date().toISOString(),
  }).select('*').single();
  if (error) throw new Error(error.message);

  return { submission, registration: reg };
}

/** @type {object[]} */
const revenueLedgerMock = [];

export async function getEventRevenueSummary(organizerId) {
  if (isMockMode()) {
    const regs = [...registrationsDb.values()];
    const scopedRegs = organizerId
      ? regs.filter((r) => {
        const ev = eventsDb.get(r.event_id);
        return ev?.organizer_id === organizerId;
      })
      : regs;
    const ledger = organizerId
      ? revenueLedgerMock.filter((e) => {
        const ev = eventsDb.get(e.event_id);
        return ev?.organizer_id === organizerId;
      })
      : revenueLedgerMock;
    return {
      totalEntryFeesInr: ledger.reduce((s, r) => s + (r.entry_fee_inr || 0), 0),
      totalPlatformFeesInr: ledger.reduce((s, r) => s + (r.platform_fee_inr || 0), 0),
      paidRegistrations: scopedRegs.filter((r) => r.payment_status === 'paid').length,
      freeRegistrations: scopedRegs.filter((r) => r.payment_status === 'waived').length,
    };
  }

  let txnQuery = supabase.from('event_transactions').select('amount_inr, metadata, event_id');
  if (organizerId) {
    const { data: events } = await supabase.from('events').select('id').eq('organizer_id', organizerId);
    const ids = (events || []).map((e) => e.id);
    if (!ids.length) {
      return { totalEntryFeesInr: 0, totalPlatformFeesInr: 0, paidRegistrations: 0, freeRegistrations: 0 };
    }
    txnQuery = txnQuery.in('event_id', ids);
  }
  const { data: txns, error: txnErr } = await txnQuery.eq('txn_type', 'entry_fee');
  if (txnErr) throw new Error(txnErr.message);

  let regQuery = supabase.from('event_registrations').select('payment_status, event_id');
  if (organizerId) {
    const { data: events } = await supabase.from('events').select('id').eq('organizer_id', organizerId);
    const ids = (events || []).map((e) => e.id);
    if (ids.length) regQuery = regQuery.in('event_id', ids);
  }
  const { data: regs, error: regErr } = await regQuery;
  if (regErr) throw new Error(regErr.message);

  const totalEntryFeesInr = (txns || []).reduce((s, t) => s + Number(t.amount_inr || 0), 0);
  const totalPlatformFeesInr = (txns || []).reduce(
    (s, t) => s + Number(t.metadata?.platform_fee_inr || 0),
    0,
  );

  return {
    totalEntryFeesInr,
    totalPlatformFeesInr,
    paidRegistrations: (regs || []).filter((r) => r.payment_status === 'paid').length,
    freeRegistrations: (regs || []).filter((r) => r.payment_status === 'waived').length,
  };
}

export { escrowSplit };