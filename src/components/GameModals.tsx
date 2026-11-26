import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Home,
  Lock,
  Save,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  CHARACTERS_BY_ID,
  ENDINGS,
  OCCUPATIONS_BY_ID,
  SOURCES,
  getClerkRiskMetrics,
  getVariableMetaForOccupation,
} from '../data';
import type {
  GameSettings,
  GameState,
  PlaythroughRecord,
  SaveSlotData,
  VariableKey,
} from '../types/game';
import type { ActiveModalType } from './TopGameBar';

interface GameModalsProps {
  activeModal: ActiveModalType;
  initialSourceId: string | null;
  state: GameState;
  settings: GameSettings;
  autoSave: SaveSlotData | null;
  manualSlots: Record<string, SaveSlotData>;
  records: PlaythroughRecord[];
  onClose: () => void;
  onMarkSourceRead: (sourceId: string) => void;
  onSaveSlot: (slotId: string) => void;
  onLoadSlot: (slot: SaveSlotData) => void;
  onDeleteSlot: (slotId: string) => void;
  onUpdateSettings: (next: GameSettings) => void;
  onReturnToTitle: () => void;
}

const MODAL_TITLES: Record<Exclude<ActiveModalType, null>, string> = {
  sources: '사료 열람실 (사료 D–I)',
  status: '변수 현황 · 인물 관계',
  log: '선택 기록',
  save: '저장 및 불러오기',
  settings: '환경 설정',
  records: '플레이 기록',
  guide: '게임 설명',
  credits: '사료 노트',
};

const SLOT_IDS = ['slot_1', 'slot_2', 'slot_3'];

