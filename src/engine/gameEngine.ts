import {
  CHAPTERS,
  ENDINGS,
  EVENTS_BY_ID,
  LOCATIONS,
  LOCATIONS_BY_ID,
  OCCUPATIONS_BY_ID,
} from '../data';
import type {
  ChoiceOption,
  ConditionRule,
  DecisionRecord,
  DelayedEffect,
  DialogueNode,
  EndingData,
  GameSettings,
  GameState,
  LocationData,
  LocationExplorationEntry,
  OccupationId,
  PlaythroughRecord,
  SaveSlotData,
  VariableKey,
  Variables,
} from '../types/game';

const STORAGE_KEYS = {
  AUTOSAVE: 'geunal_choice_autosave_v1',
  SLOTS: 'geunal_choice_slots_v1',
  RECORDS: 'geunal_choice_records_v1',
  SETTINGS: 'geunal_choice_settings_v1',
  REFLECTIONS: 'geunal_choice_reflections_v1',
};

export const DEFAULT_SETTINGS: GameSettings = {
  textSpeed: 'normal',
  soundEnabled: true,
  textSize: 'normal',
  displayRatio: 'auto',
};

export const DEFAULT_VARIABLES: Variables = {
  livelihood: 50,
  cooperation: 30,
  communityBurden: 30,
  autonomy: 40,
  solidarity: 50,
};

