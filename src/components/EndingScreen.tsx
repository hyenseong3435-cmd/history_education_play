import { useState } from 'react';
import { BookOpen, Calendar, Check, Home, RotateCcw, Save } from 'lucide-react';
import { OCCUPATIONS_BY_ID } from '../data';
import { loadReflectionMemo } from '../engine/gameEngine';
import type { EndingData, GameState, TimelineTab } from '../types/game';
import { ResilientBackground } from './ResilientBackground';

interface EndingScreenProps {
  ending: EndingData;
  state: GameState;
  allOccupationsCompleted?: boolean;
  onSaveReflectionMemo: (memo: string) => void;
  onRestartOtherOccupation: () => void;
  onReturnTitle: () => void;
  onOpenSources: () => void;
  onOpenSourceById?: (sourceId: string) => void;
  onOpenTimeline: (tab?: TimelineTab) => void;
}

type EndingTab = 'summary' | 'records' | 'reflection';

const RECOMMENDED_SOURCE_LABEL: Record<string, string> = {
  source_D: '사료 D 다시 읽기',
  source_E: '사료 E 다시 읽기',
  source_F: '사료 F 다시 읽기',
  source_G: '사료 G 다시 읽기',
  source_H: '사료 H 다시 읽기',
  source_I: '사료 I 다시 읽기',
};

