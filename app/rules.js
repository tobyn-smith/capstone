export const CONFIDENCE = 62;

export const WATCH = ["assess", "monitor"];
export const STOPPABLE = ["patrols", "inspections"];
export const LOCKED = ["warning", "freeze"];

const WATCH_SET = new Set(WATCH);
const STOPPABLE_SET = new Set(STOPPABLE);

export function actionsFromDelegation(ticked, bar) {
  const chosen = Array.isArray(ticked) ? ticked : [];
  if (CONFIDENCE >= Number(bar)) return [...chosen];
  return chosen.filter((action) => WATCH_SET.has(action));
}

export function applyCountermand(taken, countermanded) {
  const stop = new Set(
    (Array.isArray(countermanded) ? countermanded : []).filter((action) =>
      STOPPABLE_SET.has(action)
    )
  );
  return (Array.isArray(taken) ? taken : []).filter((action) => !stop.has(action));
}

export function resolveOutcome(finalActions, firstDecision) {
  const set = new Set(finalActions);
  if (set.has("inspections")) {
    return { outcome: "escalated", harm: true, injury: true };
  }
  if (set.has("patrols") || set.has("freeze")) {
    return { outcome: "escalated", harm: true, injury: false };
  }
  if (set.has("warning") || firstDecision === "blame") {
    return { outcome: "political", harm: false, injury: false };
  }
  return { outcome: "contained", harm: false, injury: false };
}

export function stoppableTaken(actions) {
  return (actions || []).filter((action) => STOPPABLE_SET.has(action));
}

export function needsHold(actions) {
  const set = new Set(actions || []);
  return ["warning", "freeze", "patrols", "inspections"].some((action) => set.has(action));
}
