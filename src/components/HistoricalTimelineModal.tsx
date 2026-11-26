import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Compass,
  Layers,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import { OCCUPATIONS_BY_ID, TIMELINE_DATA } from '../data';
import type {
  OccupationId,
  PlaythroughRecord,
  TimelineTab,
} from '../types/game';

interface HistoricalTimelineModalProps {
  isOpen: boolean;
  initialTab?: TimelineTab;
  initialOccupation?: OccupationId | null;
  records: PlaythroughRecord[];
  onClose: () => void;
}

const OCCUPATION_ORDER: OccupationId[] = ['farmer', 'police_assistant', 'clerk'];

export function HistoricalTimelineModal({
  isOpen,
  initialTab = 'common',
  initialOccupation = null,
  records,
  onClose,
}: HistoricalTimelineModalProps) {
  const [activeTab, setActiveTab] = useState<TimelineTab>(initialTab);
  const [selectedCommonId, setSelectedCommonId] = useState<string>(
    TIMELINE_DATA.commonEvents[0]?.id ?? ''
  );
  const [selectedOccId, setSelectedOccId] = useState<OccupationId>(
    initialOccupation ?? 'farmer'
  );

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    if (initialOccupation) {
      setSelectedOccId(initialOccupation);
    }
  }, [isOpen, initialTab, initialOccupation]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const completedOccupations = useMemo(() => {
    const map: Partial<Record<OccupationId, PlaythroughRecord>> = {};
    for (const rec of records) {
      if (!map[rec.occupation]) {
        map[rec.occupation] = rec;
      }
    }
    return map;
  }, [records]);

  const completedCount = OCCUPATION_ORDER.filter(
    (occId) => Boolean(completedOccupations[occId])
  ).length;
  const isSynthesisUnlocked = completedCount === 3;

  if (!isOpen) return null;

  const activeCommonEvent =
    TIMELINE_DATA.commonEvents.find((e) => e.id === selectedCommonId) ??
    TIMELINE_DATA.commonEvents[0];

  const activeOccTimeline =
    TIMELINE_DATA.occupationTimelines.find(
      (t) => t.occupationId === selectedOccId
    ) ?? TIMELINE_DATA.occupationTimelines[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/82 backdrop-blur-[2px] flex items-center justify-center p-2.5 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="역사 연표 및 시대적 배경"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90dvh] bg-[#14161A] border border-[#343841] flex flex-col overflow-hidden shadow-2xl text-[#E6E3DC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-[#292D34] bg-[#101215] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[11px] text-[#9E978B] tracking-wider font-data">
              1937 — 1945 · HISTORICAL TIMELINE
            </p>
            <h2 className="font-editorial text-lg sm:text-xl font-semibold text-[#F1EEE8] truncate">
              역사 연표 · 시대적 배경
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="연표 닫기"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A8A49C] hover:text-[#F4F1EB] hover:bg-[#1F2228] border border-transparent hover:border-[#393E48] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tabs */}
        <nav
          aria-label="연표 구분"
          className="shrink-0 border-b border-[#262930] bg-[#121417] px-3 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('common')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'common'
                ? 'border-[#B2A999] text-[#F4F1EB]'
                : 'border-transparent text-[#8F8D86] hover:text-[#D4D0C7]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>A. 공통 역사 연표 (1937–1945)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('occupation')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'occupation'
                ? 'border-[#B2A999] text-[#F4F1EB]'
                : 'border-transparent text-[#8F8D86] hover:text-[#D4D0C7]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>B. 직업별 개별 연표</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('synthesis')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'synthesis'
                ? 'border-[#B2A999] text-[#F4F1EB]'
                : 'border-transparent text-[#8F8D86] hover:text-[#D4D0C7]'
            }`}
          >
            {isSynthesisUnlocked ? (
              <Layers className="w-3.5 h-3.5 text-[#D8B49A]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#7E7C76]" />
            )}
            <span>C. 종합 연표 ({completedCount}/3)</span>
          </button>
        </nav>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB A: COMMON HISTORICAL TIMELINE */}
          {activeTab === 'common' && activeCommonEvent && (
            <div className="space-y-5">
              <div className="p-3.5 bg-[#111316] border border-[#282C33] text-xs sm:text-sm text-[#BDB9B0] leading-relaxed break-keep">
                세 직업군의 이야기를 동일한 연도에 억지로 맞추지 않고, 1937년 중일전쟁부터
                1945년 해방까지 전시총동원체제가 단계적으로 강화된 역사적 흐름 속에 연결해
                살펴볼 수 있습니다. (1942년 관알선 · 1943년 조선식량관리령 · 1944년 징용 확대 및
                농업생산책임제는 서로 구분되는 제도 단계입니다.)
              </div>

              {/* Occupation Activity Span Visual Band */}
              <div className="p-3.5 bg-[#101215] border border-[#262A31] space-y-2">
                <p className="text-[11px] font-semibold text-[#A49B8C] tracking-wide">
                  세 직업군의 주요 활동 시기 비교 (1942 — 1945)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TIMELINE_DATA.occupationTimelines.map((ot) => (
                    <button
                      key={ot.occupationId}
                      type="button"
                      onClick={() => {
                        setSelectedOccId(ot.occupationId);
                        setActiveTab('occupation');
                      }}
                      className="p-2.5 bg-[#16191E] hover:bg-[#1E2229] border border-[#2D3139] hover:border-[#7E7668] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#F1EEE8]">
                          {ot.occupationName} · {ot.protagonistName}
                        </span>
                        <span className="font-data text-[11px] text-[#D4A79A]">
                          {ot.periodLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9E9B94] mt-1 truncate">
                        {ot.storyTitle}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Horizontal Interactive Timeline Track (md+) */}
              <div className="hidden md:block space-y-4">
                <div className="relative pt-2 pb-1">
                  <div
                    className="absolute left-6 right-6 top-6 h-px bg-[#363B44]"
                    aria-hidden="true"
                  />
                  <div className="grid grid-cols-7 gap-1.5 relative z-10">
                    {TIMELINE_DATA.commonEvents.map((ev) => {
                      const isSelected = ev.id === activeCommonEvent.id;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedCommonId(ev.id)}
                          className={`p-2 text-center border transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#202329] border-[#B2A999] text-[#F4F1EB]'
                              : 'bg-[#121417] border-[#282C33] hover:border-[#515763] text-[#A9A59D]'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full border ${
                              isSelected
                                ? 'bg-[#9E453D] border-[#E8D5D2]'
                                : 'bg-[#252931] border-[#666B75]'
                            }`}
                          />
                          <span className="font-data text-xs font-semibold">
                            {ev.year}
                          </span>
                          <span className="text-[11px] leading-tight line-clamp-2 break-keep">
                            {ev.shortTitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Common Event Detail Card */}
                <article className="hanji-surface p-5 sm:p-6 border border-[#BDB7A9] space-y-4">
                  <header className="border-b border-[#C8C2B5] pb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-data text-xs font-semibold text-[#6F2C27]">
                        {activeCommonEvent.dateLabel} · 실제 역사적 사건
                      </p>
                      <h3 className="font-editorial text-xl font-semibold text-[#1C1B18] mt-0.5">
                        {activeCommonEvent.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {activeCommonEvent.relatedOccupations.map((occId) => (
                        <span
                          key={occId}
                          className="px-2 py-0.5 bg-[#E2DDD1] border border-[#BEB8AA] text-[11px] font-medium text-[#2D2A26]"
                        >
                          {OCCUPATIONS_BY_ID[occId]?.name}
                        </span>
                      ))}
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-[#262420] leading-[1.78]">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#6F2C27]">
                        역사적 배경
                      </p>
                      <p className="break-keep">{activeCommonEvent.background}</p>
                    </div>
                    <div className="space-y-2 lg:border-l lg:border-[#CFC9BC] lg:pl-4">
                      <p className="text-xs font-bold text-[#444039]">
                        조선인에게 미친 영향
                      </p>
                      <p className="break-keep">
                        {activeCommonEvent.impactOnKoreans}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#CFC9BC] space-y-2">
                    <p className="text-xs font-bold text-[#444039]">
                      직업군별 차별화된 영향
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {activeCommonEvent.relatedOccupations.map((occId) => (
                        <div
                          key={occId}
                          className="p-3 bg-[#F5F2EB] border border-[#CCC6B9] space-y-1"
                        >
                          <p className="text-xs font-semibold text-[#6F2C27]">
                            {OCCUPATIONS_BY_ID[occId]?.name} (
                            {OCCUPATIONS_BY_ID[occId]?.protagonistName})
                          </p>
                          <p className="text-xs text-[#2D2A26] leading-relaxed break-keep">
                            {activeCommonEvent.occupationImpacts[occId]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="p-2.5 bg-[#E3DDD1] border border-[#C2BCAE] text-xs text-[#2B2823] leading-relaxed">
                    {activeCommonEvent.factVsFictionNote}
                  </p>
                </article>
              </div>

              {/* Mobile Vertical Timeline (< md) */}
              <div className="md:hidden space-y-3 border-l-2 border-[#343841] pl-3.5 ml-1.5">
                {TIMELINE_DATA.commonEvents.map((ev) => {
                  const isOpenItem = ev.id === activeCommonEvent.id;
                  return (
                    <div key={ev.id} className="relative">
                      <span
                        className={`absolute -left-[21px] top-3 w-3 h-3 rounded-full border ${
                          isOpenItem
                            ? 'bg-[#9E453D] border-[#F1EEE8]'
                            : 'bg-[#1D2026] border-[#666B75]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedCommonId(ev.id)}
                        className={`w-full p-3 text-left border transition-colors cursor-pointer ${
                          isOpenItem
                            ? 'bg-[#1D2026] border-[#B2A999]'
                            : 'bg-[#121417] border-[#282C33]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-data text-xs font-semibold text-[#D69D96]">
                            {ev.dateLabel}
                          </span>
                          <span className="text-[11px] text-[#9E9B94]">
                            {ev.relatedOccupations
                              .map((id) => OCCUPATIONS_BY_ID[id]?.name)
                              .join(' · ')}
                          </span>
                        </div>
                        <p className="font-editorial text-sm font-semibold text-[#F1EEE8] mt-1">
                          {ev.title}
                        </p>
                      </button>

                      {isOpenItem && (
                        <div className="hanji-surface p-3.5 border-x border-b border-[#BDB7A9] space-y-2.5 text-xs text-[#262420] leading-relaxed">
                          <p className="break-keep">
                            <strong className="text-[#6F2C27]">배경: </strong>
                            {ev.background}
                          </p>
                          <p className="break-keep">
                            <strong className="text-[#444039]">영향: </strong>
                            {ev.impactOnKoreans}
                          </p>
                          <div className="space-y-1.5 pt-1.5 border-t border-[#CFC9BC]">
                            {ev.relatedOccupations.map((occId) => (
                              <p key={occId} className="break-keep">
                                <strong className="text-[#6F2C27]">
                                  · {OCCUPATIONS_BY_ID[occId]?.name}:{' '}
                                </strong>
                                {ev.occupationImpacts[occId]}
                              </p>
                            ))}
                          </div>
                          <p className="text-[11px] text-[#4C473F] bg-[#E3DDD1] p-2 border border-[#C2BCAE]">
                            {ev.factVsFictionNote}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB B: OCCUPATION-SPECIFIC TIMELINES */}
          {activeTab === 'occupation' && activeOccTimeline && (
            <div className="space-y-5">
              {/* Occupation Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TIMELINE_DATA.occupationTimelines.map((ot) => {
                  const isSelected = ot.occupationId === activeOccTimeline.occupationId;
                  const done = Boolean(completedOccupations[ot.occupationId]);
                  return (
                    <button
                      key={ot.occupationId}
                      type="button"
                      onClick={() => setSelectedOccId(ot.occupationId)}
                      className={`p-3 text-left border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#202329] border-[#B2A999] text-[#F4F1EB]'
                          : 'bg-[#121417] border-[#292D34] hover:border-[#4D535E] text-[#B8B4AC]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-editorial text-sm font-semibold">
                          {ot.occupationName} · {ot.protagonistName}
                        </span>
                        <span className="font-data text-[11px] text-[#D4A79A]">
                          {ot.periodLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[11px] opacity-85 truncate">
                          {ot.storyTitle}
                        </span>
                        {done && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#A49B8C] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Occupation Context Header */}
              <section className="p-4 bg-[#111316] border border-[#2B2F36] space-y-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-data text-xs text-[#D69D96]">
                      활동 시기: {activeOccTimeline.periodLabel}
                    </p>
                    <h3 className="font-editorial text-xl font-semibold text-[#F1EEE8]">
                      {activeOccTimeline.occupationName} ({activeOccTimeline.protagonistName},{' '}
                      {activeOccTimeline.protagonistAge}세) — {activeOccTimeline.storyTitle}
                    </h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#CFCBC2] leading-relaxed break-keep">
                  {activeOccTimeline.perspectiveSummary}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-[#24272D] text-xs">
                  <div>
                    <span className="text-[#9E978B] font-semibold">
                      경험하는 통치 방식:{' '}
                    </span>
                    <span className="text-[#DFDCD5]">
                      {activeOccTimeline.colonialRuleMode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9E978B] font-semibold">
                      역사적 연결 맥락:{' '}
                    </span>
                    <span className="text-[#C8C4BC] break-keep">
                      {activeOccTimeline.continuityNote}
                    </span>
                  </div>
                </div>
              </section>

              {/* Occupation Entries with Fact vs Game Event Labels */}
              <ol className="space-y-3 border-l-2 border-[#343841] pl-4 ml-1.5">
                {activeOccTimeline.entries.map((entry) => {
                  const isFact = entry.kind === 'historical_background';
                  return (
                    <li
                      key={entry.id}
                      className="relative p-3.5 sm:p-4 bg-[#17191E] border border-[#2C3037] space-y-1.5"
                    >
                      <span
                        className={`absolute -left-[23px] top-4 w-3 h-3 rounded-full border ${
                          isFact
                            ? 'bg-[#B2A999] border-[#F1EEE8]'
                            : 'bg-[#7A2E29] border-[#E8D5D2]'
                        }`}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-data text-xs text-[#B2A999]">
                          {entry.period}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-medium border ${
                            isFact
                              ? 'bg-[#22252B] border-[#5B564D] text-[#E6E2DA]'
                              : 'bg-[#261818] border-[#7A2E29] text-[#E8C5BF]'
                          }`}
                        >
                          {isFact ? '역사적 배경 (사실)' : '게임 속 사건 (허구 각색)'}
                        </span>
                      </div>
                      <h4 className="font-editorial text-base font-semibold text-[#F1EEE8]">
                        {entry.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#C8C4BC] leading-relaxed break-keep">
                        {entry.summary}
                      </p>
                      {entry.connectionNote && (
                        <p className="text-xs text-[#A49B8C] pt-1 border-t border-[#25282E]">
                          · 다른 직업과의 연결: {entry.connectionNote}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>

              {/* Shared Structure Explanation */}
              <div className="p-4 bg-[#111316] border border-[#282C33] space-y-1.5">
                <p className="text-xs font-semibold text-[#B2A999]">
                  세 직업군 시기가 서로 다른 이유와 구조적 연결
                </p>
                <ul className="space-y-1 text-xs text-[#B5B1A9] leading-relaxed">
                  {TIMELINE_DATA.sharedStructureNotes.map((note, idx) => (
                    <li key={idx} className="break-keep">
                      · {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB C: SYNTHESIS TIMELINE (UNLOCKED AT 3/3) */}
          {activeTab === 'synthesis' && (
            <div className="space-y-5">
              {!isSynthesisUnlocked ? (
                <div className="p-6 sm:p-8 bg-[#111316] border border-[#2D3139] text-center space-y-4">
                  <Lock className="w-8 h-8 mx-auto text-[#9E9586]" />
                  <div className="space-y-1.5 max-w-lg mx-auto">
                    <p className="font-data text-xs text-[#D69D96]">
                      세 직업군 완료 진행도 · {completedCount} / 3
                    </p>
                    <h3 className="font-editorial text-xl font-semibold text-[#F1EEE8]">
                      「{TIMELINE_DATA.synthesisSummary.title}」
                    </h3>
                    <p className="text-xs sm:text-sm text-[#B5B1A9] leading-relaxed break-keep">
                      농사꾼(1942~1945), 순사보(1943~1945), 면서기(1944~1945) 세 직업의
                      이야기를 모두 끝까지 체험하면, 서로 다른 시기와 자리에 놓였던 세 삶을
                      하나의 식민지 지배 구조로 비교하는 종합 연표가 해금됩니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl mx-auto pt-2">
                    {OCCUPATION_ORDER.map((occId) => {
                      const occ = OCCUPATIONS_BY_ID[occId];
                      const rec = completedOccupations[occId];
                      return (
                        <div
                          key={occId}
                          className={`p-3 border text-left ${
                            rec
                              ? 'bg-[#191D1F] border-[#8E8677]'
                              : 'bg-[#14161A] border-[#282C33]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#F1EEE8]">
                              {occ.name} ({occ.protagonistName})
                            </span>
                            {rec ? (
                              <CheckCircle2 className="w-4 h-4 text-[#B2A999]" />
                            ) : (
                              <span className="text-[11px] text-[#7E7C76]">미완료</span>
                            )}
                          </div>
                          <p className="font-data text-[11px] text-[#9E978B] mt-0.5">
                            {occ.activePeriod}
                          </p>
                          <p className="text-[11px] text-[#C4C0B8] mt-1 truncate">
                            {rec ? rec.endingTitle : '엔딩 도달 시 기록됨'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-5 bg-[#191616] border border-[#7A2E29] space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#E4C2BC]">
                      <Sparkles className="w-4 h-4" />
                      <span>세 직업군 모두 완료 · 종합 연표 해금됨</span>
                    </div>
                    <h3 className="font-editorial text-2xl font-semibold text-[#F4F1EB]">
                      「{TIMELINE_DATA.synthesisSummary.title}」
                    </h3>
                    <p className="text-xs sm:text-sm text-[#CFCBC2]">
                      {TIMELINE_DATA.synthesisSummary.subtitle}
                    </p>
                  </div>

                  {/* Comparative 3-Occupation Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TIMELINE_DATA.occupationTimelines.map((ot) => {
                      const rec = completedOccupations[ot.occupationId];
                      return (
                        <div
                          key={ot.occupationId}
                          className="p-4 bg-[#111316] border border-[#2E323A] flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-editorial text-base font-semibold text-[#F1EEE8]">
                                {ot.occupationName} · {ot.protagonistName}
                              </span>
                              <span className="font-data text-xs text-[#D69D96]">
                                {ot.periodLabel}
                              </span>
                            </div>
                            <p className="text-xs text-[#B2A999]">
                              {ot.colonialRuleMode}
                            </p>
                            <p className="text-xs text-[#C4C0B8] leading-relaxed break-keep">
                              {ot.perspectiveSummary}
                            </p>
                          </div>
                          {rec && (
                            <div className="pt-2.5 border-t border-[#25282E] space-y-0.5">
                              <p className="text-[11px] text-[#8F8D86]">
                                당신이 도달한 결말
                              </p>
                              <p className="text-xs font-semibold text-[#EFECE6]">
                                {rec.endingTitle}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Common Institutional Background & Links */}
                  <div className="hanji-surface p-5 border border-[#BDB7A9] space-y-4 text-xs sm:text-sm text-[#262420]">
                    <div className="space-y-1.5">
                      <p className="font-bold text-[#6F2C27]">
                        공통된 식민지 제도 배경
                      </p>
                      <ul className="space-y-1 leading-relaxed">
                        {TIMELINE_DATA.synthesisSummary.commonInstitutionalBackground.map(
                          (line, i) => (
                            <li key={i} className="break-keep">
                              · {line}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-[#CFC9BC]">
                      <p className="font-bold text-[#444039]">
                        하나의 구조로 연결된 세 삶
                      </p>
                      <ul className="space-y-1 leading-relaxed">
                        {TIMELINE_DATA.synthesisSummary.crossOccupationLinks.map(
                          (line, i) => (
                            <li key={i} className="break-keep">
                              · {line}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <blockquote className="p-3.5 bg-[#E3DDD1] border-l-2 border-[#6F2C27] font-editorial text-sm text-[#1E1C19] leading-relaxed">
                      {TIMELINE_DATA.synthesisSummary.finalQuestion}
                    </blockquote>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
