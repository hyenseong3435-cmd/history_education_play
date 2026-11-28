import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Info,
  Lock,
  MapPin,
  X,
} from 'lucide-react';
import {
  CHAPTERS,
  CHARACTERS_BY_ID,
  OCCUPATIONS_BY_ID,
  getChapterDisplay,
} from '../data';
import { getChapterExplorationStats } from '../engine/gameEngine';
import type { DelayedEffect, GameState, LocationData } from '../types/game';
import { ResilientBackground } from './ResilientBackground';

interface ExplorationViewProps {
  state: GameState;
  recentDelayedEffects: DelayedEffect[];
  onVisitLocation: (
    location: LocationData,
    startNodeId: string,
    visitKey: string
  ) => void;
  onStartMainEvent: () => void;
  onOpenSources: () => void;
}

interface MapPinCoord {
  x: number; // 0..1000 SVG coordinate space
  y: number; // 0..600 SVG coordinate space
  shortName: string;
}

const LOCATION_MAP_COORDS: Record<string, MapPinCoord> = {
  loc_home: { x: 185, y: 175, shortName: '주인공의 집' },
  loc_farmland: { x: 175, y: 440, shortName: '들말 논밭' },
  loc_meeting_room: { x: 410, y: 405, shortName: '마을 회관' },
  loc_township_office: { x: 495, y: 185, shortName: '면사무소' },
  loc_clinic: { x: 745, y: 145, shortName: '윤의원' },
  loc_police_substation: { x: 705, y: 335, shortName: '경찰 주재소' },
  loc_city_street: { x: 865, y: 470, shortName: '읍내 거리' },
};

const MAP_ASPECT = 1000 / 600;

