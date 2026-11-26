import { useState } from 'react';
import { BookOpen, History, Info, Monitor, Play, RotateCcw, ScrollText } from 'lucide-react';
import { OCCUPATIONS_BY_ID } from '../data';
import type { DisplayRatioMode, SaveSlotData } from '../types/game';
import { ResilientBackground } from './ResilientBackground';

const RATIO_LABELS: Record<DisplayRatioMode, string> = {
  auto: '자동 맞춤',
  '16:9': '16:9',
  '4:3': '4:3',
  portrait: '세로 분할',
};

interface TitleScreenProps {
  latestSave: SaveSlotData | null;
  recordCount: number;
  displayRatio: DisplayRatioMode;
  onCycleDisplayRatio: () => void;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenRecords: () => void;
  onOpenGuide: () => void;
  onOpenCredits: () => void;
}

export function TitleScreen({
  latestSave,
  recordCount,
  displayRatio,
  onCycleDisplayRatio,
  onNewGame,
  onContinue,
  onOpenRecords,
  onOpenGuide,
  onOpenCredits,
}: TitleScreenProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleNewGameClick = () => {
    if (latestSave && !confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    onNewGame();
  };

  const savedOccupationName = latestSave
    ? OCCUPATIONS_BY_ID[latestSave.occupation]?.name ?? ''
    : '';

  const formattedSaveDate = latestSave
    ? new Date(latestSave.savedAt).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="relative h-full w-full flex flex-col justify-between overflow-hidden bg-[#0E0F11]">
      {/* Restrained desaturated historical street backdrop */}
      <div className="absolute inset-0 z-0">
        <ResilientBackground
          src="/assets/aistudio/Historical_Seoul_commercial_stre__6a771eda_bbc4579d.jpg"
          alt="1940년대 식민지 조선 거리 배경"
          className="w-full h-full"
          imageClassName="saturate-[0.58] brightness-[0.82] contrast-[1.05]"
          overlayClassName="bg-gradient-to-r from-[#0C0D0F]/96 via-[#0E0F11]/82 to-[#0E0F11]/55 md:via-[#0E0F11]/74"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F11] via-transparent to-[#0E0F11]/70 pointer-events-none" />
      </div>

      {/* Top archival header line */}
      <header className="relative z-10 shrink-0 hidden sm:flex w-full max-w-6xl mx-auto px-5 sm:px-8 pt-4 pb-2.5 border-b border-[#25282E]/80 items-center justify-end gap-4">
        <p className="text-xs text-[#7D7B75] font-data tracking-wider">
          1941 — 1943 · SONGHYEON-MYEON
        </p>
      </header>

      {/* Main focal area */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-5 sm:py-8 flex-1 min-h-0 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-xl">
          <p className="text-xs sm:text-sm text-[#B2A999] tracking-[0.2em] mb-2.5 sm:mb-3.5 font-editorial">
            기록되지 않은 일상의 선택
          </p>
          <h1 className="font-editorial text-3xl sm:text-5xl md:text-[3.25rem] font-semibold text-[#F1EEE8] leading-[1.18] tracking-tight mb-4">
            그날, 당신의 선택
          </h1>
          <div className="w-12 h-px bg-[#5B5852] mb-4 sm:mb-5" aria-hidden="true" />
          <p className="text-xs sm:text-sm md:text-base text-[#C4C0B8] leading-[1.75] mb-6 sm:mb-7 max-w-lg break-keep">
            농사꾼, 면사무소 직원, 순사보. 전시총동원체제 아래 서로 다른 자리에
            섰던 세 사람의 시선으로 일상적 통제와 생존, 협력과 저항, 그리고
            선택이 남긴 책임을 차분히 마주합니다.
          </p>

          {/* Primary Menu Buttons — solemn architectural framing */}
          <div className="flex flex-col gap-2.5 max-w-md">
            {latestSave ? (
              <button
                type="button"
                onClick={onContinue}
                className="w-full min-h-[52px] px-5 py-3.5 bg-[#7A2E29] hover:bg-[#8C3731] active:bg-[#692621] text-[#F4F1EB] border border-[#96453F] transition-colors duration-150 flex items-center justify-between gap-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B2A999]"
              >
                <span className="flex items-center gap-3 font-medium text-base whitespace-nowrap">
                  <Play className="w-4 h-4 shrink-0" />
                  이어하기
                </span>
                <span className="text-xs text-[#E4D5D1] font-data truncate">
                  {savedOccupationName} · 제{latestSave.chapter}장 · {formattedSaveDate}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full min-h-[48px] px-5 py-3 bg-[#141619]/75 text-[#666560] border border-[#25282E] flex items-center justify-between gap-3 text-left cursor-not-allowed"
              >
                <span className="flex items-center gap-3 font-medium text-sm whitespace-nowrap">
                  <Play className="w-4 h-4 shrink-0 opacity-45" />
                  이어하기
                </span>
                <span className="text-xs text-[#595854]">저장된 진행 없음</span>
              </button>
            )}

            {!confirmReset ? (
              <button
                type="button"
                onClick={handleNewGameClick}
                className={`w-full min-h-[52px] px-5 py-3.5 transition-colors duration-150 flex items-center justify-between gap-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B2A999] ${
                  latestSave
                    ? 'bg-[#181A1E]/95 hover:bg-[#22252B] text-[#EAE7E0] border border-[#363B44]'
                    : 'bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] border border-[#96453F]'
                }`}
              >
                <span className="flex items-center gap-3 font-medium text-base whitespace-nowrap">
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  새 게임 시작
                </span>
                <span className="text-xs opacity-75 whitespace-nowrap">
                  직업 선택부터 시작
                </span>
              </button>
            ) : (
              <div className="p-4 bg-[#17191D] border border-[#7A2E29] space-y-3">
                <p className="text-xs sm:text-sm text-[#DFDCD5] leading-relaxed">
                  새 게임을 시작하면 현재 자동 저장된 진행과 지표가 초기화됩니다.
                  완료된 플레이 기록과 수동 슬롯은 그대로 보관됩니다.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNewGameClick}
                    className="flex-1 min-h-[44px] px-4 py-2 bg-[#7A2E29] hover:bg-[#8C3731] text-[#F4F1EB] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    초기화 후 시작
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 min-h-[44px] px-4 py-2 bg-[#121417] hover:bg-[#1E2127] text-[#C6C2B9] border border-[#343841] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* Secondary navigation buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={onOpenRecords}
                className="min-h-[46px] px-3.5 py-2.5 bg-[#15171B]/92 hover:bg-[#1E2127] text-[#D4D0C7] border border-[#2C3037] hover:border-[#454B56] transition-colors flex items-center justify-center sm:justify-start gap-2 text-sm cursor-pointer whitespace-nowrap"
              >
                <History className="w-4 h-4 text-[#A49B8C] shrink-0" />
                <span>플레이 기록</span>
                {recordCount > 0 && (
                  <span className="font-data text-xs text-[#8D8A83]">({recordCount})</span>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenGuide}
                className="min-h-[46px] px-3.5 py-2.5 bg-[#15171B]/92 hover:bg-[#1E2127] text-[#D4D0C7] border border-[#2C3037] hover:border-[#454B56] transition-colors flex items-center justify-center sm:justify-start gap-2 text-sm cursor-pointer whitespace-nowrap"
              >
                <Info className="w-4 h-4 text-[#A49B8C] shrink-0" />
                <span>게임 설명</span>
              </button>
              <button
                type="button"
                onClick={onOpenCredits}
                className="min-h-[46px] px-3.5 py-2.5 bg-[#15171B]/92 hover:bg-[#1E2127] text-[#D4D0C7] border border-[#2C3037] hover:border-[#454B56] transition-colors flex items-center justify-center sm:justify-start gap-2 text-sm cursor-pointer whitespace-nowrap"
              >
                <ScrollText className="w-4 h-4 text-[#A49B8C] shrink-0" />
                <span>사료 노트</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Quiet institutional disclaimer footer with quick ratio control */}
      <footer className="relative z-10 shrink-0 w-full max-w-6xl mx-auto px-5 sm:px-8 py-3 border-t border-[#25282E]/90 flex flex-wrap items-center justify-between gap-2 text-xs text-[#898780]">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-3.5 h-3.5 text-[#9F9687] shrink-0" />
          <span className="truncate">
            실제 역사적 제도·사료와 게임의 허구적 인물·각색은 본문 내에서 명확히 구분됩니다.
          </span>
        </div>
        <button
          type="button"
          onClick={onCycleDisplayRatio}
          className="min-h-[34px] px-2.5 py-1 bg-[#14161A] hover:bg-[#1E2127] border border-[#2D3139] hover:border-[#515763] text-[#C8C4BC] text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="화면 비율 전환"
        >
          <Monitor className="w-3.5 h-3.5 text-[#A49B8C]" />
          <span>화면 비율 · {RATIO_LABELS[displayRatio]}</span>
        </button>
      </footer>
    </div>
  );
}
