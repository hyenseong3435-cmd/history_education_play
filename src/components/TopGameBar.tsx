import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Monitor,
  Save,
  Settings,
} from 'lucide-react';
import { CHAPTERS, OCCUPATIONS_BY_ID } from '../data';
import type { DisplayRatioMode, GameState } from '../types/game';

export type ActiveModalType =
  | null
  | 'sources'
  | 'status'
  | 'log'
  | 'save'
  | 'settings'
  | 'records'
  | 'guide'
  | 'credits';

const SHORT_RATIO_LABEL: Record<DisplayRatioMode, string> = {
  auto: '자동',
  '16:9': '16:9',
  '4:3': '4:3',
  portrait: '세로',
};

interface TopGameBarProps {
  state: GameState;
  unreadSourceCount: number;
  displayRatio: DisplayRatioMode;
  onCycleDisplayRatio: () => void;
  onOpenModal: (modal: ActiveModalType) => void;
}

export function TopGameBar({
  state,
  unreadSourceCount,
  displayRatio,
  onCycleDisplayRatio,
  onOpenModal,
}: TopGameBarProps) {
  const occ = state.occupation ? OCCUPATIONS_BY_ID[state.occupation] : null;
  const ch = CHAPTERS.find((c) => c.number === state.chapter);

  return (
    <header className="shrink-0 z-30 w-full bg-[#111316]/96 backdrop-blur-sm border-b border-[#2A2D34]">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Quiet institutional identity & current chapter/role */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-editorial text-sm sm:text-base font-semibold text-[#ECE9E2] tracking-tight whitespace-nowrap shrink-0">
            그날, 당신의 선택
          </span>
          {occ && ch && (
            <span className="hidden md:inline-flex items-center gap-2 text-xs text-[#94928B] truncate">
              <span aria-hidden="true">·</span>
              <span>제{ch.number}장</span>
              <span aria-hidden="true">·</span>
              <span>
                {occ.name} {occ.protagonistName}
              </span>
            </span>
          )}
        </div>

        {/* Right: Restrained single-line utility actions */}
        <nav
          aria-label="게임 상단 메뉴"
          className="flex items-center gap-0.5 sm:gap-1 shrink-0"
        >
          <button
            type="button"
            onClick={() => onOpenModal('sources')}
            className="relative min-h-[38px] px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-[#D6D3CB] hover:text-[#F4F1EB] hover:bg-[#1D2025] border border-transparent hover:border-[#343942] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="사료 열람"
          >
            <BookOpen className="w-4 h-4 text-[#A49B8C] shrink-0" />
            <span className="hidden sm:inline">사료</span>
            <span className="hidden lg:inline">열람</span>
            {unreadSourceCount > 0 && (
              <span className="font-data text-[11px] font-medium text-[#F4F1EB] bg-[#7A2E29] px-1.5 py-0.5 leading-none">
                +{unreadSourceCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('status')}
            className="min-h-[38px] px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-[#D6D3CB] hover:text-[#F4F1EB] hover:bg-[#1D2025] border border-[#2F333B] hover:border-[#7E7668] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="변수 현황 창 열기"
          >
            <BarChart3 className="w-4 h-4 text-[#B2A999] shrink-0" />
            <span className="hidden sm:inline">변수</span>
            <span className="hidden lg:inline">현황</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('log')}
            className="min-h-[38px] px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-[#D6D3CB] hover:text-[#F4F1EB] hover:bg-[#1D2025] border border-transparent hover:border-[#343942] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="선택 기록"
          >
            <ClipboardList className="w-4 h-4 text-[#A49B8C] shrink-0" />
            <span className="hidden sm:inline">기록</span>
          </button>

          <button
            type="button"
            onClick={onCycleDisplayRatio}
            className="min-h-[38px] px-2 sm:px-2.5 py-1 text-xs text-[#D6D3CB] hover:text-[#F4F1EB] hover:bg-[#1D2025] border border-transparent hover:border-[#343942] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title={`화면 비율 변경 (현재: ${SHORT_RATIO_LABEL[displayRatio]})`}
          >
            <Monitor className="w-4 h-4 text-[#A49B8C] shrink-0" />
            <span className="hidden sm:inline font-data">
              {SHORT_RATIO_LABEL[displayRatio]}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('save')}
            className="min-h-[38px] px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-[#D6D3CB] hover:text-[#F4F1EB] hover:bg-[#1D2025] border border-transparent hover:border-[#343942] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="저장 및 불러오기"
          >
            <Save className="w-4 h-4 text-[#A49B8C] shrink-0" />
            <span className="hidden md:inline">저장</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('settings')}
            className="min-h-[38px] px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-[#D6D3CB] hover:text-[#F4F1EB] hover:bg-[#1D2025] border border-transparent hover:border-[#343942] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="설정"
          >
            <Settings className="w-4 h-4 text-[#A49B8C] shrink-0" />
            <span className="hidden md:inline">설정</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