export function ExplorationView({
  state,
  recentDelayedEffects,
  onVisitLocation,
  onStartMainEvent,
  onOpenSources,
}: ExplorationViewProps) {
  const chapter =
    CHAPTERS.find((c) => c.number === state.chapter) ?? CHAPTERS[0];
  const chapterDisplay = getChapterDisplay(chapter, state.occupation);
  const occ = state.occupation ? OCCUPATIONS_BY_ID[state.occupation] : null;
  const { availableLocations, visitedCount, totalActionableCount } =
    getChapterExplorationStats(state);

  const defaultSelectedId = useMemo(() => {
    const unvisitedActionable = availableLocations.find(
      (item) => item.accessible && item.visit && !item.visited
    );
    if (unvisitedActionable) return unvisitedActionable.location.id;
    const current = availableLocations.find(
      (item) => item.location.id === state.currentLocationId
    );
    if (current) return current.location.id;
    return availableLocations[0]?.location.id ?? 'loc_home';
  }, [availableLocations, state.currentLocationId]);

  const [selectedLocId, setSelectedLocId] = useState<string>(defaultSelectedId);
  const [showChapterBrief, setShowChapterBrief] = useState<boolean>(false);
  const [dismissedDelayed, setDismissedDelayed] = useState<boolean>(false);

  // Reset default selection when chapter changes
  useEffect(() => {
    setSelectedLocId(defaultSelectedId);
    setDismissedDelayed(false);
  }, [state.chapter, state.occupation, defaultSelectedId]);

  // Measure the available map area to keep the 1000x600 SVG and interactive pins pixel-aligned
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const [mapBox, setMapBox] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const el = mapHostRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const padX = rect.width < 480 ? 8 : 16;
      const padY = rect.height < 320 ? 8 : 14;
      const availW = Math.max(0, rect.width - padX * 2);
      const availH = Math.max(0, rect.height - padY * 2);
      if (availW === 0 || availH === 0) return;

      let w = availW;
      let h = w / MAP_ASPECT;
      if (h > availH) {
        h = availH;
        w = h * MAP_ASPECT;
      }
      setMapBox({ width: Math.floor(w), height: Math.floor(h) });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const selectedItem =
    availableLocations.find((item) => item.location.id === selectedLocId) ??
    availableLocations[0];

  const mainEventLabel =
    (state.occupation && chapter.mainEventLabelByOccupation[state.occupation]) ||
    '주요 역사 사건 진행';

  const eventTypeLabel =
    chapter.eventType === 'occupation_specific'
      ? '직업 전용 사건'
      : chapter.eventType === 'shared_historical'
      ? '세 직업 공통 역사 사건'
      : '선택의 귀결 · 최종 분기';

  const currentCoord = LOCATION_MAP_COORDS[state.currentLocationId];
  const selectedCoord = selectedItem
    ? LOCATION_MAP_COORDS[selectedItem.location.id]
    : null;

  const selectedNpcNames = selectedItem?.visit
    ? selectedItem.visit.npcIds
        .map((id) => CHARACTERS_BY_ID[id]?.name)
        .filter(Boolean)
        .join(', ')
    : '';

  const selectedBgSrc = selectedItem
    ? state.chapter === 3 && selectedItem.location.nightBackground
      ? selectedItem.location.nightBackground
      : selectedItem.location.background
    : '';

  const selectedCanInteract = Boolean(
    selectedItem && selectedItem.accessible && selectedItem.visit
  );

  return (
    <main className="flex-1 min-h-0 w-full flex flex-col overflow-hidden bg-[#0E0F11]">
      {/* Compact Chapter Bar */}
      <section className="shrink-0 w-full border-b border-[#25282F] bg-[#121417]/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-[#9E978B]">
              <span>{chapterDisplay.period}</span>
              <span aria-hidden="true">·</span>
              <span>{eventTypeLabel}</span>
              {occ && (
                <>
                  <span aria-hidden="true" className="hidden sm:inline">
                    ·
                  </span>
                  <span className="hidden sm:inline text-[#C4C0B8]">
                    {occ.name} {occ.protagonistName}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="font-editorial text-base sm:text-xl font-semibold text-[#F1EEE8] truncate">
                {chapterDisplay.title}
              </h1>
              <button
                type="button"
                onClick={() => setShowChapterBrief((prev) => !prev)}
                className="min-h-[30px] px-2 py-0.5 text-[11px] text-[#B2A999] hover:text-[#F1EEE8] border border-[#2F333B] hover:border-[#555B66] bg-[#17191D] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                aria-expanded={showChapterBrief}
              >
                <Info className="w-3 h-3" />
                <span>장 개요</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-[#94918A]">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Compass className="w-3.5 h-3.5 text-[#9E978B]" />
                탐색{' '}
                <strong className="font-data text-[#E2DFD8]">
                  {visitedCount}/{totalActionableCount}
                </strong>
              </span>
              <button
                type="button"
                onClick={onOpenSources}
                className="text-[#B8B0A1] hover:text-[#ECE9E2] underline underline-offset-4 cursor-pointer whitespace-nowrap"
              >
                사료 ({state.readSources.length}/{state.unlockedSources.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onStartMainEvent}
              className="min-h-[40px] sm:min-h-[42px] px-3.5 sm:px-4 py-2 bg-[#7A2E29] hover:bg-[#8C3731] active:bg-[#692621] text-[#F4F1EB] border border-[#96453F] font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="max-w-[160px] sm:max-w-[220px] truncate">
                {mainEventLabel}
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Quiet Historical Uncertainty Framing Bar */}
        <div className="border-t border-[#1E2127] bg-[#0F1114]/95">
          <div className="max-w-7xl mx-auto px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-[#9C978D]">
            <p className="font-editorial truncate">
              당신은 이 지배가 언제 끝날지 모릅니다. 10년일지, 50년일지, 영원히 계속될지 모르는 채 오늘의 선택을 마주합니다.
            </p>
          </div>
        </div>

        {/* Expandable Chapter Context Drawer */}
        {showChapterBrief && (
          <div className="border-t border-[#25282F] bg-[#101215]">
            <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 flex items-start justify-between gap-4">
              <div className="space-y-1 text-xs sm:text-sm text-[#C8C4BC] leading-relaxed">
                <p className="break-keep">{chapterDisplay.summary}</p>
                <p className="text-xs text-[#8E8B84] break-keep">
                  역사적 맥락: {chapterDisplay.historicalContext}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowChapterBrief(false)}
                aria-label="장 개요 닫기"
                className="p-1.5 text-[#9B9890] hover:text-[#F1EEE8] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dismissible Delayed Effects Alert */}
        {recentDelayedEffects.length > 0 && !dismissedDelayed && (
          <div
            aria-label="이전 선택의 지연 결과"
            className="border-t border-[#6E3631]/70 bg-[#1B1617]"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2 flex items-start justify-between gap-3">
              <div className="text-xs text-[#DFDCD5] leading-snug space-y-0.5">
                <span className="font-semibold text-[#D69D96] mr-2">
                  이전 장 선택의 지연된 결과:
                </span>
                {recentDelayedEffects.map((eff, i) => (
                  <span key={eff.id}>
                    {i > 0 && <span className="mx-1.5 text-[#7A7770]">/</span>}
                    <strong className="text-[#F2EFE8]">{eff.title}</strong> —{' '}
                    <span className="text-[#C3BFB7]">{eff.description}</span>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDismissedDelayed(true)}
                aria-label="알림 닫기"
                className="p-1 text-[#C4A6A1] hover:text-[#F4F1EB] cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Zero-Scroll Map + Inspector Workspace */}
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-2.5 sm:p-4 flex flex-col lg:grid lg:grid-cols-12 gap-2.5 sm:gap-3.5 overflow-hidden">
        {/* Interactive Archival Map of Songhyeon-myeon */}
        <section
          aria-label="경상도 송현면 농촌 마을 지도"
          className="flex-1 min-h-[210px] lg:col-span-8 xl:col-span-9 relative border border-[#2C3038] bg-[#101215] flex flex-col overflow-hidden"
        >
          {/* Quiet Map Header Strip */}
          <div className="shrink-0 px-3 sm:px-4 py-2 border-b border-[#22262D] bg-[#131519]/90 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-editorial font-semibold text-[#ECE9E2] whitespace-nowrap">
                송현면(경상도 가상 농촌) 약도
              </span>
              <span className="hidden sm:inline text-[#6E6C67]" aria-hidden="true">
                ·
              </span>
              <span className="hidden sm:inline text-[#8D8A83] truncate">
                지도의 장소를 선택해 인물과 대화하거나 사료를 확인하세요
              </span>
            </div>
            <span className="font-data text-[11px] text-[#7D7B75] whitespace-nowrap shrink-0">
              1:10,000
            </span>
          </div>

          {/* Aspect-locked Cartographic Stage */}
          <div
            ref={mapHostRef}
            className="relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden bg-[#0F1114]"
          >
            {/* Subtle background grid across entire map table */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #232730 1px, transparent 1px), linear-gradient(to bottom, #232730 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {mapBox.width > 0 && mapBox.height > 0 && (
              <div
                className="relative select-none"
                style={{ width: mapBox.width, height: mapBox.height }}
              >
                {/* Vector Archival Survey Map */}
                <svg
                  viewBox="0 0 1000 600"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <defs>
                    <pattern
                      id="paddy-lines"
                      width="18"
                      height="12"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 0 12 L 18 12 M 9 0 L 9 12"
                        stroke="#252B31"
                        strokeWidth="0.9"
                        fill="none"
                      />
                    </pattern>
                  </defs>

                  {/* Outer Map Hairline Border */}
                  <rect
                    x="10"
                    y="10"
                    width="980"
                    height="580"
                    fill="#121418"
                    stroke="#2B2F38"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="16"
                    y="16"
                    width="968"
                    height="568"
                    fill="none"
                    stroke="#22262E"
                    strokeWidth="0.8"
                  />

                  {/* Subtle survey grid ticks */}
                  {[200, 400, 600, 800].map((gx) => (
                    <line
                      key={`gx-${gx}`}
                      x1={gx}
                      y1="16"
                      x2={gx}
                      y2="584"
                      stroke="#1D2027"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                  ))}
                  {[150, 300, 450].map((gy) => (
                    <line
                      key={`gy-${gy}`}
                      x1="16"
                      y1={gy}
                      x2="984"
                      y2={gy}
                      stroke="#1D2027"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                  ))}

                  {/* Northern Hillside Topographic Contours (송현고개 · 뒷산) */}
                  <g fill="none" stroke="#282D36" strokeWidth="1.2">
                    <path d="M 40 125 Q 150 55 290 95 T 550 80 T 820 75" />
                    <path d="M 65 100 Q 170 40 285 72 T 535 58 T 790 55" />
                    <path
                      d="M 110 75 Q 185 32 275 52"
                      strokeDasharray="3 3"
                    />
                  </g>

                  {/* Terraced Rice Paddy Sector (들말 다랑논) */}
                  <path
                    d="M 55 340 L 295 345 L 330 525 L 55 540 Z"
                    fill="url(#paddy-lines)"
                    stroke="#252A32"
                    strokeWidth="1"
                  />

                  {/* Winding Stream (송현천) */}
                  <path
                    d="M 65 250 C 145 275, 240 265, 290 325 C 335 380, 295 475, 345 582"
                    fill="none"
                    stroke="#1D2932"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 65 250 C 145 275, 240 265, 290 325 C 335 380, 295 475, 345 582"
                    fill="none"
                    stroke="#2B3E4B"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                  />

                  {/* Village Footpaths (농로 / 마을길) */}
                  <g
                    fill="none"
                    stroke="#49453D"
                    strokeWidth="2.2"
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                  >
                    {/* 집 <-> 들말 */}
                    <path d="M 185 175 C 165 255, 160 345, 175 440" />
                    {/* 집 <-> 면사무소 */}
                    <path d="M 185 175 C 295 160, 390 175, 495 185" />
                    {/* 들말 <-> 마을 회관 */}
                    <path d="M 175 440 C 260 445, 345 425, 410 405" />
                  </g>

                  {/* Main County Road (송현면 간선 군도) — double stroke */}
                  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {/* Outer road border */}
                    <path
                      d="M 410 405 C 435 320, 465 250, 495 185 C 580 170, 665 155, 745 145"
                      stroke="#595348"
                      strokeWidth="8"
                    />
                    <path
                      d="M 410 405 C 515 390, 610 365, 705 335 C 770 385, 825 430, 865 470 L 965 520"
                      stroke="#595348"
                      strokeWidth="9"
                    />
                    <path
                      d="M 495 185 C 575 235, 645 285, 705 335 C 725 275, 738 210, 745 145"
                      stroke="#595348"
                      strokeWidth="7"
                    />

                    {/* Inner road fill */}
                    <path
                      d="M 410 405 C 435 320, 465 250, 495 185 C 580 170, 665 155, 745 145"
                      stroke="#25282F"
                      strokeWidth="4.5"
                    />
                    <path
                      d="M 410 405 C 515 390, 610 365, 705 335 C 770 385, 825 430, 865 470 L 965 520"
                      stroke="#25282F"
                      strokeWidth="5.5"
                    />
                    <path
                      d="M 495 185 C 575 235, 645 285, 705 335 C 725 275, 738 210, 745 145"
                      stroke="#25282F"
                      strokeWidth="4"
                    />
                  </g>

                  {/* Stone bridge marks over 송현천 */}
                  <rect
                    x="156"
                    y="258"
                    width="18"
                    height="8"
                    transform="rotate(14 165 262)"
                    fill="#3E3B35"
                    stroke="#6B655B"
                    strokeWidth="1"
                  />
                  <rect
                    x="306"
                    y="416"
                    width="18"
                    height="8"
                    transform="rotate(-14 315 420)"
                    fill="#3E3B35"
                    stroke="#6B655B"
                    strokeWidth="1"
                  />

                  {/* Subtle selection sightline from current location to selected location */}
                  {currentCoord &&
                    selectedCoord &&
                    (currentCoord.x !== selectedCoord.x ||
                      currentCoord.y !== selectedCoord.y) && (
                      <line
                        x1={currentCoord.x}
                        y1={currentCoord.y}
                        x2={selectedCoord.x}
                        y2={selectedCoord.y}
                        stroke="#B2A999"
                        strokeOpacity="0.45"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                      />
                    )}

                  {/* Subtle Cartographic Place Labels */}
                  <g
                    fill="#62656D"
                    fontSize="12"
                    fontFamily="var(--font-serif-kr)"
                  >
                    <text x="155" y="72">
                      송현고개
                    </text>
                    <text x="235" y="295" fill="#4E6676" fontSize="11">
                      송현천
                    </text>
                    <text x="80" y="518" fontSize="11">
                      들말 다랑논
                    </text>
                    <text x="855" y="555" fontSize="11">
                      경성 · 군청 방면 ↘
                    </text>
                  </g>

                  {/* Minimalist Compass Rose (Top-Left) */}
                  <g transform="translate(56 58)" stroke="#6C6A64" fill="none">
                    <circle cx="0" cy="0" r="18" strokeWidth="1" opacity="0.7" />
                    <path d="M 0 -15 L 4 0 L 0 15 L -4 0 Z" strokeWidth="1" />
                    <path d="M 0 -15 L 4 0 L 0 -2 L -4 0 Z" fill="#9E9586" />
                    <text
                      x="0"
                      y="-22"
                      textAnchor="middle"
                      fill="#9E9586"
                      fontSize="10"
                      fontFamily="var(--font-mono-data)"
                      stroke="none"
                    >
                      N
                    </text>
                  </g>
                </svg>

                {/* Interactive Landmark Pins */}
                {availableLocations.map(
                  ({ location, visit, accessible, visited, visitKey }) => {
                    const coord = LOCATION_MAP_COORDS[location.id];
                    if (!coord) return null;

                    const isSelected = selectedItem?.location.id === location.id;
                    const isCurrent = state.currentLocationId === location.id;
                    const canInteract = accessible && visit !== null;
                    const hasSourceHint = Boolean(
                      visit &&
                        (visit.unlockSourceId ||
                          visit.rewardHint?.includes('사료'))
                    );

                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => setSelectedLocId(location.id)}
                        onDoubleClick={() => {
                          if (canInteract && visit) {
                            onVisitLocation(location, visit.startNodeId, visitKey);
                          }
                        }}
                        aria-pressed={isSelected}
                        aria-label={`${location.name} (${
                          !accessible
                            ? '미해금'
                            : visited
                            ? '방문 완료'
                            : visit
                            ? '대화 가능'
                            : '특이사항 없음'
                        })`}
                        style={{
                          left: `${(coord.x / 1000) * 100}%`,
                          top: `${(coord.y / 600) * 100}%`,
                        }}
                        className="group absolute -translate-x-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center cursor-pointer focus-visible:outline-none z-10 hover:z-20"
                      >
                        {/* Landmark Marker Node */}
                        <span
                          className={`relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border transition-transform duration-150 group-hover:scale-105 ${
                            isSelected
                              ? 'ring-2 ring-[#E0D8C8] ring-offset-2 ring-offset-[#121418]'
                              : ''
                          } ${
                            !accessible
                              ? 'bg-[#141619] border-[#333740] border-dashed text-[#6F6D68]'
                              : canInteract && !visited
                              ? 'bg-[#7A2E29] border-[#D6C7B8] text-[#F4F1EB] shadow-[0_4px_14px_rgba(0,0,0,0.6)]'
                              : visited
                              ? 'bg-[#1F2329] border-[#5D5A53] text-[#B2A999]'
                              : 'bg-[#171A1F] border-[#3D424C] text-[#7D7B75]'
                          }`}
                        >
                          {!accessible ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : visited ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : canInteract ? (
                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          ) : (
                            <span className="w-2 h-2 border border-current" />
                          )}
                        </span>

                        {/* Crisp Architectural Label Plate */}
                        <span
                          className={`mt-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs leading-tight whitespace-nowrap border transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#1E2127] border-[#B2A999] text-[#F4F1EB] font-semibold'
                              : !accessible
                              ? 'bg-[#111316]/90 border-[#262930] text-[#777570]'
                              : canInteract && !visited
                              ? 'bg-[#16181C]/95 border-[#5B564D] text-[#EFECE6] font-medium group-hover:border-[#B2A999]'
                              : 'bg-[#131519]/90 border-[#2D3139] text-[#B5B1A8] group-hover:border-[#555B66]'
                          }`}
                        >
                          <span>
                            {location.id === 'loc_meeting_room'
                              ? '마을 회관·야학'
                              : coord.shortName}
                          </span>
                          {hasSourceHint && canInteract && !visited && (
                            <BookOpen
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D69D96] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          {isCurrent && (
                            <span className="text-[9px] text-[#B2A999] hidden sm:inline">
                              · 현위치
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Map Legend Bar (Zero-Pill Clean Metadata) */}
          <div className="shrink-0 px-3 sm:px-4 py-1.5 border-t border-[#22262D] bg-[#121418] flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-[#8E8B84]">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#7A2E29] border border-[#D6C7B8] inline-block" />
                대화 가능
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#1F2329] border border-[#5D5A53] inline-block" />
                방문 완료
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#141619] border border-[#333740] border-dashed inline-block" />
                미해금
              </span>
            </div>
            <span className="hidden md:inline text-[#73716B]">
              장소를 두 번 클릭하면 바로 이동합니다
            </span>
          </div>
        </section>

        {/* Selected Location Inspector Panel (Right Sidebar on Desktop, Compact Action Dock on Mobile/Tablet) */}
        {selectedItem && (
          <aside
            aria-label="선택한 장소 정보"
            className="shrink-0 lg:col-span-4 xl:col-span-3 archival-panel flex flex-col overflow-hidden"
          >
            {/* Desktop Full Preview Image */}
            <div className="hidden lg:block relative aspect-[16/9] w-full shrink-0 border-b border-[#282C33] overflow-hidden">
              <ResilientBackground
                src={selectedBgSrc}
                alt={selectedItem.location.name}
                className="w-full h-full"
                imageClassName={
                  !selectedItem.accessible
                    ? 'grayscale opacity-40'
                    : 'saturate-[0.68] brightness-[0.86]'
                }
                overlayClassName="bg-gradient-to-t from-[#121417]/95 via-[#121417]/20 to-transparent"
              />
              <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-[#A49D91] truncate">
                    {selectedItem.location.district}
                  </p>
                  <h2 className="font-editorial text-lg font-semibold text-[#F1EEE8] leading-tight truncate">
                    {selectedItem.location.name}
                  </h2>
                </div>
                <span className="text-xs whitespace-nowrap shrink-0 text-[#D4D0C7]">
                  {!selectedItem.accessible
                    ? '미해금'
                    : selectedItem.visited
                    ? '방문 완료'
                    : selectedItem.visit
                    ? '대화 가능'
                    : '특이사항 없음'}
                </span>
              </div>
            </div>

            {/* Body Content — Compact Row on Mobile/Tablet, Full Dossier on Desktop */}
            <div className="p-3 sm:p-4 flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-y-auto">
              {/* Mobile/Tablet compact top row with thumbnail */}
              <div className="flex lg:hidden items-start gap-3">
                <div className="relative w-24 h-16 sm:w-32 sm:h-20 shrink-0 border border-[#2C3038] overflow-hidden">
                  <ResilientBackground
                    src={selectedBgSrc}
                    alt={selectedItem.location.name}
                    className="w-full h-full"
                    imageClassName={
                      !selectedItem.accessible
                        ? 'grayscale opacity-40'
                        : 'saturate-[0.68] brightness-[0.86]'
                    }
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[#9E978B] truncate">
                      {selectedItem.location.district}
                    </p>
                    <span className="text-[11px] text-[#C8C4BC] whitespace-nowrap shrink-0">
                      {!selectedItem.accessible
                        ? '미해금'
                        : selectedItem.visited
                        ? '방문 완료'
                        : selectedItem.visit
                        ? '대화 가능'
                        : '특이사항 없음'}
                    </span>
                  </div>
                  <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8] leading-tight truncate">
                    {selectedItem.location.name}
                  </h2>
                  {selectedItem.accessible && selectedItem.visit ? (
                    <div className="text-xs text-[#BEB9B0] space-y-0.5">
                      {selectedNpcNames && (
                        <p className="truncate">
                          <span className="text-[#86837C]">인물 · </span>
                          {selectedNpcNames}
                        </p>
                      )}
                      {selectedItem.visit.rewardHint && (
                        <p className="text-[#B2A999] flex items-center gap-1 truncate">
                          <BookOpen className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {selectedItem.visit.rewardHint}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8D8982] line-clamp-2">
                      {!selectedItem.accessible
                        ? selectedItem.location.lockedHint ??
                          '아직 접근할 수 없는 장소입니다.'
                        : selectedItem.location.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Desktop detailed dossier */}
              <div className="hidden lg:flex flex-col gap-3">
                <p className="text-xs xl:text-sm text-[#C4C0B8] leading-relaxed break-keep">
                  {selectedItem.location.description}
                </p>

                {!selectedItem.accessible && selectedItem.location.lockedHint && (
                  <div className="p-3 bg-[#111316] border border-[#2C3038] text-xs text-[#9C9991] leading-relaxed">
                    <span className="font-semibold text-[#CFCBC2] block mb-0.5">
                      해금 조건
                    </span>
                    {selectedItem.location.lockedHint}
                  </div>
                )}

                {selectedItem.accessible && selectedItem.visit && (
                  <div className="pt-2.5 border-t border-[#262A31] space-y-1.5 text-xs">
                    {selectedNpcNames && (
                      <p className="text-[#DFDCD5]">
                        <span className="text-[#8D8A83]">만날 인물 · </span>
                        {selectedNpcNames}
                      </p>
                    )}
                    {selectedItem.visit.rewardHint && (
                      <p className="text-[#B2A999] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedItem.visit.rewardHint}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2.5 border-t border-[#24282F]">
                  <p className="text-[11px] font-semibold text-[#8E8B84] mb-1">
                    역사 참고
                  </p>
                  <p className="text-xs text-[#9A978F] leading-relaxed break-keep">
                    {selectedItem.location.historicalNote}
                  </p>
                </div>
              </div>

              {/* Action CTA Button */}
              <div className="pt-1 shrink-0">
                {selectedCanInteract && selectedItem.visit ? (
                  <button
                    type="button"
                    onClick={() =>
                      onVisitLocation(
                        selectedItem.location,
                        selectedItem.visit!.startNodeId,
                        selectedItem.visitKey
                      )
                    }
                    className={`w-full min-h-[44px] sm:min-h-[46px] px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selectedItem.visited
                        ? 'bg-[#1B1E23] hover:bg-[#24282F] text-[#D8D4CC] border border-[#3E434D]'
                        : 'bg-[#7A2E29] hover:bg-[#8C3731] active:bg-[#692621] text-[#F4F1EB] border border-[#96453F]'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 shrink-0 opacity-90" />
                      <span className="truncate">
                        {selectedItem.visited ? '다시 방문 · ' : '이동하기 · '}
                        {selectedItem.visit.activityLabel}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                ) : (
                  <div className="min-h-[42px] px-3.5 py-2 bg-[#111316] border border-[#25282F] text-xs text-[#7D7B75] flex items-center gap-2">
                    {!selectedItem.accessible ? (
                      <>
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>아직 접근할 수 없는 장소입니다.</span>
                      </>
                    ) : (
                      <span>이번 장에서는 새로운 대화가 없습니다.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
