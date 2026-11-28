import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Home,
  Save,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ENDINGS, OCCUPATIONS_BY_ID } from '../data';
import { loadReflectionMemo } from '../engine/gameEngine';
import type {
  GameSettings,
  GameState,
  PlaythroughRecord,
  SaveSlotData,
} from '../types/game';
import { SourceArchivePanel } from './SourceArchivePanel';
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
  sources: '사료 자료실',
  save: '저장 및 불러오기',
  settings: '환경 설정',
  records: '플레이 기록',
  guide: '게임 설명',
  credits: '사료 자료실 · 전체 열람',
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
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [confirmTitleReturn, setConfirmTitleReturn] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  useEffect(() => {
    setConfirmTitleReturn(false);
    setSaveToast(null);
    if (activeModal === 'records' && records.length > 0) {
      setExpandedRecordId(records[0].id);
    } else {
      setExpandedRecordId(null);
    }
  }, [activeModal, records]);

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

  const handleManualSave = (slotId: string) => {
    onSaveSlot(slotId);
    setSaveToast('현재 진행 상황이 브라우저에 저장되었습니다.');
    window.setTimeout(() => setSaveToast(null), 2200);
  };

  const uniqueEndedIds = new Set(records.map((r) => r.endingId));
  const isWideArchiveModal =
    activeModal === 'sources' || activeModal === 'credits';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-2.5 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={MODAL_TITLES[activeModal]}
      onClick={onClose}
    >
      <div
        className={`w-full ${
          isWideArchiveModal ? 'max-w-6xl' : 'max-w-4xl'
        } max-h-[90dvh] bg-[#15171A] border border-[#343841] flex flex-col overflow-hidden shadow-2xl`}
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
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#A8A49C] hover:text-[#F4F1EB] hover:bg-[#1F2228] border border-transparent hover:border-[#393E48] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* 1. HISTORICAL SOURCES ARCHIVE */}
          {activeModal === 'sources' && (
            <SourceArchivePanel
              initialSourceId={initialSourceId}
              state={state}
              onMarkSourceRead={onMarkSourceRead}
            />
          )}

          {/* 2. SAVE & LOAD */}
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
                    className="min-h-[44px] px-4 py-2 bg-[#1D2026] hover:bg-[#272B33] text-[#F1EEE8] border border-[#444954] text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
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
                            className="min-h-[44px] px-3.5 py-2 bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] border border-[#96453F] text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
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
                              className="min-h-[44px] px-3.5 py-2 bg-[#1D2026] hover:bg-[#272B33] text-[#F1EEE8] border border-[#444954] text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5" />
                              불러오기
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSlot(slotId)}
                              aria-label={`슬롯 ${index + 1} 삭제`}
                              className="min-h-[44px] px-3 py-2 bg-[#17191D] hover:bg-[#2A1C1C] text-[#BFA09C] border border-[#3B3030] text-xs flex items-center cursor-pointer"
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

          {/* 3. SETTINGS */}
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
                          className="min-h-[44px] px-4 py-2 bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] text-sm font-medium cursor-pointer"
                        >
                          메인 메뉴로 이동
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmTitleReturn(false)}
                          className="min-h-[44px] px-4 py-2 bg-[#15171A] text-[#C6C2B9] border border-[#32363E] text-sm cursor-pointer"
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

          {/* 4. PLAYTHROUGH RECORDS (Post-Game Saved Choices + Reflection Questions & Memo) */}
          {activeModal === 'records' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#292D34]">
                <p className="text-xs sm:text-sm text-[#B8B4AC] break-keep">
                  게임을 마친 회차의 결말과 당시 선택한 선택지, 역사 성찰 질문 및 나의 성찰 메모가 저장됩니다.
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
                    세 직업 중 하나를 선택해 엔딩까지 완료하면 선택한 선택지와 성찰 질문이 이곳에 저장됩니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {records.map((rec) => {
                    const recOcc = OCCUPATIONS_BY_ID[rec.occupation];
                    const isExpanded = expandedRecordId === rec.id;
                    const endingDef = ENDINGS.find((e) => e.id === rec.endingId);
                    const reflectionQuestions =
                      rec.reflectionQuestions && rec.reflectionQuestions.length > 0
                        ? rec.reflectionQuestions
                        : endingDef?.reflectionQuestions ?? [];
                    const savedMemo =
                      typeof rec.reflectionMemo === 'string' &&
                      rec.reflectionMemo.trim().length > 0
                        ? rec.reflectionMemo
                        : loadReflectionMemo(rec.endingId);

                    return (
                      <article
                        key={rec.id}
                        className="bg-[#111316] border border-[#2A2E35] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRecordId((prev) =>
                              prev === rec.id ? null : rec.id
                            )
                          }
                          aria-expanded={isExpanded}
                          className="w-full p-4 sm:p-5 text-left hover:bg-[#171A1F] transition-colors cursor-pointer space-y-2"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-xs text-[#9E978B]">
                                {recOcc?.name} ({recOcc?.protagonistName}) ·{' '}
                                {rec.endingScope === 'occupation'
                                  ? '직업 전용 결말'
                                  : '공통 결말'}
                              </p>
                              <h3 className="font-editorial text-lg sm:text-xl font-semibold text-[#F1EEE8]">
                                {rec.endingTitle}
                              </h3>
                            </div>
                            <span className="font-data text-xs text-[#89867F] shrink-0">
                              {new Date(rec.completedAt).toLocaleString('ko-KR')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#22252B] text-xs text-[#B5B1A9]">
                            <span className="font-data">
                              선택한 결정 {rec.decisions?.length ?? rec.decisionCount}건 · 열람 사료 {rec.readSourceCount}건
                            </span>
                            <span className="text-[#CFC9BD] flex items-center gap-1">
                              <span>
                                {isExpanded
                                  ? '선택 기록 · 성찰 질문 접기'
                                  : '선택 기록 · 성찰 질문 보기'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-[#262A32] bg-[#0D0F12] space-y-5">
                            {/* Saved Choices */}
                            <div className="space-y-2.5">
                              <p className="text-xs font-semibold tracking-wider text-[#B2A999]">
                                선택한 선택지 기록
                              </p>
                              {!rec.decisions || rec.decisions.length === 0 ? (
                                <p className="text-xs text-[#86837C]">
                                  기록된 선택지가 없습니다.
                                </p>
                              ) : (
                                <ol className="space-y-2.5">
                                  {rec.decisions.map((dec, idx) => (
                                    <li
                                      key={`${dec.id}-${idx}`}
                                      className="p-3.5 bg-[#131519] border border-[#252830] space-y-1"
                                    >
                                      <p className="text-[11px] text-[#9E978B]">
                                        0{idx + 1}. 제{dec.chapter}장 · {dec.eventTitle}
                                      </p>
                                      <p className="text-sm font-medium text-[#F1EEE8] break-keep">
                                        {dec.choiceText}
                                      </p>
                                      <p className="text-xs text-[#9C9991] leading-relaxed break-keep">
                                        {dec.summary}
                                      </p>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>

                            {/* Saved Reflection Questions */}
                            {reflectionQuestions.length > 0 && (
                              <div className="space-y-2.5 pt-3 border-t border-[#22252B]">
                                <p className="text-xs font-semibold tracking-wider text-[#B2A999]">
                                  결말의 역사 성찰 질문
                                </p>
                                <ol className="space-y-2 text-xs sm:text-sm text-[#D8D4CC] leading-relaxed break-keep">
                                  {reflectionQuestions.map((q, qIdx) => (
                                    <li key={qIdx} className="flex items-start gap-2">
                                      <span className="font-data text-xs text-[#D69D96] mt-0.5 shrink-0">
                                        Q{qIdx + 1}.
                                      </span>
                                      <span>{q}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Saved Reflection Memo */}
                            <div className="space-y-2 pt-3 border-t border-[#22252B]">
                              <p className="text-xs font-semibold tracking-wider text-[#B2A999]">
                                나의 성찰 메모
                              </p>
                              {savedMemo && savedMemo.trim().length > 0 ? (
                                <p className="p-3.5 bg-[#131519] border border-[#2B2F37] text-xs sm:text-sm text-[#E6E3DC] leading-relaxed whitespace-pre-line break-keep">
                                  {savedMemo}
                                </p>
                              ) : (
                                <p className="text-xs text-[#838079]">
                                  작성된 성찰 메모가 없습니다. 결말 화면의 「03. 역사 성찰 노트」에서 생각을 남길 수 있습니다.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. GAME GUIDE */}
          {activeModal === 'guide' && (
            <div className="space-y-5 text-sm text-[#C8C4BC] leading-[1.82]">
              <div className="space-y-2">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  01. 교육적 목적과 시대적 전제
                </h3>
                <p className="break-keep">
                  「그날, 당신의 선택」은 1940년대 식민지 조선에서 살아간 개인들의
                  선택을 단순한 선악이나 영웅·배신자의 이분법으로 재단하지 않고,
                  당시의 권력관계, 생계 조건, 공동체 갈등, 그리고 선택의 결과와
                  책임을 입체적으로 성찰하기 위해 제작된 역사교육용 비주얼 노벨입니다.
                  플레이어는 해방이 언제 올지 — 10년 뒤일지, 50년 뒤일지, 영원히
                  계속될지 — 알지 못한 채 눈앞의 선택을 마주하게 됩니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  02. 같은 마을, 세 직업의 시선 (1944~1945)
                </h3>
                <p className="break-keep">
                  농사꾼(최덕수 · 《빼앗긴 땅, 빼앗긴 봄》), 면서기(김진호 ·
                  《먹줄의 무게》), 순사보(강동혁 · 《녹슨 환도》) 중 하나를
                  선택해 시작합니다. 세 직업은 1944년 경상도의 같은 가상 농촌
                  마을에서 벌어진 토지 거래, 공출, 노무동원 사건을 각자의
                  자리에서 경험하며, 1945년 8월 해방 이후의 책임을 마주합니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  03. 보이지 않게 누적되는 선택과 사후 성찰 기록
                </h3>
                <p className="break-keep">
                  주요 선택에 들어가기 전, 마을 약도에서 장소를 탐색해 가족·이웃·
                  면사무소·야학·주재소 인물과 대화하고 역사 사료를 확인할 수 있습니다.
                  선택의 결과와 인물 간 관계는 게임 진행 중 수치로 드러나지 않고
                  묵시적으로 누적되어 결말을 결정하며, 이야기를 끝까지 마친 뒤
                  선택한 모든 선택지와 역사 성찰 질문이 「플레이 기록」에 저장됩니다.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#292D34]">
                <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8]">
                  04. 조작 방법 (PC · 모바일)
                </h3>
                <ul className="space-y-1 text-xs sm:text-sm text-[#B4B0A8]">
                  <li>· PC: 마우스 클릭 또는 키보드 Space / Enter(대화 진행), 숫자 1–4(선택지 결정), Esc(메뉴 닫기)</li>
                  <li>· 모바일: 대화창 터치로 진행, 세로 배치된 선택지 버튼 터치, 상단 메뉴로 언제든 연표·사료 자료실·저장 접근</li>
                </ul>
              </div>
            </div>
          )}

          {/* 6. SOURCES ARCHIVE (FULL ACCESS FROM TITLE) */}
          {activeModal === 'credits' && (
            <div className="space-y-5">
              <SourceArchivePanel
                initialSourceId={initialSourceId}
                state={state}
                unlockAll
                onMarkSourceRead={onMarkSourceRead}
              />

              <div className="p-4 sm:p-5 bg-[#111316] border border-[#343841] text-xs sm:text-sm leading-relaxed space-y-1.5">
                <p className="font-bold text-[#F4F1EB]">
                  학습 안내 · 역사적 사실과 허구적 각색의 구분 원칙
                </p>
                <p className="font-bold text-[#E6E3DC] break-keep">
                  대동아공영권 선전, 애국반·배급 통제, 《조선식량관리령》·쌀 공출,
                  《조선농보》 경작권 이전·증산 표창 사례, 국가총동원법·노무동원(모집·관알선·징용),
                  면사무소 행정과 순사보 제도는 실제 역사 사료에 기반합니다. 반면
                  가상의 마을과 등장인물(최덕수, 김진호, 강동혁, 다나카 주임, 강영수,
                  박태수, 이정수 등) 및 구체적 대사는 교육적 성찰을 위한 허구적 각색입니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
