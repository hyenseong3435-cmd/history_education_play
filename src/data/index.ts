import occupationsRaw from './occupations.json';
import charactersRaw from './characters.json';
import locationsRaw from './locations.json';
import chaptersRaw from './chapters.json';
import sourcesRaw from './sources.json';
import endingsRaw from './endings.json';
import farmerEventsRaw from './events/farmer.json';
import clerkEventsRaw from './events/clerk.json';
import policeEventsRaw from './events/police_assistant.json';

import type {
  OccupationData,
  CharacterData,
  LocationData,
  ChapterData,
  HistoricalSource,
  EndingData,
  DialogueNode,
  VariableMeta,
} from '../types/game';

export const OCCUPATIONS: OccupationData[] = occupationsRaw as unknown as OccupationData[];
export const CHARACTERS: CharacterData[] = charactersRaw as unknown as CharacterData[];
export const LOCATIONS: LocationData[] = locationsRaw as unknown as LocationData[];
export const CHAPTERS: ChapterData[] = chaptersRaw as unknown as ChapterData[];
export const SOURCES: HistoricalSource[] = sourcesRaw as unknown as HistoricalSource[];
export const ENDINGS: EndingData[] = endingsRaw as unknown as EndingData[];

export const ALL_EVENTS: DialogueNode[] = [
  ...(farmerEventsRaw as unknown as DialogueNode[]),
  ...(clerkEventsRaw as unknown as DialogueNode[]),
  ...(policeEventsRaw as unknown as DialogueNode[]),
];

export const EVENTS_BY_ID: Record<string, DialogueNode> = Object.fromEntries(
  ALL_EVENTS.map((node) => [node.id, node])
);

export const OCCUPATIONS_BY_ID = Object.fromEntries(
  OCCUPATIONS.map((occ) => [occ.id, occ])
) as Record<OccupationData['id'], OccupationData>;

export const CHARACTERS_BY_ID: Record<string, CharacterData> = Object.fromEntries(
  CHARACTERS.map((char) => [char.id, char])
);

export const LOCATIONS_BY_ID: Record<string, LocationData> = Object.fromEntries(
  LOCATIONS.map((loc) => [loc.id, loc])
);

export const SOURCES_BY_ID: Record<string, HistoricalSource> = Object.fromEntries(
  SOURCES.map((src) => [src.id, src])
);

export const VARIABLE_META: VariableMeta[] = [
  {
    key: 'livelihood',
    label: '생계 안정',
    shortLabel: '생계',
    description: '주인공과 가족의 식량·주거·소득 등 경제적 생존 기반의 안정 정도입니다.',
    lowNote: '식량·채무 위기',
    highNote: '가계 기반 유지',
  },
  {
    key: 'cooperation',
    label: '체제 협력',
    shortLabel: '협력',
    description: '식민지 행정·경찰·동원 체제의 요구에 참여하거나 협조한 정도입니다.',
    lowNote: '체제와 거리·마찰',
    highNote: '체제 요구에 밀착',
  },
  {
    key: 'communityBurden',
    label: '공동체 부담',
    shortLabel: '부담',
    description: '주인공의 선택으로 인해 마을 이웃과 공동체에 전가된 할당·단속 부담입니다.',
    lowNote: '이웃 전가 최소화',
    highNote: '공동체 부담 가중',
  },
  {
    key: 'autonomy',
    label: '행동 자율성',
    shortLabel: '자율',
    description: '주어진 강제와 통제 조건 속에서 스스로 판단하고 행동할 여지를 확보한 정도입니다.',
    lowNote: '외부 강제에 종속',
    highNote: '자기 판단 여지 확보',
  },
  {
    key: 'solidarity',
    label: '연대',
    shortLabel: '연대',
    description: '가족, 이웃, 마을 공동체 구성원 사이에 형성된 상호 신뢰와 협력 정도입니다.',
    lowNote: '공동체와 고립·단절',
    highNote: '이웃과의 상호 신뢰',
  },
];

export const FARMER_VARIABLE_META: VariableMeta[] = [
  {
    key: 'livelihood',
    label: '생계 안정도',
    shortLabel: '생계',
    description: '가족의 식량과 경작 기반 유지 정도입니다. 생계가 어렵다는 사실 자체가 도덕적 결함은 아닙니다.',
    lowNote: '식량·경작 기반 위기',
    highNote: '당장의 생계 유지',
  },
  {
    key: 'cooperation',
    label: '체제 협력도',
    shortLabel: '협력',
    description: '증산·공출 정책과 면사무소·금융조합 행정에 협조한 정도입니다.',
    lowNote: '행정 요구와 거리',
    highNote: '증산·공출 적극 협력',
  },
  {
    key: 'communityBurden',
    label: '감시·부담 위험',
    shortLabel: '위험',
    description: '주재소 감시·탄압 위험이나 이웃 농가로 전가되는 공출 부담의 정도입니다.',
    lowNote: '위험·전가 낮음',
    highNote: '감시·전가 부담 심화',
  },
  {
    key: 'autonomy',
    label: '저항 참여도',
    shortLabel: '저항',
    description: '농민운동 및 소작·공출 문제에 대한 집단적 문제 제기에 참여한 정도입니다.',
    lowNote: '침묵·비관여',
    highNote: '공동 대응·저항 참여',
  },
  {
    key: 'solidarity',
    label: '주민 연대도',
    shortLabel: '연대',
    description: '김봉수와 이웃 농민들과의 신뢰 및 공동 대응 관계의 정도입니다.',
    lowNote: '마을과 고립·단절',
    highNote: '이웃 농민과의 연대',
  },
];

