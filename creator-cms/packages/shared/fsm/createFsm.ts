/** Lightweight finite-state machine — Vol_09-04 */

export type TransitionMap<S extends string, E extends string> = Record<
  S,
  Partial<Record<E, S>>
>;

export interface FsmDefinition<S extends string, E extends string> {
  initial: S;
  transitions: TransitionMap<S, E>;
}

export function createFsm<S extends string, E extends string>(def: FsmDefinition<S, E>) {
  function canTransition(from: S, event: E): boolean {
    return Boolean(def.transitions[from]?.[event]);
  }

  function transition(from: S, event: E): S {
    const next = def.transitions[from]?.[event];
    if (!next) {
      throw new Error(`Invalid transition: ${from} + ${event}`);
    }
    return next;
  }

  function allowedEvents(from: S): E[] {
    const row = def.transitions[from];
    if (!row) return [];
    return Object.keys(row) as E[];
  }

  return { initial: def.initial, canTransition, transition, allowedEvents };
}