export function clampVariable(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

export function applyVariableDelta(
  current: Variables,
  delta?: Partial<Variables>
): Variables {
  if (!delta) return { ...DEFAULT_VARIABLES, ...current };
  const next: Variables = { ...DEFAULT_VARIABLES, ...current };
  (Object.keys(delta) as VariableKey[]).forEach((key) => {
    const change = delta[key];
    if (typeof change === 'number') {
      next[key] = clampVariable((next[key] ?? 0) + change);
    }
  });
  return next;
}

export function createInitialGameState(): GameState {
  const now = new Date().toISOString();
  return {
    screen: 'TITLE',
    occupation: null,
    chapter: 1,
    currentNodeId: null,
    currentLocationId: 'loc_farmland',
    variables: { ...DEFAULT_VARIABLES },
    relationships: {},
    flags: [],
    chosenIds: [],
    unlockedLocations: [],
    unlockedSources: [],
    readSources: [],
    visitedExplorationKeys: [],
    pendingDelayedEffects: [],
    triggeredDelayedEffects: [],
    decisionLog: [],
    activeEndingId: null,
    startedAt: now,
    updatedAt: now,
  };
}

export function startNewOccupationGame(occupationId: OccupationId): GameState {
  const occ = OCCUPATIONS_BY_ID[occupationId];
  const ch1 = CHAPTERS[0];
  const introNodeId = ch1.introNodeByOccupation[occupationId] ?? null;
  const now = new Date().toISOString();

  const initialFlags: string[] = [];
  if (occupationId === 'police_assistant' || occupationId === 'clerk') {
    initialFlags.push('unlock_police_substation');
  }

  return {
    screen: 'DIALOGUE',
    occupation: occupationId,
    chapter: 1,
    currentNodeId: introNodeId,
    currentLocationId: occ.startLocationId,
    variables: { ...DEFAULT_VARIABLES, ...occ.initialVariables },
    relationships: { ...occ.initialRelationships },
    flags: initialFlags,
    chosenIds: [],
    unlockedLocations: [...occ.initialUnlockedLocations],
    unlockedSources: [...occ.initialUnlockedSources],
    readSources: [],
    visitedExplorationKeys: [],
    pendingDelayedEffects: [],
    triggeredDelayedEffects: [],
    decisionLog: [],
    activeEndingId: null,
    startedAt: now,
    updatedAt: now,
  };
}

export function evaluateCondition(
  condition: ConditionRule | undefined,
  state: GameState
): boolean {
  if (!condition) return true;

  if (condition.occupation) {
    const allowed = Array.isArray(condition.occupation)
      ? condition.occupation
      : [condition.occupation];
    if (!state.occupation || !allowed.includes(state.occupation)) {
      return false;
    }
  }

  if (condition.minVars) {
    for (const [k, minVal] of Object.entries(condition.minVars)) {
      const currentVal = state.variables[k as VariableKey] ?? 0;
      if (typeof minVal === 'number' && currentVal < minVal) {
        return false;
      }
    }
  }

  if (condition.maxVars) {
    for (const [k, maxVal] of Object.entries(condition.maxVars)) {
      const currentVal = state.variables[k as VariableKey] ?? 0;
      if (typeof maxVal === 'number' && currentVal > maxVal) {
        return false;
      }
    }
  }

  if (condition.requiredFlags) {
    for (const flag of condition.requiredFlags) {
      if (!state.flags.includes(flag)) return false;
    }
  }

  if (condition.forbiddenFlags) {
    for (const flag of condition.forbiddenFlags) {
      if (state.flags.includes(flag)) return false;
    }
  }

  if (condition.requiredSources) {
    for (const srcId of condition.requiredSources) {
      if (!state.readSources.includes(srcId)) return false;
    }
  }

  if (condition.minRelationships) {
    for (const [charId, minRel] of Object.entries(condition.minRelationships)) {
      if ((state.relationships[charId] ?? 50) < minRel) return false;
    }
  }

  if (condition.requiredChoices) {
    for (const choiceId of condition.requiredChoices) {
      if (!state.chosenIds.includes(choiceId)) return false;
    }
  }

  return true;
}

export function applyNodeSideEffects(
  state: GameState,
  node: DialogueNode
): GameState {
  let changed = false;
  let flags = state.flags;
  let unlockedLocations = state.unlockedLocations;
  let unlockedSources = state.unlockedSources;

  if (node.setFlags && node.setFlags.length > 0) {
    const missing = node.setFlags.filter((f) => !flags.includes(f));
    if (missing.length > 0) {
      flags = [...flags, ...missing];
      changed = true;
    }
  }

  if (node.unlockLocationId && !unlockedLocations.includes(node.unlockLocationId)) {
    unlockedLocations = [...unlockedLocations, node.unlockLocationId];
    changed = true;
  }

  if (node.unlockSourceId && !unlockedSources.includes(node.unlockSourceId)) {
    unlockedSources = [...unlockedSources, node.unlockSourceId];
    changed = true;
  }

  if (!changed && state.currentLocationId === node.locationId) {
    return state;
  }

  return {
    ...state,
    currentLocationId: node.locationId,
    flags,
    unlockedLocations,
    unlockedSources,
    updatedAt: new Date().toISOString(),
  };
}

export function resolveNextNodeId(
  node: DialogueNode,
  state: GameState
): string | null {
  if (node.conditionalNext && node.conditionalNext.length > 0) {
    for (const branch of node.conditionalNext) {
      if (evaluateCondition(branch.condition, state)) {
        return branch.next;
      }
    }
  }
  return node.next ?? null;
}

export function applyChoiceToState(
  state: GameState,
  choice: ChoiceOption
): GameState {
  const effects = choice.effects;
  const nextVariables = applyVariableDelta(state.variables, effects?.variables);

  const nextRelationships = { ...state.relationships };
  if (effects?.relationships) {
    for (const [charId, delta] of Object.entries(effects.relationships)) {
      nextRelationships[charId] = clampVariable(
        (nextRelationships[charId] ?? 50) + delta
      );
    }
  }

  const nextFlags = [...state.flags];
  if (effects?.setFlags) {
    for (const f of effects.setFlags) {
      if (!nextFlags.includes(f)) nextFlags.push(f);
    }
  }

  const nextUnlockedLocations = [...state.unlockedLocations];
  if (
    effects?.unlockLocationId &&
    !nextUnlockedLocations.includes(effects.unlockLocationId)
  ) {
    nextUnlockedLocations.push(effects.unlockLocationId);
  }

  const nextUnlockedSources = [...state.unlockedSources];
  if (
    effects?.unlockSourceId &&
    !nextUnlockedSources.includes(effects.unlockSourceId)
  ) {
    nextUnlockedSources.push(effects.unlockSourceId);
  }

  const nextPendingDelayed = [...state.pendingDelayedEffects];
  if (
    effects?.delayedEffect &&
    !nextPendingDelayed.some((d) => d.id === effects.delayedEffect!.id)
  ) {
    nextPendingDelayed.push(effects.delayedEffect);
  }

  const currentChapterData = CHAPTERS.find((c) => c.number === state.chapter);
  const eventTitle =
    (state.occupation &&
      currentChapterData?.mainEventLabelByOccupation[state.occupation]) ||
    `제${state.chapter}장 주요 선택`;

  const record: DecisionRecord = {
    id: choice.id,
    chapter: state.chapter,
    eventTitle,
    choiceText: choice.text,
    summary: choice.logSummary,
    variableChanges: effects?.variables ?? {},
    hasDelayedEffect: Boolean(effects?.delayedEffect),
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    variables: nextVariables,
    relationships: nextRelationships,
    flags: nextFlags,
    chosenIds: state.chosenIds.includes(choice.id)
      ? state.chosenIds
      : [...state.chosenIds, choice.id],
    unlockedLocations: nextUnlockedLocations,
    unlockedSources: nextUnlockedSources,
    pendingDelayedEffects: nextPendingDelayed,
    decisionLog: [...state.decisionLog, record],
    updatedAt: new Date().toISOString(),
  };
}

export function advanceToNextChapter(state: GameState): {
  nextState: GameState;
  newlyTriggered: DelayedEffect[];
} {
  if (!state.occupation) {
    return { nextState: state, newlyTriggered: [] };
  }

  const nextChapterNum = state.chapter + 1;
  const nextChapter = CHAPTERS.find(
    (c) =>
      c.number === nextChapterNum &&
      (!c.availableOccupations ||
        c.availableOccupations.includes(state.occupation!))
  );

  if (!nextChapter) {
    const ending = resolveEnding(state);
    return {
      nextState: {
        ...state,
        screen: 'ENDING',
        activeEndingId: ending.id,
        currentNodeId: null,
        updatedAt: new Date().toISOString(),
      },
      newlyTriggered: [],
    };
  }

  const toTrigger = state.pendingDelayedEffects.filter(
    (d) => d.triggerChapter <= nextChapterNum
  );
  const remainingPending = state.pendingDelayedEffects.filter(
    (d) => d.triggerChapter > nextChapterNum
  );

  let nextVariables = { ...state.variables };
  const nextFlags = [...state.flags];
  for (const eff of toTrigger) {
    nextVariables = applyVariableDelta(nextVariables, eff.variables);
    if (!nextFlags.includes(eff.flag)) {
      nextFlags.push(eff.flag);
    }
  }

  const introNodeId = nextChapter.introNodeByOccupation[state.occupation] ?? null;
  const introNode = introNodeId ? EVENTS_BY_ID[introNodeId] : null;

  let nextState: GameState = {
    ...state,
    screen: 'DIALOGUE',
    chapter: nextChapterNum,
    currentNodeId: introNodeId,
    currentLocationId: introNode?.locationId ?? state.currentLocationId,
    variables: nextVariables,
    flags: nextFlags,
    pendingDelayedEffects: remainingPending,
    triggeredDelayedEffects: [...state.triggeredDelayedEffects, ...toTrigger],
    updatedAt: new Date().toISOString(),
  };

  if (introNode) {
    nextState = applyNodeSideEffects(nextState, introNode);
  }

  return { nextState, newlyTriggered: toTrigger };
}

export function resolveEnding(state: GameState): EndingData {
  const sorted = [...ENDINGS].sort((a, b) => b.priority - a.priority);
  for (const ending of sorted) {
    if (ending.occupation && ending.occupation !== state.occupation) {
      continue;
    }
    if (evaluateCondition(ending.condition, state)) {
      return ending;
    }
  }
  return ENDINGS[ENDINGS.length - 1];
}

export function getLocationVisitForState(
  location: LocationData,
  state: GameState
): LocationExplorationEntry | null {
  if (!state.occupation) return null;
  return (
    location.visits.find(
      (v) => v.occupation === state.occupation && v.chapter === state.chapter
    ) ?? null
  );
}

export function isLocationAccessible(
  location: LocationData,
  state: GameState
): boolean {
  if (state.unlockedLocations.includes(location.id)) return true;
  if (!location.unlockCondition) return true;
  return evaluateCondition(location.unlockCondition, state);
}

export function getChapterExplorationStats(state: GameState): {
  availableLocations: Array<{
    location: LocationData;
    visit: LocationExplorationEntry | null;
    accessible: boolean;
    visited: boolean;
    visitKey: string;
  }>;
  visitedCount: number;
  totalActionableCount: number;
} {
  const availableLocations = LOCATIONS.map((loc) => {
    const visit = getLocationVisitForState(loc, state);
    const accessible = isLocationAccessible(loc, state);
    const visitKey = `${state.occupation ?? 'none'}_c${state.chapter}_${loc.id}`;
    const visited = state.visitedExplorationKeys.includes(visitKey);
    return {
      location: loc,
      visit,
      accessible,
      visited,
      visitKey,
    };
  });

  const actionable = availableLocations.filter(
    (item) => item.accessible && item.visit !== null
  );
  const visitedCount = actionable.filter((item) => item.visited).length;

  return {
    availableLocations,
    visitedCount,
    totalActionableCount: actionable.length,
  };
}

// --- LocalStorage Persistence ---

export function saveAutoSave(state: GameState): void {
  if (!state.occupation || state.screen === 'TITLE' || state.screen === 'PROLOGUE' || state.screen === 'OCCUPATION_SELECT') {
    return;
  }
  try {
    const locName = LOCATIONS_BY_ID[state.currentLocationId]?.name ?? '송현면';
    const payload: SaveSlotData = {
      slotId: 'autosave',
      label: '자동 저장',
      savedAt: new Date().toISOString(),
      occupation: state.occupation,
      chapter: state.chapter,
      locationName: locName,
      state,
    };
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadAutoSave(): SaveSlotData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTOSAVE);
    if (!raw) return null;
    return JSON.parse(raw) as SaveSlotData;
  } catch {
    return null;
  }
}