export const CLERK_VARIABLE_META: VariableMeta[] = [
  {
    key: 'cooperation',
    label: '체제 협력도',
    shortLabel: '협력도',
    description: '식민지 행정과 전시 동원·공출·황민화 정책에 협조한 정도입니다.',
    lowNote: '행정 지시와 마찰·거부',
    highNote: '식민 행정 적극 협조',
  },
  {
    key: 'autonomy',
    label: '양심 지수',
    shortLabel: '양심',
    description: '부당한 명령과 서류 집행에 대한 문제의식과 거부 의사의 정도입니다.',
    lowNote: '명령 순응·회피',
    highNote: '부당함 직시·거부 의사',
  },
  {
    key: 'solidarity',
    label: '주민 신뢰도',
    shortLabel: '신뢰도',
    description: '최덕수, 이정수 등 마을 주민 및 지역 공동체와의 신뢰 관계입니다.',
    lowNote: '공동체로부터 배척',
    highNote: '이웃과의 신뢰 유지',
  },
  {
    key: 'livelihood',
    label: '출세 가능성',
    shortLabel: '출세',
    description: '오 면장 및 군청 상급기관의 평가와 직위·급여 유지 가능성입니다.',
    lowNote: '징계·해고 위기',
    highNote: '승급·상급기관 신임',
  },
  {
    key: 'communityBurden',
    label: '자기합리화 지수',
    shortLabel: '합리화',
    description: '‘어쩔 수 없었다’, ‘내가 안 해도 누군가 한다’며 자신의 행위를 정당화하는 정도입니다.',
    lowNote: '책임 직면',
    highNote: '합리화·회피 심화',
  },
];

export const POLICE_VARIABLE_META: VariableMeta[] = [
  {
    key: 'livelihood',
    label: '직위·생계 안정',
    shortLabel: '생계',
    description: '순사보 급여와 관사, 가족 부양 기반이 유지되는 정도입니다.',
    lowNote: '직위 박탈·생계 위기',
    highNote: '신분·생계 유지',
  },
  {
    key: 'cooperation',
    label: '상부 복종도',
    shortLabel: '복종',
    description: '사토 순사부장과 주재소의 단속·보고 명령을 충실히 수행한 정도입니다.',
    lowNote: '명령 이탈·의심 누적',
    highNote: '조직 지침 철저 집행',
  },
  {
    key: 'communityBurden',
    label: '단속 피해 부담',
    shortLabel: '피해',
    description: '단속과 연행 집행으로 들말과 송현면 주민에게 전가된 실질적 피해입니다.',
    lowNote: '직접 피해 최소화',
    highNote: '주민 피해·원성 심화',
  },
  {
    key: 'autonomy',
    label: '현장 재량',
    shortLabel: '재량',
    description: '경찰 위계 안에서 개인적 판단과 소극적 유예 여지를 행사한 정도입니다.',
    lowNote: '기계적 복종',
    highNote: '현장 재량 행사',
  },
  {
    key: 'solidarity',
    label: '주민 관계 유지',
    shortLabel: '관계',
    description: '제복을 입은 처지에서도 마을 이웃과 최소한의 신뢰를 지킨 정도입니다.',
    lowNote: '마을과 완전 단절',
    highNote: '최소한의 신뢰 유지',
  },
];

export function getVariableMetaForOccupation(
  occupation: OccupationData['id'] | null
): VariableMeta[] {
  if (occupation === 'farmer') return FARMER_VARIABLE_META;
  if (occupation === 'clerk') return CLERK_VARIABLE_META;
  if (occupation === 'police_assistant') return POLICE_VARIABLE_META;
  return VARIABLE_META;
}

export function getClerkRiskMetrics(
  flags: string[],
  relationships: Record<string, number>
): { surveillanceRisk: number; familySafety: number } {
  const riskWeights: Record<string, number> = {
    risk_p_exclude: 14,
    risk_p_protest: 26,
    risk_c1_fair: 12,
    risk_c1_reject_landlord: 26,
    risk_c1_confide: 14,
    risk_c2_delay: 24,
    risk_c3_substitute: 12,
    risk_c3_protest: 34,
    risk_c3_warn: 24,
    risk_e3_admit: 28,
    risk_e3_flee: 20,
  };
  let risk = 10;
  for (const flag of flags) {
    if (riskWeights[flag]) {
      risk += riskWeights[flag];
    }
  }
  const surveillanceRisk = Math.max(0, Math.min(100, risk));
  const motherScore = relationships.char_jinho_mother ?? 80;
  const familySafety = Math.max(
    0,
    Math.min(100, Math.round(motherScore - Math.max(0, surveillanceRisk - 40) * 0.45))
  );
  return { surveillanceRisk, familySafety };
}

export function getChapterDisplay(
  chapter: ChapterData,
  occupation: OccupationData['id'] | null
) {
  return {
    title:
      (occupation && chapter.titleByOccupation?.[occupation]) || chapter.title,
    period:
      (occupation && chapter.periodByOccupation?.[occupation]) || chapter.period,
    summary:
      (occupation && chapter.summaryByOccupation?.[occupation]) ||
      chapter.summary,
    historicalContext:
      (occupation && chapter.historicalContextByOccupation?.[occupation]) ||
      chapter.historicalContext,
  };
}
