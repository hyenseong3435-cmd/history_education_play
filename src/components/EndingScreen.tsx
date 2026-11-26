import { useState } from 'react';
import { BookOpen, Home, RotateCcw, Save } from 'lucide-react';
import { OCCUPATIONS_BY_ID, getVariableMetaForOccupation } from '../data';
import { loadReflectionMemo, saveReflectionMemo } from '../engine/gameEngine';
import type { EndingData, GameState } from '../types/game';
import { ResilientBackground } from './ResilientBackground';

interface EndingScreenProps {
  ending: EndingData;
  state: GameState;
  onRestartOtherOccupation: () => void;
  onReturnTitle: () => void;
  onOpenSources: () => void;
  onOpenSourceById?: (sourceId: string) => void;
}

type EndingTab = 'summary' | 'records' | 'reflection';

export function EndingScreen({
  ending,
  state,
  onRestartOtherOccupation,
  onReturnTitle,
  onOpenSources,
  onOpenSourceById,
}: EndingScreenProps) {
  const occ = state.occupation ? OCCUPATIONS_BY_ID[state.occupation] : null;
  const variableMeta = getVariableMetaForOccupation(state.occupation);
  const [activeTab, setActiveTab] = useState<EndingTab>('summary');
  const [memo, setMemo] = useState<string>(() => loadReflectionMemo(ending.id));
  const [memoSaved, setMemoSaved] = useState(false);

  const handleSaveMemo = () => {
    saveReflectionMemo(ending.id, memo);
    setMemoSaved(true);
    window.setTimeout(() => setMemoSaved(false), 2000);
  };

  return (
    <div className="flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden bg-[#0E0F11] text-[#E6E3DC]">
      {/* Compact Hero Ending Banner */}
      <section className="relative shrink-0 w-full h-28 sm:h-36 border-b border-[#292D34] overflow-hidden">
        <ResilientBackground
          src={ending.background}
          alt={ending.title}
          className="w-full h-full"
          imageClassName="saturate-[0.55] brightness-[0.78]"
          overlayClassName="bg-gradient-to-t from-[#0E0F11] via-[#0E0F11]/65 to-[#0E0F11]/45"
        />
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
              ['records', '02. 선택 기록 및 지표'],
              ['reflection', '03. 역사 성찰 노트'],
            ] as const
          ).map(([tabKey, label]) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`min-h-[42px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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

      {/* Active Tab Content (Fits Desktop Screen, Internal Scroll Fallback on Small Viewports) */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {ending.narrationLines && ending.narrationLines.length > 0 && (
              <blockquote className="p-4 sm:p-5 bg-[#131519] border-l-2 border-[#9E9586] border-y border-r border-y-[#262930] border-r-[#262930] space-y-1.5">
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
                      누적된 지연 결과:
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
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Final 5 Variables */}
            <div className="lg:col-span-5 p-4 sm:p-5 bg-[#14161A] border border-[#2B2F36] space-y-3.5 self-start">
              <div>
                <h2 className="font-editorial text-base font-semibold text-[#F1EEE8]">
                  최종 5대 지표 현황
                </h2>
                <p className="text-xs text-[#8D8A83] mt-0.5">
                  도덕적 점수가 아니라 선택이 남긴 사회적·구조적 흔적입니다.
                </p>
              </div>
              <div className="space-y-2.5">
                {variableMeta.map((meta) => {
                  const val = state.variables[meta.key];
                  return (
                    <div key={meta.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#D4D0C7]">{meta.label}</span>
                        <span className="font-data text-[#B2A999]">
                          {val} / 100
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0E1013] border border-[#2B2F36]">
                        <div
                          className="h-full bg-[#9E9586]"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decision History */}
            <div className="lg:col-span-7 archival-panel p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2E35] pb-2.5">
                <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8]">
                  당신의 선택 기록
                </h2>
                <span className="text-xs text-[#98958E] font-data">
                  주요 선택 {state.decisionLog.length}건 · 열람 사료{' '}
                  {state.readSources.length}건
                </span>
              </div>

              {state.decisionLog.length === 0 ? (
                <p className="text-sm text-[#8D8A83]">
                  기록된 주요 선택이 없습니다.
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {state.decisionLog.map((rec, idx) => (
                    <li
                      key={`${rec.id}-${idx}`}
                      className="pb-2.5 border-b border-[#23272D] last:border-b-0 last:pb-0 space-y-0.5"
                    >
                      <p className="text-[11px] text-[#9E978B]">
                        제{rec.chapter}장 · {rec.eventTitle}
                      </p>
                      <p className="text-xs sm:text-sm text-[#EFECE6] font-medium">
                        {rec.choiceText}
                      </p>
                      <p className="text-xs text-[#9C9991]">{rec.summary}</p>
                    </li>
                  ))}
                </ol>
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

              <ol className="space-y-2.5 text-xs sm:text-sm text-[#292723] leading-[1.75] break-keep">
                {ending.reflectionQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-data text-xs font-semibold text-[#6F2C27] mt-0.5">
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
                        className="font-editorial text-xs sm:text-[13px] text-[#2B2823] leading-relaxed break-keep"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}

              {ending.sourceRevisitNote && (
                <div className="p-3 bg-[#E3DDD1] border border-[#C2BCAE] text-xs text-[#2B2823] leading-relaxed break-keep">
                  {ending.sourceRevisitNote}
                </div>
              )}
            </div>

            <div className="lg:col-span-6 lg:border-l lg:border-[#CFC9BC] lg:pl-5 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="reflection-memo"
                  className="block text-xs font-semibold text-[#45413B]"
                >
                  나의 역사 성찰 메모 (브라우저에 로컬 저장됨)
                </label>
                <textarea
                  id="reflection-memo"
                  rows={5}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="선택을 내리며 느낀 갈등, 당시 사회적 조건과 개인의 책임에 대한 생각을 차분히 기록해 보세요."
                  className="w-full p-3 bg-[#F6F3EC] border border-[#BEB8AA] text-sm text-[#1F1E1B] placeholder:text-[#868178] focus:outline-none focus:border-[#6F2C27]"
                />
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
                  className="min-h-[40px] px-3.5 py-1.5 bg-[#E2DDD2] hover:bg-[#D5CFC2] text-[#262420] border border-[#B7B1A3] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  {ending.recommendedSourceId === 'source_F'
                    ? '사료 F 다시 읽기'
                    : ending.recommendedSourceId === 'source_I'
                    ? '사료 I 다시 읽기'
                    : ending.recommendedSourceId === 'source_E'
                    ? '사료 E 다시 읽기'
                    : '관련 사료 다시 보기'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveMemo}
                  className="min-h-[40px] px-4 py-1.5 bg-[#1F2126] hover:bg-[#2F333B] text-[#F2EFE8] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  {memoSaved ? '메모 저장됨' : '성찰 메모 저장'}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Pinned Bottom Action Bar */}
      <footer className="shrink-0 w-full border-t border-[#262930] bg-[#111316]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onReturnTitle}
            className="min-h-[42px] px-4 py-2 bg-[#15171B] hover:bg-[#1E2127] text-[#D4D0C7] border border-[#343841] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            메인 메뉴로
          </button>
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
