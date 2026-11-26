import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Check } from 'lucide-react';
import { OCCUPATIONS, getVariableMetaForOccupation } from '../data';
import type { OccupationId } from '../types/game';
import { PixelSprite } from './PixelSprite';
import { ResilientBackground } from './ResilientBackground';

interface OccupationSelectScreenProps {
  step: 'PROLOGUE' | 'OCCUPATION_SELECT';
  onProceedToSelect: () => void;
  onSelectOccupation: (id: OccupationId) => void;
  onBackToTitle: () => void;
  onOpenTimeline: (occId?: OccupationId) => void;
}

export function OccupationSelectScreen({
  step,
  onProceedToSelect,
  onSelectOccupation,
  onBackToTitle,
  onOpenTimeline,
}: OccupationSelectScreenProps) {
  const [selectedId, setSelectedId] = useState<OccupationId>('farmer');
  const activeOcc =
    OCCUPATIONS.find((o) => o.id === selectedId) ?? OCCUPATIONS[0];
  const activeVariableMeta = getVariableMetaForOccupation(activeOcc.id);

  if (step === 'PROLOGUE') {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-[#0E0F11]">
        <div className="absolute inset-0 z-0">
          <ResilientBackground
            src="/assets/aistudio/Retro_pixel_art_village_scene_9b628550_aea43340.jpg"
            alt="1940년대 식민지 조선 농촌 전경"
            className="w-full h-full"
            imageClassName="saturate-[0.55] brightness-[0.75]"
            overlayClassName="bg-[#0E0F11]/86"
          />
        </div>

        <main className="relative z-10 flex-1 min-h-0 w-full max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col justify-center overflow-hidden">
          <div className="archival-panel p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 max-h-full overflow-y-auto">
            <div className="space-y-1.5 border-b border-[#2B2F36] pb-3.5 shrink-0">
              <p className="text-xs text-[#9E978B] tracking-[0.16em]">
                시대적 배경 · 1940년대 전시총동원체제
              </p>
              <h2 className="font-editorial text-xl sm:text-3xl font-semibold text-[#F1EEE8] leading-snug">
                통제가 일상이 된 시대, 송현면의 세 자리
              </h2>
            </div>

            <div className="space-y-3 text-sm sm:text-[15px] text-[#CECAC1] leading-[1.78] break-keep">
              <p>
                1930년대 후반 중일전쟁과 1941년 태평양전쟁을 거치며 조선총독부의
                식민지 통치는 군수 물자와 인력을 동원하는{' '}
                <strong className="text-[#F1EEE8] font-semibold">
                  전시총동원체제
                </strong>
                로 전환되었습니다. 미곡 공출, 배급 통제, 애국반 조직, 그리고 노무
                동원이 마을과 가정의 일상 깊숙이 스며들었습니다.
              </p>
              <p>
                이 이야기에서 당신은 1940년대 식민지 조선의 농촌(전라북도 옥구군을
                참고한 가상 마을 및 가상의 송현면)에서 살아가는 한 사람이 되어
                해방 전후의 갈림길을 지나갑니다. 선택한 직업에 따라 사회적 위치,
                마주하는 인물, 사건을 접하는 시선과 선택지가 달라집니다.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 bg-[#121417] border border-[#2B2F36] space-y-1 text-xs sm:text-sm text-[#A7A39B]">
              <p className="font-semibold text-[#E4E0D8]">
                학습 안내 · 사실과 허구의 구분
              </p>
              <p className="leading-relaxed">
                미곡 공출, 경작권 이전·증산 표창 기록(사료 F), 국가총동원법·노무
                동원, 창씨개명 행정, 면사무소·애국반 행정망, 주재소 경찰 통제
                구조는 실제 역사적 사실에 기반합니다. 반면 가상의 마을과
                최덕수·김진호·강동혁 등의 인물 및 대화는 역사적 맥락을 이해하기
                위해 구성된 허구적 각색입니다.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBackToTitle}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-[#16181C] hover:bg-[#202329] text-[#C6C2B9] border border-[#32363E] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  메인 메뉴로
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTimeline()}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-[#181B20] hover:bg-[#22262E] text-[#DFDCD5] border border-[#444954] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4 text-[#B2A999]" />
                  역사 연표
                </button>
              </div>
              <button
                type="button"
                onClick={onProceedToSelect}
                className="min-h-[46px] px-6 py-2.5 bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] border border-[#96453F] text-sm sm:text-base font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                직업 선택하기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0E0F11] text-[#E6E3DC] flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="shrink-0 w-full border-b border-[#262930] bg-[#121417]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToTitle}
            className="min-h-[38px] px-2.5 py-1 text-xs sm:text-sm text-[#B3AFA7] hover:text-[#F1EEE8] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            메인 메뉴
          </button>
          <div className="flex items-center gap-3">
            <p className="hidden sm:block text-xs sm:text-sm text-[#8F8D86] whitespace-nowrap">
              직업 선택 · 1942~1945 식민지 조선
            </p>
            <button
              type="button"
              onClick={() => onOpenTimeline(activeOcc.id)}
              className="min-h-[34px] px-2.5 py-1 bg-[#181B20] hover:bg-[#22262E] border border-[#3B4049] hover:border-[#9E9586] text-xs text-[#DFDCD5] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B2A999]" />
              <span>역사 연표 보기</span>
            </button>
          </div>
        </div>
      </header>

      {/* Zero-Scroll Split Workspace on Desktop, Tabbed Dossier on Mobile/Tablet */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-3.5 sm:px-6 py-3 sm:py-5 flex flex-col lg:grid lg:grid-cols-12 gap-3.5 sm:gap-4 overflow-hidden">
        {/* Mobile & Tablet Horizontal 3-Tab Selector (< lg) */}
        <div className="lg:hidden shrink-0 space-y-2">
          <h2 className="font-editorial text-lg sm:text-xl font-semibold text-[#F1EEE8]">
            어느 자리에서 그날을 살아가시겠습니까?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {OCCUPATIONS.map((occ) => {
              const isSelected = occ.id === selectedId;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setSelectedId(occ.id)}
                  className={`min-h-[46px] px-2.5 py-2 text-left border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1D2026] border-[#B2A999] text-[#F4F1EB]'
                      : 'bg-[#141619] border-[#2A2E35] text-[#A8A49C] hover:border-[#474C56]'
                  }`}
                >
                  <p className="font-editorial text-xs sm:text-sm font-semibold truncate">
                    {occ.name}
                  </p>
                  <p className="text-[11px] opacity-80 truncate">
                    {occ.protagonistName} · {occ.activePeriod ?? ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Left Column: 3 Vertical Roster Cards (lg+) */}
        <section className="hidden lg:flex lg:col-span-5 flex-col min-h-0 gap-3">
          <div className="shrink-0 space-y-1">
            <p className="text-xs text-[#9E978B] tracking-[0.14em]">
              인물 및 사회적 위치 선택
            </p>
            <h2 className="font-editorial text-2xl font-semibold text-[#F1EEE8] leading-snug">
              어느 자리에서 그날을 살아가시겠습니까?
            </h2>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-2.5">
            {OCCUPATIONS.map((occ) => {
              const isSelected = occ.id === selectedId;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setSelectedId(occ.id)}
                  className={`flex-1 min-h-0 text-left transition-colors duration-150 flex overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B2A999] ${
                    isSelected
                      ? 'bg-[#1A1D22] border border-[#B2A999]'
                      : 'bg-[#141619] border border-[#2B2E35] hover:border-[#494E58]'
                  }`}
                >
                  <div className="relative w-28 xl:w-32 shrink-0 border-r border-[#272A31] overflow-hidden">
                    <ResilientBackground
                      src={occ.startBackground}
                      alt={`${occ.name} 시작 배경`}
                      className="w-full h-full"
                      imageClassName="saturate-[0.65] brightness-[0.82]"
                      overlayClassName="bg-gradient-to-t from-[#121417]/90 via-transparent to-transparent"
                    />
                    <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                      <PixelSprite
                        src={occ.portraitSprite}
                        alt={`${occ.protagonistName} 캐릭터`}
                        fallbackName={occ.protagonistName}
                        className="h-[88%] max-h-[120px] w-auto"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-between gap-1.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#9E978B]">
                          {occ.protagonistName} ({occ.age}세)
                          {occ.activePeriod && (
                            <span className="font-data text-[11px] text-[#B2A999] ml-1.5">
                              · {occ.activePeriod}
                            </span>
                          )}
                        </p>
                        {isSelected && (
                          <span className="text-[11px] text-[#E6E2DA] flex items-center gap-1 whitespace-nowrap">
                            <Check className="w-3.5 h-3.5 text-[#B2A999]" />
                            선택됨
                          </span>
                        )}
                      </div>
                      <h3 className="font-editorial text-lg font-semibold text-[#F1EEE8] leading-snug">
                        {occ.name}
                      </h3>
                      <p className="text-xs text-[#B8B4AC] leading-relaxed line-clamp-2 mt-1 break-keep">
                        {occ.summary}
                      </p>
                    </div>
                    <p className="text-[11px] text-[#86837C] truncate pt-1.5 border-t border-[#24272D]">
                      {occ.socialPosition}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right / Main Dossier Inspection Panel */}
        <section className="flex-1 min-h-0 lg:col-span-7 archival-panel flex flex-col overflow-hidden">
          {/* Selected Occupation Visual Banner */}
          <div className="relative h-28 sm:h-32 xl:h-36 shrink-0 border-b border-[#292D34] overflow-hidden">
            <ResilientBackground
              src={activeOcc.startBackground}
              alt={`${activeOcc.name} 배경`}
              className="w-full h-full"
              imageClassName="saturate-[0.65] brightness-[0.8]"
              overlayClassName="bg-gradient-to-r from-[#111316]/95 via-[#111316]/78 to-[#111316]/35"
            />
            <div className="relative z-10 h-full px-4 sm:px-5 flex items-center justify-between gap-3">
              <div className="min-w-0 max-w-md space-y-1">
                <p className="text-[11px] sm:text-xs text-[#A49B8C]">
                  {activeOcc.title} · {activeOcc.protagonistName} ({activeOcc.age}세)
                  {activeOcc.activePeriod && (
                    <span className="font-data text-[#DFD8CA] ml-1.5">
                      · {activeOcc.activePeriod}
                    </span>
                  )}
                </p>
                <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#F1EEE8] leading-tight">
                  {activeOcc.name}
                </h3>
                <p className="text-xs text-[#C4C0B8] line-clamp-2 break-keep">
                  {activeOcc.socialPosition}
                </p>
              </div>
              <div className="h-full flex items-end pt-2 shrink-0 pointer-events-none">
                <PixelSprite
                  src={activeOcc.portraitSprite}
                  alt={activeOcc.protagonistName}
                  fallbackName={activeOcc.protagonistName}
                  className="h-[92%] max-h-[126px] w-auto"
                />
              </div>
            </div>
          </div>

          {/* Dossier Details (scrolls internally only on short viewports) */}
          <div className="flex-1 min-h-0 p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 overflow-y-auto">
            <div className="md:col-span-7 space-y-3.5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#A8A49C]">
                  역사적 권한 및 업무 범위
                </p>
                <p className="text-xs sm:text-sm text-[#CCC8BF] leading-relaxed break-keep">
                  {activeOcc.historicalScope}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#A8A49C]">
                  마주하게 될 핵심 갈등
                </p>
                <ul className="space-y-1 text-xs sm:text-sm text-[#CCC8BF]">
                  {activeOcc.keyConflicts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-data text-[11px] text-[#9B9385] mt-0.5">
                        0{idx + 1}.
                      </span>
                      <span className="break-keep leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activeOcc.moralDilemma && (
                <div className="p-3 bg-[#151314] border-l-2 border-[#7A2E29] border-y border-r border-y-[#2B2729] border-r-[#2B2729] space-y-1">
                  <p className="text-[11px] font-semibold text-[#D69D96]">
                    핵심 도덕적 딜레마
                  </p>
                  <p className="text-xs text-[#DFDCD5] leading-relaxed break-keep">
                    {activeOcc.moralDilemma}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#A8A49C]">
                  주요 가족 및 주변 인물
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeOcc.familyAndContacts.map((fc) => (
                    <div
                      key={fc.characterId}
                      className="p-2.5 bg-[#111316] border border-[#272B32]"
                    >
                      <p className="text-xs font-semibold text-[#E8E4DC]">
                        {fc.relation}
                      </p>
                      <p className="text-[11px] text-[#96938B] mt-0.5 leading-snug break-keep">
                        {fc.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Initial 5 variables (0-20 scale) */}
            <div className="md:col-span-5 md:border-l md:border-[#2A2E35] md:pl-5 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#A8A49C]">
                  초기 상태 지표 (0–20)
                </p>
                <p className="text-[11px] text-[#86837C] mt-0.5 leading-snug">
                  도덕적 우열이 아닌 시작 시점의 사회적 조건입니다.
                </p>
              </div>
              <div className="space-y-2.5">
                {activeVariableMeta.map((meta) => {
                  const val = activeOcc.initialVariables[meta.key];
                  const pct = Math.max(0, Math.min(100, (val / 20) * 100));
                  return (
                    <div key={meta.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#D4D0C8]">{meta.label}</span>
                        <span className="font-data text-[#B2A999]">
                          {val} / 20
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#101215] border border-[#2B2F36] overflow-hidden">
                        <div
                          className="h-full bg-[#9E9586] transition-all duration-200"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => onOpenTimeline(activeOcc.id)}
                className="w-full min-h-[38px] px-3 py-1.5 bg-[#16191E] hover:bg-[#20242C] border border-[#343942] text-xs text-[#D6D2C9] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#B2A999]" />
                <span>{activeOcc.name} 시기 역사 연표 확인</span>
              </button>
            </div>
          </div>

          {/* Pinned Bottom Start CTA */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-[#2A2E35] bg-[#111316]">
            <button
              type="button"
              onClick={() => onSelectOccupation(activeOcc.id)}
              className="w-full min-h-[48px] px-5 py-2.5 bg-[#7A2E29] hover:bg-[#8C3731] active:bg-[#692621] text-[#F4F1EB] border border-[#96453F] font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>
                {activeOcc.name} ({activeOcc.protagonistName})으로 시작하기
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