export function EndingScreen({
  ending,
  state,
  allOccupationsCompleted = false,
  onSaveReflectionMemo,
  onRestartOtherOccupation,
  onReturnTitle,
  onOpenSources,
  onOpenSourceById,
  onOpenTimeline,
}: EndingScreenProps) {
  const occ = state.occupation ? OCCUPATIONS_BY_ID[state.occupation] : null;
  const [activeTab, setActiveTab] = useState<EndingTab>('summary');
  const [memo, setMemo] = useState<string>(() => loadReflectionMemo(ending.id));
  const [memoSaved, setMemoSaved] = useState(false);

  const handleSaveMemo = () => {
    onSaveReflectionMemo(memo);
    setMemoSaved(true);
    window.setTimeout(() => setMemoSaved(false), 2600);
  };

  return (
    <div className="flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden bg-[#0E0F11] text-[#E6E3DC]">
      {/* Compact Hero Ending Banner */}
      <section className="relative shrink-0 w-full h-28 sm:h-36 border-b border-[#292D34] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ResilientBackground
            src={ending.background}
            alt={ending.title}
            className="w-full h-full"
            imageClassName="saturate-[0.55] brightness-[0.78]"
            overlayClassName="bg-gradient-to-t from-[#0E0F11] via-[#0E0F11]/65 to-[#0E0F11]/45"
          />
        </div>
        <div className="relative z-10 h-full max-w-6xl mx-auto px-4 sm:px-6 pb-3.5 sm:pb-4 flex flex-col justify-end">
          <p className="text-[11px] sm:text-xs text-[#A49B8C] tracking-wide mb-1">
            {ending.scope === 'occupation' ? '직업 전용 결말' : '공통 결말'}
            {occ ? ` · ${occ.name} (${occ.protagonistName})` : ''}
          </p>
          <h1 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-semibold text-[#F4F1EB] leading-tight truncate">
            {ending.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#BFBBB3] mt-0.5 truncate">
            {ending.subtitle}
          </p>
        </div>
      </section>

      {/* Clean Tab Navigation Strip */}
      <nav
        aria-label="결말 보기 탭"
        className="shrink-0 w-full border-b border-[#262930] bg-[#121417]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {(
            [
              ['summary', '01. 결말 요약'],
              ['records', '02. 나의 선택 기록'],
              ['reflection', '03. 역사 성찰 노트'],
            ] as const
          ).map(([tabKey, label]) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[#B2A999] text-[#F4F1EB]'
                    : 'border-transparent text-[#8F8D86] hover:text-[#D4D0C7]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Tab Content */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {ending.narrationLines && ending.narrationLines.length > 0 && (
              <blockquote className="p-4 sm:p-5 bg-[#131519] border border-[#2C3038] space-y-1.5">
                {ending.narrationLines.map((line, idx) => (
                  <p
                    key={idx}
                    className="font-editorial text-xs sm:text-sm text-[#ECE9E2] leading-[1.82] break-keep"
                  >
                    {line}
                  </p>
                ))}
              </blockquote>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="border-b border-[#272B32] pb-3.5 space-y-1.5">
                  <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8]">
                    01. 주인공의 최종 상황
                  </h2>
                  <p className="text-xs sm:text-sm text-[#CCC8BF] leading-[1.78] break-keep">
                    {ending.protagonistOutcome}
                  </p>
                </div>

                <div className="border-b border-[#272B32] pb-3.5 space-y-1.5">
                  <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8]">
                    02. 가족의 상황
                  </h2>
                  <p className="text-xs sm:text-sm text-[#CCC8BF] leading-[1.78] break-keep">
                    {ending.familyOutcome}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8]">
                    03. 공동체의 상황
                  </h2>
                  <p className="text-xs sm:text-sm text-[#CCC8BF] leading-[1.78] break-keep">
                    {ending.communityOutcome}
                  </p>
                </div>
              </div>

              <div className="space-y-4 md:border-l md:border-[#262930] md:pl-6">
                <div className="border-b border-[#272B32] pb-3.5 space-y-1.5">
                  <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8]">
                    04. 주요 선택의 결과
                  </h2>
                  <p className="text-xs sm:text-sm text-[#CCC8BF] leading-[1.78] break-keep">
                    {ending.choiceConsequencesSummary}
                  </p>
                  {state.triggeredDelayedEffects.length > 0 && (
                    <div className="pt-2 space-y-1 text-xs text-[#A49B8C]">
                      <p className="font-semibold text-[#D69D96]">
                        시간이 지나 드러난 선택의 흔적:
                      </p>
                      {state.triggeredDelayedEffects.map((eff) => (
                        <p key={eff.id} className="text-[#BAB6AE]">
                          · {eff.title}: {eff.description}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8]">
                    05. 식민지 행정체제와의 관계
                  </h2>
                  <p className="text-xs sm:text-sm text-[#CCC8BF] leading-[1.78] break-keep">
                    {ending.colonialSystemRelation}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'records' && (
          <section className="max-w-4xl mx-auto space-y-4">
            <div className="archival-panel p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2E35] pb-3">
                <div className="space-y-0.5">
                  <h2 className="font-editorial text-lg sm:text-xl font-semibold text-[#F1EEE8]">
                    이번 회차에서 내린 선택 기록
                  </h2>
                  <p className="text-xs text-[#9C9991]">
                    선택한 모든 결정과 결말의 역사 성찰 질문은 메인 메뉴의 「플레이 기록」에 자동 보관됩니다.
                  </p>
                </div>
                <span className="text-xs text-[#B2A999] font-data">
                  주요 선택 {state.decisionLog.length}건 · 열람 사료{' '}
                  {state.readSources.length}건
                </span>
              </div>

              {state.decisionLog.length === 0 ? (
                <p className="text-sm text-[#8D8A83] py-4">
                  기록된 주요 선택이 없습니다.
                </p>
              ) : (
                <ol className="space-y-3.5">
                  {state.decisionLog.map((rec, idx) => (
                    <li
                      key={`${rec.id}-${idx}`}
                      className="p-4 bg-[#111316] border border-[#262A31] space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9E978B]">
                        <span>
                          0{idx + 1}. 제{rec.chapter}장 · {rec.eventTitle}
                        </span>
                      </div>
                      <p className="text-sm sm:text-[15px] text-[#F4F1EB] font-medium leading-snug break-keep">
                        {rec.choiceText}
                      </p>
                      <p className="text-xs sm:text-[13px] text-[#A5A29A] leading-relaxed break-keep">
                        {rec.summary}
                      </p>
                    </li>
                  ))}
                </ol>
              )}

              {state.triggeredDelayedEffects.length > 0 && (
                <div className="pt-3 border-t border-[#2A2E35] space-y-2">
                  <h3 className="font-editorial text-sm sm:text-base font-semibold text-[#EAE7E0]">
                    선택 이후 돌아온 결과들
                  </h3>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-[#C4C0B8]">
                    {state.triggeredDelayedEffects.map((eff) => (
                      <li key={eff.id} className="break-keep">
                        <strong className="text-[#D69D96]">{eff.title}</strong> —{' '}
                        {eff.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'reflection' && (
          <section className="hanji-surface p-5 sm:p-6 border border-[#BEB8AA] grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 space-y-3.5">
              <div className="border-b border-[#C9C3B6] pb-3 space-y-1">
                <p className="text-xs font-semibold text-[#6F2C27] tracking-wide">
                  역사적 성찰 질문
                </p>
                <h2 className="font-editorial text-lg sm:text-xl font-semibold text-[#1D1C19]">
                  그날의 선택을 어떻게 이해할 것인가
                </h2>
              </div>

              <ol className="space-y-3 text-sm sm:text-[15px] text-[#292723] leading-[1.78] break-keep">
                {ending.reflectionQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-data text-xs font-semibold text-[#6F2C27] mt-1 shrink-0">
                      Q{idx + 1}.
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>

              {ending.commonReflectionLines &&
                ending.commonReflectionLines.length > 0 && (
                  <div className="pt-3 border-t border-[#CFC9BC] space-y-1">
                    <p className="text-[11px] font-semibold text-[#6F2C27] tracking-wide mb-1">
                      공통 성찰
                    </p>
                    {ending.commonReflectionLines.map((line, idx) => (
                      <p
                        key={idx}
                        className="font-editorial text-xs sm:text-sm text-[#2B2823] leading-relaxed break-keep"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}

              {ending.sourceRevisitNote && (
                <div className="p-3.5 bg-[#E3DDD1] border border-[#C2BCAE] text-xs sm:text-sm text-[#2B2823] leading-relaxed break-keep">
                  {ending.sourceRevisitNote}
                </div>
              )}
            </div>

            <div className="lg:col-span-6 lg:border-l lg:border-[#CFC9BC] lg:pl-5 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="reflection-memo"
                  className="block text-xs sm:text-sm font-semibold text-[#3C3832]"
                >
                  나의 역사 성찰 메모 (플레이 기록에 함께 저장됩니다)
                </label>
                <textarea
                  id="reflection-memo"
                  rows={6}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="위 성찰 질문에 대한 자신의 생각과, 끝을 알 수 없던 식민지 시대 속에서 내린 선택의 이유를 차분히 적어 보세요."
                  className="w-full p-3.5 bg-[#FAF8F4] border border-[#BEB8AA] text-sm sm:text-[15px] text-[#1F1E1B] leading-[1.7] placeholder:text-[#868178] focus:outline-none focus:border-[#6F2C27]"
                />
                {memoSaved && (
                  <p className="text-xs text-[#6F2C27] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      선택 기록과 성찰 질문·메모가 플레이 기록에 저장되었습니다.
                    </span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (ending.recommendedSourceId && onOpenSourceById) {
                      onOpenSourceById(ending.recommendedSourceId);
                    } else {
                      onOpenSources();
                    }
                  }}
                  className="min-h-[44px] px-3.5 py-2 bg-[#E2DDD2] hover:bg-[#D5CFC2] text-[#262420] border border-[#B7B1A3] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  {(ending.recommendedSourceId &&
                    RECOMMENDED_SOURCE_LABEL[ending.recommendedSourceId]) ||
                    '관련 사료 다시 보기'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveMemo}
                  className="min-h-[44px] px-4 py-2 bg-[#1F2126] hover:bg-[#2F333B] text-[#F2EFE8] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  {memoSaved ? '기록 저장 완료' : '성찰 메모 저장'}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Pinned Bottom Action Bar */}
      <footer className="shrink-0 w-full border-t border-[#262930] bg-[#111316]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReturnTitle}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-[#15171B] hover:bg-[#1E2127] text-[#D4D0C7] border border-[#343841] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4" />
              메인 메뉴로
            </button>
            <button
              type="button"
              onClick={() =>
                onOpenTimeline(allOccupationsCompleted ? 'synthesis' : 'occupation')
              }
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-[#191C22] hover:bg-[#232730] text-[#ECE9E2] border border-[#4D525E] hover:border-[#9E9586] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-[#B2A999]" />
              {allOccupationsCompleted
                ? '종합 연표 보기 (3/3 해금)'
                : '역사 연표 보기'}
            </button>
          </div>
          <button
            type="button"
            onClick={onRestartOtherOccupation}
            className="min-h-[44px] px-5 py-2 bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] border border-[#96453F] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            다른 직업으로 같은 시대 다시 체험하기
          </button>
        </div>
      </footer>
    </div>
  );
}