export function loadManualSlots(): Record<string, SaveSlotData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLOTS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SaveSlotData>;
  } catch {
    return {};
  }
}

export function saveManualSlot(slotId: string, state: GameState): SaveSlotData | null {
  if (!state.occupation) return null;
  try {
    const slots = loadManualSlots();
    const locName = LOCATIONS_BY_ID[state.currentLocationId]?.name ?? '송현면';
    const entry: SaveSlotData = {
      slotId,
      label: `기록 슬롯 ${slotId.replace('slot_', '')}`,
      savedAt: new Date().toISOString(),
      occupation: state.occupation,
      chapter: state.chapter,
      locationName: locName,
      state,
    };
    slots[slotId] = entry;
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    return entry;
  } catch {
    return null;
  }
}

export function deleteManualSlot(slotId: string): void {
  try {
    const slots = loadManualSlots();
    delete slots[slotId];
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  } catch {
    // Ignore
  }
}

export function clearAutoSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTOSAVE);
  } catch {
    // Ignore
  }
}

export function loadPlaythroughRecords(): PlaythroughRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) return [];
    return JSON.parse(raw) as PlaythroughRecord[];
  } catch {
    return [];
  }
}

export function appendPlaythroughRecord(
  state: GameState,
  ending: EndingData
): PlaythroughRecord[] {
  if (!state.occupation) return loadPlaythroughRecords();
  const existing = loadPlaythroughRecords();
  const record: PlaythroughRecord = {
    id: `rec_${Date.now()}`,
    completedAt: new Date().toISOString(),
    occupation: state.occupation,
    endingId: ending.id,
    endingTitle: ending.title,
    endingScope: ending.scope,
    finalVariables: { ...state.variables },
    decisionCount: state.decisionLog.length,
    readSourceCount: state.readSources.length,
    decisions: [...state.decisionLog],
  };
  const updated = [record, ...existing].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadReflectionMemo(endingId: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
    if (!raw) return '';
    const map = JSON.parse(raw) as Record<string, string>;
    return map[endingId] ?? '';
  } catch {
    return '';
  }
}

export function saveReflectionMemo(endingId: string, memo: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[endingId] = memo;
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(map));
  } catch {
    // Ignore
  }
}
