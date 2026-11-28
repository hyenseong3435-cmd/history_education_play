import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, X } from 'lucide-react';
import { OCCUPATIONS } from '../data';
import type { OccupationData, OccupationId } from '../types/game';
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
  const [inspectedOcc, setInspectedOcc] = useState<OccupationData | null>(null);

  useEffect(() => {
    if (!inspectedOcc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedOcc(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inspectedOcc]);

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

            {/* Historical Uncertainty Premise */}
            <div className="py-3.5 px-4 bg-[#14161A] border-y border-[#3A3D45] space-y-1">
              <p className="font-editorial text-base sm:text-lg font-medium text-[#F4F1EB] leading-relaxed break-keep">
                “당신은 이 지배가 언제 끝날지 모릅니다. 10년일지, 50년일지, 아니면 영원히 계속될지.”
              </p>
              <p className="text-xs sm:text-sm text-[#A9A49A] leading-relaxed break-keep">
                해방이 몇 년 뒤에 올지 알지 못한 채, 당장 오늘 가족의 생계와 이웃의 시선, 그리고 명령 앞에서 선택을 내려야 합니다.
              </p>
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
                이 이야기에서 당신은 1944년 경상도의 가상 농촌 마을 송현면에서
                살아가는 한 사람이 되어 해방 직전의 갈림길을 지나갑니다. 선택한
                직업에 따라 사회적 위치, 마주하는 인물, 같은 사건을 접하는 시선과
                선택지가 달라집니다.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 bg-[#121417] border border-[#343841] space-y-1.5 text-xs sm:text-sm">
              <p className="font-bold text-[#F4F1EB]">
                학습 안내 · 사료 및 허구의 구분
              </p>
              <p className="font-bold text-[#EAE6DE] leading-relaxed break-keep">
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
              직업 선택 · 1944~1945 경상도 가상 농촌 마을
            </p>
            <button
              type="button"
              onClick={() => onOpenTimeline()}
              className="min-h-[36px] px-3 py-1 bg-[#181B20] hover:bg-[#22262E] border border-[#3B4049] hover:border-[#9E9586] text-xs text-[#DFDCD5] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B2A999]" />
              <span>역사 연표 보기</span>
            </button>
          </div>
        </div>
      </header>

      {/* Intuitive 3-Character Selection Gallery */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 overflow-y-auto flex flex-col">
        <div className="my-auto w-full flex flex-col gap-4 sm:gap-5">
          {/* Heading + Historical Uncertainty Motif */}
          <div className="text-center max-w-2xl mx-auto space-y-1.5 shrink-0">
            <p className="text-xs sm:text-sm text-[#B2A999] font-editorial tracking-wide break-keep">
              당신은 이 지배가 언제 끝날지 모릅니다. 10년? 50년? 영원히?
            </p>
            <h2 className="font-editorial text-xl sm:text-3xl font-semibold text-[#F4F1EB] leading-snug break-keep">
              어느 자리에서 그날을 살아가시겠습니까?
            </h2>
            <p className="text-xs sm:text-sm text-[#98958E] break-keep">
              인물을 눌러 해당 직업의 상황과 마주할 갈등을 확인한 뒤 시작하세요.
            </p>
          </div>

          {/* 3 Clean Full-Body Character Cards (Responsive across Phone, Tablet, Laptop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 items-stretch">
            {OCCUPATIONS.map((occ) => (
              <button
                key={occ.id}
                type="button"
                onClick={() => setInspectedOcc(occ)}
                className="group relative flex flex-row sm:flex-col overflow-hidden bg-[#14161A] border border-[#2D3139] hover:border-[#B2A999] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B2A999] transition-colors duration-150 text-left cursor-pointer"
              >
                {/* Full-Body Portrait Stage — explicit safe height/width so sprite is never clipped */}
                <div className="relative w-[132px] h-[184px] shrink-0 sm:w-full sm:h-[clamp(220px,38dvh,330px)] overflow-hidden border-r sm:border-r-0 sm:border-b border-[#272A31]">
                  <div className="absolute inset-0 z-0">
                    <ResilientBackground
                      src={occ.startBackground}
                      alt={`${occ.name} 배경`}
                      className="w-full h-full"
                      imageClassName="saturate-[0.65] brightness-[0.8] group-hover:scale-[1.03] transition-transform duration-300"
                      overlayClassName="bg-gradient-to-t from-[#111316]/90 via-[#111316]/25 to-[#111316]/35"
                    />
                  </div>
                  <div className="relative z-10 w-full h-full px-2.5 pt-3.5 pb-2 sm:px-4 sm:pt-5 sm:pb-3 flex items-end justify-center pointer-events-none">
                    <PixelSprite
                      src={occ.portraitSprite}
                      alt={`${occ.name} ${occ.protagonistName} 전신 캐릭터`}
                      fallbackName={occ.protagonistName}
                      className="w-full h-full object-contain object-bottom group-hover:scale-[1.03] transition-transform duration-200"
                    />
                  </div>
                </div>

                {/* Clear Occupation & Character Identity Footer */}
                <div className="flex-1 min-w-0 p-4 sm:p-4 md:p-5 bg-[#14161A] group-hover:bg-[#191C22] transition-colors flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-data text-[#9E978B]">
                      {occ.activePeriod}
                    </p>
                    <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#F4F1EB] leading-tight">
                      {occ.name}
                    </h3>
                    <p className="text-sm text-[#C8C4BC]">
                      {occ.protagonistName}{' '}
                      <span className="text-xs text-[#8D8A83]">({occ.age}세)</span>
                    </p>
                  </div>
                  <span className="text-xs text-[#B2A999] group-hover:text-[#F4F1EB] flex items-center gap-1 whitespace-nowrap shrink-0 sm:pb-0.5">
                    <span>상세 보기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Quiet bottom helper line */}
          <p className="text-center text-xs text-[#7D7A74] shrink-0 break-keep">
            선택의 결과는 눈에 보이지 않게 누적되어 결말을 만들며, 플레이를 마친 뒤 모든 선택과 성찰 질문이 기록됩니다.
          </p>
        </div>
      </main>

      {/* Interactive Character Detail Inspection Modal */}
      {inspectedOcc && (
        <div
          className="fixed inset-0 z-50 bg-black/82 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`${inspectedOcc.name} ${inspectedOcc.protagonistName} 상세 정보`}
          onClick={() => setInspectedOcc(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[88dvh] bg-[#15171A] border border-[#3B404A] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Character Header */}
            <div className="relative min-h-[144px] sm:h-44 shrink-0 border-b border-[#2B2F36] overflow-hidden">
              <div className="absolute inset-0 z-0">
                <ResilientBackground
                  src={inspectedOcc.startBackground}
                  alt={`${inspectedOcc.name} 배경`}
                  className="w-full h-full"
                  imageClassName="saturate-[0.65] brightness-[0.8]"
                  overlayClassName="bg-gradient-to-r from-[#111316]/96 via-[#111316]/82 to-[#111316]/40"
                />
              </div>
              <button
                type="button"
                onClick={() => setInspectedOcc(null)}
                aria-label="창 닫기"
                className="absolute top-3 right-3 z-20 min-w-[40px] min-h-[40px] bg-[#121417]/90 hover:bg-[#1E2127] border border-[#3C414B] text-[#CFCBC2] hover:text-[#F4F1EB] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 h-full px-4 sm:px-6 pr-14 sm:pr-16 py-3 flex items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] sm:text-xs text-[#B2A999] font-data">
                    {inspectedOcc.activePeriod} · {inspectedOcc.title}
                  </p>
                  <h3 className="font-editorial text-xl sm:text-3xl font-semibold text-[#F4F1EB] leading-tight">
                    {inspectedOcc.name}{' '}
                    <span className="text-base sm:text-xl font-normal text-[#DFDCD5]">
                      {inspectedOcc.protagonistName} ({inspectedOcc.age}세)
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#C4C0B8] break-keep line-clamp-2">
                    {inspectedOcc.socialPosition}
                  </p>
                </div>
                <div className="w-20 h-32 sm:w-28 sm:h-40 py-1 shrink-0 flex items-end justify-center pointer-events-none">
                  <PixelSprite
                    src={inspectedOcc.portraitSprite}
                    alt={`${inspectedOcc.name} ${inspectedOcc.protagonistName} 전신`}
                    fallbackName={inspectedOcc.protagonistName}
                    className="w-full h-full object-contain object-bottom"
                  />
                </div>
              </div>
            </div>

            {/* Concise, High-Readability Situation & Dilemma Body (No Variables Shown) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Situation Summary */}
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-[#A49B8C]">
                  이 게임에서의 상황
                </p>
                <p className="text-sm sm:text-[15px] text-[#E6E3DC] leading-[1.75] break-keep">
                  {inspectedOcc.summary}
                </p>
                <p className="text-xs sm:text-sm text-[#B8B4AC] leading-[1.72] break-keep">
                  {inspectedOcc.historicalScope}
                </p>
              </div>

              {/* Core Moral Dilemma — clean hairline framing */}
              {inspectedOcc.moralDilemma && (
                <div className="p-4 bg-[#111316] border border-[#443534] space-y-1.5">
                  <p className="text-xs font-semibold text-[#D69D96]">
                    마주할 질문
                  </p>
                  <p className="text-sm text-[#EDEAE3] leading-[1.7] break-keep">
                    {inspectedOcc.moralDilemma}
                  </p>
                </div>
              )}

              {/* Key Conflicts + Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 border-t border-[#262930]">
                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold tracking-wider text-[#A49B8C]">
                    주요 갈등
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#CFCBC2]">
                    {inspectedOcc.keyConflicts.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-data text-xs text-[#9E9586] mt-0.5 shrink-0">
                          0{idx + 1}.
                        </span>
                        <span className="break-keep leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold tracking-wider text-[#A49B8C]">
                    주변 인물
                  </p>
                  <div className="space-y-2">
                    {inspectedOcc.familyAndContacts.map((fc) => (
                      <div
                        key={fc.characterId}
                        className="p-3 bg-[#111316] border border-[#272B32] space-y-0.5"
                      >
                        <p className="text-xs sm:text-sm font-semibold text-[#ECE9E2]">
                          {fc.relation}
                        </p>
                        <p className="text-xs text-[#9C9991] leading-snug break-keep">
                          {fc.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-[#2A2E35] bg-[#111316] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectedOcc(null)}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-[#16181C] hover:bg-[#202329] text-[#C8C4BC] border border-[#343841] text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  다른 인물 보기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const occId = inspectedOcc.id;
                    setInspectedOcc(null);
                    onOpenTimeline(occId);
                  }}
                  className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 bg-[#181B20] hover:bg-[#22262E] text-[#DFDCD5] border border-[#3D424C] text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#B2A999]" />
                  <span>시기 연표</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelectOccupation(inspectedOcc.id)}
                className="min-h-[46px] px-6 py-2.5 bg-[#7A2E29] hover:bg-[#8C3731] active:bg-[#692621] text-[#F4F1EB] border border-[#96453F] font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>
                  {inspectedOcc.name} ({inspectedOcc.protagonistName})으로 시작하기
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
