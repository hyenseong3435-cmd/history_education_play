export type OccupationId = 'farmer' | 'clerk' | 'police_assistant';

export type VariableKey =
  | 'livelihood'
  | 'cooperation'
  | 'communityBurden'
  | 'autonomy'
  | 'solidarity';

export type Variables = Record<VariableKey, number>;

export interface VariableMeta {
  key: VariableKey;
  label: string;
  shortLabel: string;
  description: string;
  lowNote: string;
  highNote: string;
}

export interface ConditionRule {
  occupation?: OccupationId | OccupationId[];
  minVars?: Partial<Variables>;
  maxVars?: Partial<Variables>;
  requiredFlags?: string[];
  forbiddenFlags?: string[];
  requiredSources?: string[];
  minRelationships?: Record<string, number>;
  requiredChoices?: string[];
}

export interface OccupationData {
  id: OccupationId;
  name: string;
  title: string;
  protagonistId: string;
  protagonistName: string;
  age: number;
  summary: string;
  socialPosition: string;
  historicalScope: string;
  keyConflicts: string[];
  startLocationId: string;
  startBackground: string;
  portraitSprite: string;
  initialVariables: Variables;
  initialRelationships: Record<string, number>;
  initialUnlockedLocations: string[];
  initialUnlockedSources: string[];
  familyAndContacts: Array<{
    characterId: string;
    relation: string;
    note: string;
  }>;
}

export interface CharacterData {
  id: string;
  name: string;
  role: string;
  defaultExpression: string;
  expressions: Record<string, string>;
  description: string;
  isFictional: boolean;
}

export interface LocationExplorationEntry {
  occupation: OccupationId;
  chapter: number;
  startNodeId: string;
  npcIds: string[];
  activityLabel: string;
  rewardHint?: string;
  unlockSourceId?: string;
}

export interface LocationData {
  id: string;
  name: string;
  district: string;
  description: string;
  background: string;
  nightBackground?: string;
  historicalNote: string;
  unlockCondition?: ConditionRule;
  lockedHint?: string;
  visits: LocationExplorationEntry[];
}

export interface ChapterData {
  number: number;
  title: string;
  period: string;
  eventType: 'occupation_specific' | 'shared_historical' | 'convergent_climax';
  summary: string;
  historicalContext: string;
  availableOccupations?: OccupationId[];
  titleByOccupation?: Partial<Record<OccupationId, string>>;
  periodByOccupation?: Partial<Record<OccupationId, string>>;
  summaryByOccupation?: Partial<Record<OccupationId, string>>;
  historicalContextByOccupation?: Partial<Record<OccupationId, string>>;
  introNodeByOccupation: Partial<Record<OccupationId, string>>;
  mainEventNodeByOccupation: Partial<Record<OccupationId, string>>;
  mainEventLabelByOccupation: Partial<Record<OccupationId, string>>;
  recommendedVisitsCount: number;
}

export interface HistoricalSource {
  id: string;
  code: string;
  title: string;
  period: string;
  relatedEvent: string;
  originalText: string;
  translationText: string;
  citation: string;
  isAwaitingOriginalInsert: boolean;
  historicalContext: string;
  factVsFiction: string;
  commentary: string;
  gameplayInsight: string;
}

export interface StageCharacter {
  characterId: string;
  expression?: string;
  position: 'left' | 'center' | 'right';
  dimmed?: boolean;
}

export interface DelayedEffect {
  id: string;
  triggerChapter: number;
  title: string;
  description: string;
  variables?: Partial<Variables>;
  flag: string;
}

export interface ChoiceEffect {
  variables?: Partial<Variables>;
  relationships?: Record<string, number>;
  setFlags?: string[];
  delayedEffect?: DelayedEffect;
  unlockLocationId?: string;
  unlockSourceId?: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  subtext?: string;
  condition?: ConditionRule;
  showWhenLocked?: boolean;
  lockedReason?: string;
  unlockTag?: string;
  effects?: ChoiceEffect;
  logSummary: string;
  next: string;
}

export interface DialogueNode {
  id: string;
  locationId: string;
  background?: string;
  characters?: StageCharacter[];
  speakerId?: string;
  speakerName?: string;
  speakerRole?: string;
  text: string;
  historicalBadge?: {
    kind: 'fact' | 'fiction' | 'source';
    label: string;
    sourceId?: string;
  };
  unlockSourceId?: string;
  unlockLocationId?: string;
  setFlags?: string[];
  next?: string | null;
  conditionalNext?: Array<{
    condition: ConditionRule;
    next: string;
  }>;
  choices?: ChoiceOption[];
}

export interface EndingData {
  id: string;
  scope: 'occupation' | 'common';
  occupation?: OccupationId;
  priority: number;
  condition: ConditionRule;
  title: string;
  subtitle: string;
  background: string;
  narrationLines?: string[];
  protagonistOutcome: string;
  familyOutcome: string;
  communityOutcome: string;
  choiceConsequencesSummary: string;
  colonialSystemRelation: string;
  reflectionQuestions: string[];
  commonReflectionLines?: string[];
  sourceRevisitNote?: string;
  recommendedSourceId?: string;
}

export interface DecisionRecord {
  id: string;
  chapter: number;
  eventTitle: string;
  choiceText: string;
  summary: string;
  variableChanges: Partial<Variables>;
  hasDelayedEffect: boolean;
  timestamp: string;
}

export type ScreenMode =
  | 'TITLE'
  | 'PROLOGUE'
  | 'OCCUPATION_SELECT'
  | 'EXPLORE'
  | 'DIALOGUE'
  | 'ENDING';

export interface GameState {
  screen: ScreenMode;
  occupation: OccupationId | null;
  chapter: number;
  currentNodeId: string | null;
  currentLocationId: string;
  variables: Variables;
  relationships: Record<string, number>;
  flags: string[];
  chosenIds: string[];
  unlockedLocations: string[];
  unlockedSources: string[];
  readSources: string[];
  visitedExplorationKeys: string[];
  pendingDelayedEffects: DelayedEffect[];
  triggeredDelayedEffects: DelayedEffect[];
  decisionLog: DecisionRecord[];
  activeEndingId: string | null;
  startedAt: string;
  updatedAt: string;
}

export interface SaveSlotData {
  slotId: string;
  label: string;
  savedAt: string;
  occupation: OccupationId;
  chapter: number;
  locationName: string;
  state: GameState;
}

export interface PlaythroughRecord {
  id: string;
  completedAt: string;
  occupation: OccupationId;
  endingId: string;
  endingTitle: string;
  endingScope: 'occupation' | 'common';
  finalVariables: Variables;
  decisionCount: number;
  readSourceCount: number;
  decisions: DecisionRecord[];
}

export type DisplayRatioMode = 'auto' | '16:9' | '4:3' | 'portrait';

export interface GameSettings {
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  soundEnabled: boolean;
  textSize: 'normal' | 'large';
  displayRatio: DisplayRatioMode;
}