export function GameModals({
  activeModal,
  initialSourceId,
  state,
  settings,
  autoSave,
  manualSlots,
  records,
  onClose,
  onMarkSourceRead,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  onUpdateSettings,
  onReturnToTitle,
}: GameModalsProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialSourceId || state.unlockedSources[0] || SOURCES[0].id
  );
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [confirmTitleReturn, setConfirmTitleReturn] = useState(false);

  useEffect(() => {
    if (activeModal === 'sources') {
      const target =
        initialSourceId || state.unlockedSources[0] || SOURCES[0].id;
      setSelectedSourceId(target);
      if (state.unlockedSources.includes(target)) {
        onMarkSourceRead(target);
      }
    }
    setConfirmTitleReturn(false);
    setSaveToast(null);
  }, [activeModal, initialSourceId, state.unlockedSources, onMarkSourceRead]);

  useEffect(() => {
    if (!activeModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  const handleSelectSource = (srcId: string, unlocked: boolean) => {
    setSelectedSourceId(srcId);
    if (unlocked) {
      onMarkSourceRead(srcId);
    }
  };

  const handleManualSave = (slotId: string) => {
    onSaveSlot(slotId);
    setSaveToast('현재 진행 상황이 브라우저에 저장되었습니다.');
    window.setTimeout(() => setSaveToast(null), 2200);
  };

  const activeSource =
    SOURCES.find((s) => s.id === selectedSourceId) ?? SOURCES[0];
  const isActiveSourceUnlocked =
    state.screen === 'TITLE' ||
    state.screen === 'ENDING' ||
    state.unlockedSources.includes(activeSource.id);

  const uniqueEndedIds = new Set(records.map((r) => r.endingId));
  const occ = state.occupation ? OCCUPATIONS_BY_ID[state.occupation] : null;
  const activeVariableMeta = getVariableMetaForOccupation(state.occupation);
  const lastDecisionChanges =
    state.decisionLog.length > 0
      ? state.decisionLog[state.decisionLog.length - 1].variableChanges
      : {};
  const clerkRisk =
    state.occupation === 'clerk'
      ? getClerkRiskMetrics(state.flags, state.relationships)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={MODAL_TITLES[activeModal]}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88dvh] bg-[#15171A] border border-[#343841] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#292D34] bg-[#111316] flex items-center justify-between gap-4 shrink-0">
          <h2 className="font-editorial text-lg sm:text-xl font-semibold text-[#F1EEE8]">
            {MODAL_TITLES[activeModal]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="창 닫기"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A8A49C] hover:text-[#F4F1EB] hover:bg-[#1F2228] border border-transparent hover:border-[#393E48] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* 1. HISTORICAL SOURCES ARCHIVE */}
          {activeModal === 'sources' && (
            <div className="space-y-5">
              <p className="text-xs sm:text-sm text-[#A8A49C] leading-relaxed">
                탐색 중 획득한 사료를 열람하면 관련 역사적 맥락을 확인할 수 있으며,
                주요 사건에서 새로운 조건부 선택지가 해금될 수 있습니다.
              </p>

              {/* Source selector tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SOURCES.map((src) => {
                  const unlocked =
                    state.screen === 'TITLE' ||
                    state.screen === 'ENDING' ||
                    state.unlockedSources.includes(src.id);
                  const read = state.readSources.includes(src.id);
                  const selected = src.id === selectedSourceId;

                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => handleSelectSource(src.id, unlocked)}
                      className={`min-h-[48px] px-3 py-2 text-left border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#202328] border-[#B2A999] text-[#F4F1EB]'
                          : unlocked
                          ? 'bg-[#17191D] border-[#2C3037] hover:border-[#4D535E] text-[#CFCBC2]'
                          : 'bg-[#121417] border-[#22252B] text-[#6E6C67]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs font-semibold">
                        <span>{src.code}</span>
                        {!unlocked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : read ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#A49B8C]" />
                        ) : (
                          <span className="text-[11px] text-[#D49790]">미열람</span>
                        )}
                      </div>
                      <p className="text-[11px] truncate opacity-80 mt-0.5">
                        {unlocked ? src.title : '탐색으로 해금'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Active source document view */}
              {!isActiveSourceUnlocked ? (
                <div className="p-6 bg-[#111316] border border-[#292D34] text-center space-y-2">
                  <Lock className="w-6 h-6 mx-auto text-[#7B7973]" />
                  <p className="font-editorial text-base text-[#D4D0C7]">
                    아직 획득하지 못한 사료입니다 ({activeSource.code})
                  </p>
                  <p className="text-xs sm:text-sm text-[#8F8C85]">
                    관련 사건({activeSource.relatedEvent})을 진행하거나 면사무소·주재소·들말을
                    탐색하면 열람할 수 있습니다.
                  </p>
                </div>
              ) : (
                <article className="hanji-surface p-5 sm:p-7 border border-[#BDB7A9] space-y-5">
                  <header className="border-b border-[#C8C2B5] pb-3.5 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F2C27] font-semibold">
                      <span>{activeSource.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeSource.period}</span>
                    </div>
                    <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C1B18]">
                      {activeSource.title}
                    </h3>
                    <p className="text-xs text-[#545049]">
                      관련 사건: {activeSource.relatedEvent}
                    </p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F5F2EB] border border-[#CCC6B9] space-y-1.5">
                      <p className="text-xs font-semibold text-[#544F47]">
                        사료 원문
                      </p>
                      <p className="text-xs sm:text-sm text-[#2D2A26] leading-relaxed font-editorial">
                        {activeSource.originalText}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F5F2EB] border border-[#CCC6B9] space-y-1.5">
                      <p className="text-xs font-semibold text-[#544F47]">
                        번역문 및 출처
                      </p>
                      <p className="text-xs sm:text-sm text-[#2D2A26] leading-relaxed">
                        {activeSource.translationText}
                      </p>
                      <p className="text-[11px] text-[#6B665D] pt-1 font-data">
                        출처: {activeSource.citation}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-[#262420] leading-[1.78]">
                    <div>
                      <p className="text-xs font-bold text-[#6F2C27] mb-1">
                        실제 역사적 사실 및 제도 맥락
                      </p>
                      <p>{activeSource.historicalContext}</p>
                    </div>

                    <div className="pt-2.5 border-t border-[#CFC9BC]">
                      <p className="text-xs font-bold text-[#444039] mb-1">
                        역사적 사실과 게임 각색의 구분
                      </p>
                      <p className="text-xs sm:text-sm text-[#393630]">
                        {activeSource.factVsFiction}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#CFC9BC]">
                      <p className="text-xs font-bold text-[#444039] mb-1">
                        사료 해설
                      </p>
                      <p className="text-xs sm:text-sm text-[#393630]">
                        {activeSource.commentary}
                      </p>
                    </div>

                    <div className="p-3 bg-[#E3DDD1] border border-[#C2BCAE] text-xs text-[#2B2823] flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-[#6F2C27] shrink-0 mt-0.5" />
                      <span>{activeSource.gameplayInsight}</span>
                    </div>
                  </div>
                </article>
              )}
            </div>
          )}

          {/* 2. STATUS & RELATIONSHIPS */}
          {activeModal === 'status' && (
            <div className="space-y-6">
              {occ && (
                <div className="pb-4 border-b border-[#292D34] flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs text-[#9E978B]">
                      제{state.chapter}장 진행 중
                    </p>
                    <h3 className="font-editorial text-xl font-semibold text-[#F1EEE8]">
                      {occ.name} · {occ.protagonistName} ({occ.age}세)
                    </h3>
                  </div>
                  <p className="text-xs text-[#96938B]">{occ.socialPosition}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="font-editorial text-base font-semibold text-[#EAE7E0]">
                    {occ ? `${occ.name} 전용 5대 변수 현황 (0–100)` : '5대 핵심 지표 (0–100)'}
                  </h4>
                  <p className="text-xs text-[#928F88] mt-0.5">
                    직업마다 서로 다른 5대 변수가 적용됩니다. 이 수치들은 도덕성을
                    채점하는 점수가 아니라, 선택이 남긴 구조적 위치와 관계의 흔적입니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activeVariableMeta.map((meta) => {
                    const val = state.variables[meta.key];
                    const lastDelta = lastDecisionChanges[meta.key];
                    return (
                      <div
                        key={meta.key}
                        className="p-3.5 bg-[#111316] border border-[#292D34] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#ECE9E2]">
                            {meta.label}
                          </span>
                          <div className="flex items-center gap-2">
                            {typeof lastDelta === 'number' && lastDelta !== 0 && (
                              <span
                                className={`font-data text-xs px-1.5 py-0.5 border ${
                                  lastDelta > 0
                                    ? 'text-[#DFDCD5] bg-[#1F2429] border-[#4A505A]'
                                    : 'text-[#D69D96] bg-[#211718] border-[#5E3431]'
                                }`}
                              >
                                최근 {lastDelta > 0 ? `+${lastDelta}` : lastDelta}
                              </span>
                            )}
                            <span className="font-data text-sm font-medium text-[#B2A999]">
                              {val} / 100
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-[#1E2126] overflow-hidden">
                          <div
                            className="h-full bg-[#9E9586] transition-all duration-200"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#7E7C76]">
                          <span>0 · {meta.lowNote}</span>
                          <span>100 · {meta.highNote}</span>
                        </div>
                        <p className="text-xs text-[#A5A29A] leading-snug">
                          {meta.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {clerkRisk && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-semibold text-[#A8A49C]">
                      면서기 추가 상황 지표 (선택 누적 반영)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#141214] border border-[#3B2B2D] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#E8D5D2]">
                            주재소 감시 위험
                          </span>
                          <span className="font-data text-[#D69D96]">
                            {clerkRisk.surveillanceRisk} / 100
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#1E1A1B] overflow-hidden">
                          <div
                            className="h-full bg-[#9C4A43] transition-all duration-200"
                            style={{ width: `${clerkRisk.surveillanceRisk}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#9E9591]">
                          항의·서류 지연·명부 거부가 누적될수록 면장과 주재소의 감시가 강해집니다.
                        </p>
                      </div>
                      <div className="p-3 bg-[#111316] border border-[#292D34] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#ECE9E2]">
                            가족 안전도
                          </span>
                          <span className="font-data text-[#B2A999]">
                            {clerkRisk.familySafety} / 100
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#1E2126] overflow-hidden">
                          <div
                            className="h-full bg-[#8D897E] transition-all duration-200"
                            style={{ width: `${clerkRisk.familySafety}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#9E9A92]">
                          어머니와 가족이 감시·생계 위기에서 얼마나 보호되고 있는지를 보여줍니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NPC Relationships */}
              <div className="space-y-3 pt-2 border-t border-[#292D34]">
                <h4 className="font-editorial text-base font-semibold text-[#EAE7E0]">
                  주변 인물과의 관계
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {Object.entries(state.relationships).map(([charId, score]) => {
                    const ch = CHARACTERS_BY_ID[charId];
                    if (!ch) return null;
                    const relationLabel =
                      score >= 70
                        ? '신뢰 깊음'
                        : score >= 45
                        ? '보통 · 조심스러움'
                        : '긴장 · 거리감';
                    return (
                      <div
                        key={charId}
                        className="p-3 bg-[#111316] border border-[#272B32] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#EAE7E0]">
                            {ch.name}
                          </span>
                          <span className="font-data text-xs text-[#B2A999]">
                            {score}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E8B84]">{ch.role}</p>
                        <p className="text-[11px] text-[#B8B4AC]">
                          상태: {relationLabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {state.triggeredDelayedEffects.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#292D34]">
                  <h4 className="font-editorial text-base font-semibold text-[#EAE7E0]">
                    발생한 지연 결과
                  </h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-[#C4C0B8]">
                    {state.triggeredDelayedEffects.map((eff) => (
                      <li key={eff.id}>
                        <strong className="text-[#D69D96]">{eff.title}</strong> —{' '}
                        {eff.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 3. DECISION LOG */}
          {activeModal === 'log' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-[#A5A29A]">
                지금까지 주요 사건에서 내린 모든 선택과 지표 변화가 시간순으로 기록됩니다.
              </p>

              {state.decisionLog.length === 0 ? (
                <div className="p-8 bg-[#111316] border border-[#292D34] text-center text-sm text-[#8D8A83]">
                  아직 기록된 주요 선택이 없습니다. 각 장의 주요 사건에서 결정을 내리면
                  이곳에 기록됩니다.
                </div>
              ) : (
                <ol className="space-y-3">
                  {state.decisionLog.map((rec, idx) => (
                    <li
                      key={`${rec.id}-${idx}`}
                      className="p-4 bg-[#111316] border border-[#2A2E35] space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9E978B]">
                        <span>
                          0{idx + 1}. 제{rec.chapter}장 · {rec.eventTitle}
                        </span>
                        {rec.hasDelayedEffect && (
                          <span className="text-[#D49790]">지연 결과 연결됨</span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-medium text-[#F1EEE8]">
                        {rec.choiceText}
                      </p>
                      <p className="text-xs text-[#9C9991]">{rec.summary}</p>
                      {Object.keys(rec.variableChanges).length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 border-t border-[#22252B] text-xs font-data text-[#B5B1A9]">
                          {(
                            Object.entries(rec.variableChanges) as [
                              VariableKey,
                              number,
                            ][]
                          ).map(([key, delta]) => {
                            if (!delta) return null;
                            const label =
                              activeVariableMeta.find((m) => m.key === key)
                                ?.label ?? key;
                            return (
                              <span key={key}>
                                {label}{' '}
                                <strong className="text-[#DED9CE]">
                                  {delta > 0 ? `+${delta}` : delta}
                                </strong>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* 4. SAVE & LOAD */}
          {activeModal === 'save' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-[#A5A29A]">
                진행 상황은 브라우저 로컬 저장소에 보관됩니다. 자동 저장 외에 3개의 수동
                기록 슬롯을 사용할 수 있습니다.
              </p>

              {saveToast && (
                <div className="p-3 bg-[#1B1E23] border border-[#8E8677] text-xs sm:text-sm text-[#ECE9E2]">
                  {saveToast}
                </div>
              )}

              <div className="p-4 bg-[#111316] border border-[#2F333B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-[#A49B8C]">자동 저장</p>
                  {autoSave ? (
                    <>
                      <p className="text-sm font-medium text-[#F1EEE8]">
                        {OCCUPATIONS_BY_ID[autoSave.occupation]?.name} · 제
                        {autoSave.chapter}장 · {autoSave.locationName}
                      </p>
                      <p className="text-xs font-data text-[#89867F]">
                        {new Date(autoSave.savedAt).toLocaleString('ko-KR')}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-[#7E7C76]">저장된 자동 기록 없음</p>
                  )}
                </div>
                {autoSave && (
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSlot(autoSave);
                      onClose();
                    }}
                    className="min-h-[42px] px-4 py-2 bg-[#1D2026] hover:bg-[#272B33] text-[#F1EEE8] border border-[#444954] text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    불러오기
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {SLOT_IDS.map((slotId, index) => {
                  const slot = manualSlots[slotId];
                  const canSaveNow = Boolean(
                    state.occupation && state.screen !== 'TITLE'
                  );
                  return (
                    <div
                      key={slotId}
                      className="p-4 bg-[#111316] border border-[#292D34] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs text-[#928F88]">
                          수동 슬롯 0{index + 1}
                        </p>
                        {slot ? (
                          <>
                            <p className="text-sm font-medium text-[#F1EEE8]">
                              {OCCUPATIONS_BY_ID[slot.occupation]?.name} · 제
                              {slot.chapter}장 · {slot.locationName}
                            </p>
                            <p className="text-xs font-data text-[#89867F]">
                              {new Date(slot.savedAt).toLocaleString('ko-KR')}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-[#73716B]">비어 있는 슬롯</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canSaveNow && (
                          <button
                            type="button"
                            onClick={() => handleManualSave(slotId)}
                            className="min-h-[40px] px-3.5 py-1.5 bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] border border-[#96453F] text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Save className="w-3.5 h-3.5" />
                            저장하기
                          </button>
                        )}
                        {slot && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onLoadSlot(slot);
                                onClose();
                              }}
                              className="min-h-[40px] px-3.5 py-1.5 bg-[#1D2026] hover:bg-[#272B33] text-[#F1EEE8] border border-[#444954] text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5" />
                              불러오기
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSlot(slotId)}
                              aria-label={`슬롯 ${index + 1} 삭제`}
                              className="min-h-[40px] px-2.5 py-1.5 bg-[#17191D] hover:bg-[#2A1C1C] text-[#BFA09C] border border-[#3B3030] text-xs flex items-center cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. SETTINGS */}
          {activeModal === 'settings' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#F1EEE8]">대화 출력 속도</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ['slow', '느리게'],
                      ['normal', '보통'],
                      ['fast', '빠르게'],
                      ['instant', '즉시 표시'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, textSpeed: val })
                      }
                      className={`min-h-[44px] px-3 py-2 text-sm border transition-colors cursor-pointer whitespace-nowrap ${
                        settings.textSpeed === val
                          ? 'bg-[#E3DFD6] text-[#14161A] border-[#E3DFD6] font-semibold'
                          : 'bg-[#111316] text-[#C8C4BC] border-[#2E323A] hover:border-[#515763]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-[#F1EEE8]">
                    화면 비율 (PC · 태블릿 · 모바일 맞춤)
                  </p>
                  <p className="text-xs text-[#8E8B84] mt-0.5">
                    기기에 맞게 전체 화면 맞춤, 16:9 와이드, 4:3 태블릿, 세로 분할 중 선택할 수 있습니다.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ['auto', '자동 맞춤'],
                      ['16:9', '16:9 와이드'],
                      ['4:3', '4:3 태블릿'],
                      ['portrait', '세로 분할'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, displayRatio: val })
                      }
                      className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm border transition-colors cursor-pointer whitespace-nowrap ${
                        settings.displayRatio === val
                          ? 'bg-[#E3DFD6] text-[#14161A] border-[#E3DFD6] font-semibold'
                          : 'bg-[#111316] text-[#C8C4BC] border-[#2E323A] hover:border-[#515763]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#F1EEE8]">
                  대화 글자 크기 (모바일 가독성 조절)
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  {(
                    [
                      ['normal', '기본 크기'],
                      ['large', '크게 보기'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, textSize: val })
                      }
                      className={`min-h-[44px] px-3 py-2 text-sm border transition-colors cursor-pointer whitespace-nowrap ${
                        settings.textSize === val
                          ? 'bg-[#E3DFD6] text-[#14161A] border-[#E3DFD6] font-semibold'
                          : 'bg-[#111316] text-[#C8C4BC] border-[#2E323A] hover:border-[#515763]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3.5 border-y border-[#292D34]">
                <div>
                  <p className="text-sm font-semibold text-[#F1EEE8]">효과음</p>
                  <p className="text-xs text-[#8E8B84]">
                    대화 넘김, 선택지 결정, 사료 열람 시 효과음을 재생합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      soundEnabled: !settings.soundEnabled,
                    })
                  }
                  className={`min-h-[44px] px-4 py-2 text-sm border flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                    settings.soundEnabled
                      ? 'bg-[#1F2228] text-[#F1EEE8] border-[#9E9586]'
                      : 'bg-[#111316] text-[#7E7C76] border-[#292D34]'
                  }`}
                >
                  {settings.soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#B2A999]" />
                      켜짐
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      꺼짐
                    </>
                  )}
                </button>
              </div>

              {state.screen !== 'TITLE' && (
                <div className="pt-2">
                  {!confirmTitleReturn ? (
                    <button
                      type="button"
                      onClick={() => setConfirmTitleReturn(true)}
                      className="min-h-[44px] px-4 py-2 bg-[#16181C] hover:bg-[#261B1B] text-[#D8B2AC] border border-[#4E3230] text-sm font-medium flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Home className="w-4 h-4" />
                      메인 메뉴로 돌아가기
                    </button>
                  ) : (
                    <div className="p-4 bg-[#191516] border border-[#6E3631] space-y-3">
                      <p className="text-xs sm:text-sm text-[#DFDCD5]">
                        현재 상태는 자동 저장되어 있습니다. 메인 메뉴로 이동하시겠습니까?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onReturnToTitle();
                          }}
                          className="min-h-[40px] px-4 py-1.5 bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] text-sm font-medium cursor-pointer"
                        >
                          메인 메뉴로 이동
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmTitleReturn(false)}
                          className="min-h-[40px] px-4 py-1.5 bg-[#15171A] text-[#C6C2B9] border border-[#32363E] text-sm cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. PLAYTHROUGH RECORDS */}
          {activeModal === 'records' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#292D34]">
                <p className="text-xs sm:text-sm text-[#B8B4AC]">
                  완료한 회차와 도달한 엔딩, 당시의 선택 기록을 비교해 볼 수 있습니다.
                </p>
                <span className="font-data text-xs text-[#B2A999]">
                  수집한 엔딩 {uniqueEndedIds.size} / {ENDINGS.length}
                </span>
              </div>

              {records.length === 0 ? (
                <div className="p-8 bg-[#111316] border border-[#292D34] text-center space-y-1.5">
                  <p className="text-sm text-[#C8C4BC]">
                    아직 완료된 플레이 기록이 없습니다.
                  </p>
                  <p className="text-xs text-[#86837C]">
                    세 직업 중 하나를 선택해 제3장 엔딩까지 완료하면 이곳에 누적 기록됩니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((rec) => {
                    const recOcc = OCCUPATIONS_BY_ID[rec.occupation];
                    const recVarMeta = getVariableMetaForOccupation(
                      rec.occupation
                    );
                    return (
                      <article
                        key={rec.id}
                        className="p-4 bg-[#111316] border border-[#2A2E35] space-y-2.5"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div>
                            <p className="text-xs text-[#9E978B]">
                              {recOcc?.name} ({recOcc?.protagonistName}) ·{' '}
                              {rec.endingScope === 'occupation'
                                ? '직업 전용 결말'
                                : '공통 결말'}
                            </p>
                            <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                              {rec.endingTitle}
                            </h3>
                          </div>
                          <span className="font-data text-xs text-[#89867F]">
                            {new Date(rec.completedAt).toLocaleString('ko-KR')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-data text-[#B5B1A9] pt-1.5 border-t border-[#22252B]">
                          {recVarMeta.map((m) => (
                            <span key={m.key}>
                              {m.shortLabel}{' '}
                              <strong className="text-[#E2DDD2]">
                                {rec.finalVariables[m.key]}
                              </strong>
                            </span>
                          ))}
                          <span>· 열람 사료 {rec.readSourceCount}건</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 7. GAME GUIDE */}
          {activeModal === 'guide' && (
            <div className="space-y-5 text-sm text-[#C8C4BC] leading-[1.82]">
              <div className="space-y-2">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  01. 교육적 목적
                </h3>
                <p>
                  「그날, 당신의 선택」은 1940년대 식민지 조선에서 살아간 개인들의
                  선택을 단순한 선악이나 영웅·배신자의 이분법으로 재단하지 않고,
                  당시의 권력관계, 생계 조건, 공동체 갈등, 그리고 선택의 결과와
                  책임을 입체적으로 성찰하기 위해 제작된 역사교육용 비주얼 노벨입니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  02. 세 직업의 서로 다른 스토리라인
                </h3>
                <p>
                  농사꾼(최덕수 · 《빼앗긴 땅, 빼앗긴 봄》), 면서기(김진호 ·
                  《먹줄의 무게》), 순사보(최민석) 중 하나를 선택해 시작합니다.
                  농사꾼 편은 1942년 사료 F(《조선농보》)의 경작권 이전·증산
                  표창 사례에서 출발해 해방 직후 토지 문제까지 다루며, 면서기
                  편은 1944~1945년 피식민자이자 행정 실무자로서 공출·노무동원
                  명부·창씨개명과 해방 이후 책임 문제를 체험합니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  03. 마을 지도 탐색, 변수 현황 창, 사료 열람
                </h3>
                <p>
                  주요 선택에 들어가기 전, 마을 약도에서 장소를 선택해 가족·이웃·
                  면사무소·야학·주재소 인물과 대화하고 역사 사료(D–I)를 확인할
                  수 있습니다. 상단과 화면 내 「변수 현황」 버튼을 누르면 각
                  직업별 5대 변수와 인물 관계를 별도의 창에서 언제든 확인할 수
                  있습니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  04. 조작 방법 (PC · 모바일)
                </h3>
                <ul className="space-y-1 text-xs sm:text-sm text-[#B4B0A8]">
                  <li>· PC: 마우스 클릭 또는 키보드 Space / Enter(대화 진행), 숫자 1–4(선택지 결정), Esc(메뉴 닫기)</li>
                  <li>· 모바일: 대화창 터치로 진행, 세로 배치된 선택지 버튼 터치, 상단 메뉴로 언제든 사료·변수 현황·저장 접근</li>
                </ul>
              </div>
            </div>
          )}

          {/* 8. SOURCES & CREDITS */}
          {activeModal === 'credits' && (
            <div className="space-y-5 text-sm text-[#C8C4BC] leading-[1.82]">
              <div className="space-y-2">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  역사적 사실과 허구적 각색의 구분 원칙
                </h3>
                <p>
                  본 게임은 1940년대 전시총동원체제(미곡 공출, 경작권 이전·증산 표창
                  기록, 국가총동원법 및 노무동원, 창씨개명·황민화 행정, 면사무소·애국반
                  말단 행정, 조선총독부 경찰·순사보 제도, 해방 직후 관료 청산 문제)라는
                  검증된 역사적 제도와 구조를 배경으로 삼고 있습니다. 1944년 노무동원은
                  모집·관 알선·국민징용령에 따른 징용의 절차적 차이를 고려해
                  ‘노무동원 대상자 명부’를 기본 표기로 사용했습니다.
                </p>
                <p>
                  가상의 마을과 등장인물(최덕수, 최순이, 김봉수, 이재문, 오 주사,
                  박만석, 김진호, 박태수, 이정수, 오 면장, 최민석, 사토 순사부장,
                  윤선생 등) 및 구체적 대사·가족 피해는 교육적 시뮬레이션을 위한
                  허구적 각색입니다. 또한 면서기 편의 박태수는 채만식 《치숙》의
                  화자와 동일 인물이 아니라 작품 속 자기합리화 논리를 차용한 창작
                  인물이며, 《맹순사》·《미스터 방》·《논 이야기》와 이기영의 《봄》은
                  문학적 모티브로만 참고해 실제 역사 사실과 명확히 구분했습니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  사료 D–I 수록 및 무창작 원칙
                </h3>
                <p>
                  사료 열람실의 사료 D–I 원문과 출처는 임의로 창작하거나 변조하지
                  않는 원칙을 따릅니다. 현재 각 사료 항목에는 검증된 역사적 제도
                  배경 해설과 함께, 기획자가 확정 제공하는 원문·번역문·출처를 그대로
                  교체 수록할 수 있는 JSON 데이터 구조(
                  <code className="font-data text-xs text-[#DFDAD0]">
                    src/data/sources.json
                  </code>
                  )가 적용되어 있습니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  데이터 기반 확장 구조
                </h3>
                <p className="text-xs sm:text-sm text-[#A9A59D]">
                  직업(<code className="font-data">occupations.json</code>), 인물(
                  <code className="font-data">characters.json</code>), 장소(
                  <code className="font-data">locations.json</code>), 챕터(
                  <code className="font-data">chapters.json</code>), 사건(
                  <code className="font-data">events/*.json</code>), 사료(
                  <code className="font-data">sources.json</code>), 엔딩(
                  <code className="font-data">endings.json</code>)이 분리된 JSON 파일로
                  관리되어 핵심 엔진을 전면 수정하지 않고도 새로운 직업·사건·사료를
                  확장할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
