import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Lock,
  X,
  ZoomIn,
} from 'lucide-react';
import { SOURCES } from '../data';
import type { GameState, HistoricalSource, SourceCategory } from '../types/game';

interface SourceArchivePanelProps {
  initialSourceId: string | null;
  state: GameState;
  unlockAll?: boolean;
  onMarkSourceRead: (sourceId: string) => void;
}

const CATEGORY_TABS: Array<{ id: SourceCategory; label: string }> = [
  { id: 'common', label: '공통 사료' },
  { id: 'farmer', label: '농사꾼 사료' },
  { id: 'clerk', label: '면서기 사료' },
  { id: 'police_assistant', label: '순사보 사료' },
  { id: 'reference', label: '참고 자료' },
];

const CATEGORY_LABEL_BY_ID: Record<SourceCategory, string> = {
  common: '공통 사료',
  farmer: '농사꾼 사료',
  clerk: '면서기 사료',
  police_assistant: '순사보 사료',
  reference: '참고 자료',
};

interface OriginalTextBlock {
  label?: string;
  text: string;
}

/**
 * Splits verbatim original archival text into visually separated clause/paragraph cards
 * without omitting, rephrasing, or truncating a single character.
 */
function splitOriginalTextBlocks(rawText: string): OriginalTextBlock[] {
  const paragraphs = rawText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks: OriginalTextBlock[] = [];
  const clauseStartRegex = /^(제\d+조(?:\([^)]+\))?|一\.|문\(問\):|답\(答\):)/;

  for (const para of paragraphs) {
    const lines = para
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const clauseLineCount = lines.filter((l) => clauseStartRegex.test(l)).length;
    if (lines.length > 1 && clauseLineCount >= 2) {
      let currentLines: string[] = [];
      for (const line of lines) {
        if (clauseStartRegex.test(line) && currentLines.length > 0) {
          const joined = currentLines.join('\n');
          const match = joined.match(clauseStartRegex);
          blocks.push({ label: match?.[1], text: joined });
          currentLines = [line];
        } else {
          currentLines.push(line);
        }
      }
      if (currentLines.length > 0) {
        const joined = currentLines.join('\n');
        const match = joined.match(clauseStartRegex);
        blocks.push({ label: match?.[1], text: joined });
      }
    } else {
      const match = para.match(clauseStartRegex);
      blocks.push({ label: match?.[1], text: para });
    }
  }

  return blocks;
}

function ArchivalPhotoFigure({
  imageUrl,
  fallbackImageUrl,
  caption,
  credit,
  title,
  onZoom,
}: {
  imageUrl: string;
  fallbackImageUrl?: string;
  caption?: string;
  credit?: string;
  title: string;
  onZoom: (url: string, caption: string) => void;
}) {
  const candidates = useMemo(() => {
    const list: string[] = [encodeURI(imageUrl)];
    if (fallbackImageUrl) {
      const encodedFallback = encodeURI(fallbackImageUrl);
      if (!list.includes(encodedFallback)) {
        list.push(encodedFallback);
      }
    }
    return list;
  }, [imageUrl, fallbackImageUrl]);

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setHidden(false);
  }, [imageUrl, fallbackImageUrl]);

  if (hidden || candidateIdx >= candidates.length) {
    return null;
  }

  const activeUrl = candidates[candidateIdx];

  return (
    <figure className="bg-[#F3EFE6] border border-[#D4CBB9] p-3.5 sm:p-4 space-y-2.5">
      <div className="relative group flex justify-center bg-[#181715]/5 overflow-hidden">
        <img
          src={activeUrl}
          alt={caption ?? title}
          className="max-h-[340px] sm:max-h-[400px] w-auto object-contain cursor-zoom-in"
          onError={() => {
            if (candidateIdx + 1 < candidates.length) {
              setCandidateIdx((prev) => prev + 1);
            } else {
              setHidden(true);
            }
          }}
          onClick={() => onZoom(activeUrl, caption ?? title)}
        />
        <button
          type="button"
          onClick={() => onZoom(activeUrl, caption ?? title)}
          className="absolute bottom-2.5 right-2.5 min-h-[34px] px-2.5 py-1 bg-[#14161A]/88 hover:bg-[#14161A] text-[#F1EEE8] text-xs flex items-center gap-1.5 border border-[#4A4E57] cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>크게 보기</span>
        </button>
      </div>
      {caption && (
        <figcaption className="text-xs sm:text-[13px] text-[#4A453D] leading-relaxed break-keep">
          <strong className="text-[#231F1B]">▲ 사료 사진: </strong>
          {caption}
          {credit && <span className="text-[#6F6A60] ml-1.5">({credit})</span>}
        </figcaption>
      )}
    </figure>
  );
}

export function SourceArchivePanel({
  initialSourceId,
  state,
  unlockAll = false,
  onMarkSourceRead,
}: SourceArchivePanelProps) {
  const initialSource = useMemo<HistoricalSource>(() => {
    if (initialSourceId) {
      const found = SOURCES.find((s) => s.id === initialSourceId);
      if (found) return found;
    }
    return SOURCES[0];
  }, [initialSourceId]);

  const [activeCategory, setActiveCategory] = useState<SourceCategory>(
    initialSource.category ?? 'common'
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialSource.id
  );
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [isOriginalExpanded, setIsOriginalExpanded] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<{
    url: string;
    caption: string;
  } | null>(null);

  const readerTopRef = useRef<HTMLElement | null>(null);

  const isSourceUnlocked = (src: HistoricalSource) =>
    unlockAll ||
    Boolean(src.alwaysUnlocked) ||
    state.screen === 'TITLE' ||
    state.screen === 'ENDING' ||
    state.unlockedSources.includes(src.id);

  useEffect(() => {
    if (initialSourceId) {
      const found = SOURCES.find((s) => s.id === initialSourceId);
      if (found) {
        setActiveCategory(found.category ?? 'common');
        setSelectedSourceId(found.id);
        setPageIndex(0);
        setIsOriginalExpanded(false);
        if (isSourceUnlocked(found)) {
          onMarkSourceRead(found.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceId]);

  // Always collapse original text by default when switching source or page
  useEffect(() => {
    setIsOriginalExpanded(false);
  }, [selectedSourceId, pageIndex]);

  const categorySources = useMemo(
    () => SOURCES.filter((s) => (s.category ?? 'common') === activeCategory),
    [activeCategory]
  );

  const activeSource =
    categorySources.find((s) => s.id === selectedSourceId) ??
    categorySources[0] ??
    SOURCES[0];

  const unlocked = isSourceUnlocked(activeSource);

  const handleCategoryChange = (cat: SourceCategory) => {
    setActiveCategory(cat);
    const first = SOURCES.find((s) => (s.category ?? 'common') === cat);
    if (first) {
      setSelectedSourceId(first.id);
      setPageIndex(0);
      setIsOriginalExpanded(false);
      if (isSourceUnlocked(first)) {
        onMarkSourceRead(first.id);
      }
    }
  };

  const handleSelectSource = (src: HistoricalSource) => {
    setSelectedSourceId(src.id);
    setPageIndex(0);
    setIsOriginalExpanded(false);
    if (isSourceUnlocked(src)) {
      onMarkSourceRead(src.id);
    }
    // On smaller viewports, smoothly bring the selected reading pane into view
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.setTimeout(() => {
        readerTopRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 40);
    }
  };

  // Build paginated view: custom source pages + final commentary/fact-vs-fiction summary page
  const contentPages = activeSource.pages ?? [];
  const totalPages = contentPages.length + 1;
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const isCommentaryPage = safePageIndex === contentPages.length;
  const currentPage = !isCommentaryPage ? contentPages[safePageIndex] : null;

  const anyPageHasOriginal = contentPages.some((p) => Boolean(p.originalText));
  const activeOriginalText = useMemo(() => {
    if (isCommentaryPage) return null;
    if (currentPage?.originalText) return currentPage.originalText;
    if (
      safePageIndex === 0 &&
      !anyPageHasOriginal &&
      activeSource.originalText &&
      activeSource.category !== 'reference'
    ) {
      return activeSource.originalText;
    }
    return null;
  }, [
    isCommentaryPage,
    currentPage,
    safePageIndex,
    anyPageHasOriginal,
    activeSource,
  ]);

  const originalBlocks = useMemo(
    () => (activeOriginalText ? splitOriginalTextBlocks(activeOriginalText) : []),
    [activeOriginalText]
  );

  // Show top-level translationText as core summary on page 1 if the page itself has no body/translationText
  const showFallbackCoreSummary = Boolean(
    !isCommentaryPage &&
      safePageIndex === 0 &&
      currentPage &&
      !currentPage.body &&
      !currentPage.translationText &&
      activeSource.translationText
  );

  const activeCategoryLabel =
    CATEGORY_LABEL_BY_ID[activeSource.category ?? 'common'];

  return (
    <div className="space-y-5">
      {/* Category Navigation Bar: 공통 사료 / 각 직업군 사료 / 참고 자료 */}
      <nav
        aria-label="사료 분류"
        className="flex flex-wrap items-center gap-2 border-b border-[#292D34] pb-3.5"
      >
        {CATEGORY_TABS.map((tab) => {
          const isCurrent = activeCategory === tab.id;
          const count = SOURCES.filter(
            (s) => (s.category ?? 'common') === tab.id
          ).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              className={`min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                isCurrent
                  ? 'bg-[#7A2E29] text-[#F4F1EB] border-[#96453F]'
                  : 'bg-[#14161A] text-[#C8C4BC] border-[#2C3037] hover:border-[#595F6B] hover:text-[#F1EEE8]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-data text-xs opacity-80 ml-1.5">
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Responsive Split Workspace: PC 2-column (Card List + Reading Sheet), Mobile Vertical Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Card-Style Source List */}
        <aside
          aria-label="사료 목록"
          className="lg:col-span-4 space-y-3 lg:sticky lg:top-0"
        >
          <div className="flex items-center justify-between text-xs text-[#9E978B] pb-1">
            <span>{CATEGORY_LABEL_BY_ID[activeCategory]} 목록</span>
            <span className="font-data">{categorySources.length}건</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {categorySources.map((src) => {
              const srcUnlocked = isSourceUnlocked(src);
              const read = state.readSources.includes(src.id);
              const selected = src.id === activeSource.id;
              const hasPhoto = Boolean(
                src.imageUrl || src.pages?.some((p) => Boolean(p.imageUrl))
              );
              const catLabel = CATEGORY_LABEL_BY_ID[src.category ?? 'common'];
              const shortTheme = src.translationText || src.relatedEvent;

              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => handleSelectSource(src)}
                  aria-current={selected ? 'true' : undefined}
                  className={`w-full min-h-[104px] p-4 text-left border transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
                    selected
                      ? 'bg-[#21252C] border-[#C4B9A6] text-[#F5F2EC]'
                      : srcUnlocked
                      ? 'bg-[#16191E] border-[#2C3037] hover:border-[#595F6C] hover:bg-[#1B1E24] text-[#D8D4CC]'
                      : 'bg-[#121417] border-[#22252B] text-[#76746E]'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Quiet unboxed metadata line */}
                    <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
                      <span
                        className={`truncate ${
                          selected ? 'text-[#D6C9B3]' : 'text-[#9E978B]'
                        }`}
                      >
                        {catLabel} · {src.period}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {hasPhoto && (
                          <ImageIcon
                            className="w-3.5 h-3.5 text-[#D4A79A]"
                            aria-label="사진 자료 포함"
                          />
                        )}
                        {!srcUnlocked ? (
                          <Lock className="w-3.5 h-3.5 text-[#76746E]" />
                        ) : read || src.alwaysUnlocked || unlockAll ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#A49B8C]" />
                        ) : (
                          <span className="text-[11px] font-medium text-[#E0A199]">
                            미열람
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Clear title */}
                    <h3 className="font-editorial text-sm sm:text-[15px] font-semibold leading-snug break-keep">
                      {srcUnlocked ? src.title : `${src.code} · 탐색으로 해금`}
                    </h3>
                  </div>

                  {/* Short core-theme sentence */}
                  <p
                    className={`text-xs leading-relaxed line-clamp-2 break-keep ${
                      selected ? 'text-[#D2CEC5]' : 'text-[#9C9991]'
                    }`}
                  >
                    {srcUnlocked
                      ? shortTheme
                      : `관련 사건(${src.relatedEvent}) 진행 시 열람할 수 있습니다.`}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Structured Progressive Reading Sheet */}
        <section ref={readerTopRef} className="lg:col-span-8 min-w-0">
          {!unlocked ? (
            <div className="p-8 sm:p-10 bg-[#111316] border border-[#292D34] text-center space-y-3">
              <Lock className="w-7 h-7 mx-auto text-[#7B7973]" />
              <p className="font-editorial text-lg text-[#DFDCD5]">
                아직 획득하지 못한 사료입니다 ({activeSource.code})
              </p>
              <p className="text-sm text-[#98958E] leading-relaxed max-w-md mx-auto break-keep">
                관련 사건({activeSource.relatedEvent})을 진행하거나 면사무소·주재소·들말을
                탐색하면 열람할 수 있습니다.
              </p>
            </div>
          ) : (
            <article className="bg-[#FAF9F6] text-[#22201C] border border-[#C9C3B6] overflow-hidden flex flex-col">
              {/* Stage ①: 사료 기본 정보 */}
              <header className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 bg-[#F4F1EA] border-b border-[#D4CEBF] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p className="text-[#6F2C27] font-semibold tracking-wide">
                    {activeCategoryLabel} · {activeSource.code} · {activeSource.period}
                  </p>
                  <span className="font-data text-xs text-[#59544B]">
                    페이지 {safePageIndex + 1} / {totalPages}
                  </span>
                </div>

                <h3 className="font-editorial text-xl sm:text-2xl lg:text-[26px] font-semibold text-[#181714] leading-[1.35] break-keep">
                  {activeSource.title}
                </h3>

                <p className="text-xs sm:text-[13px] text-[#6B665D] leading-relaxed break-keep">
                  출처: {activeSource.citation}
                </p>
              </header>

              {/* Reading Body Container — optimal reading measure & generous spacing */}
              <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-7 max-w-[74ch]">
                {currentPage && (
                  <>
                    {/* Section Title */}
                    <div className="space-y-1.5 pb-4 border-b border-[#E5E0D5]">
                      <h4 className="font-editorial text-lg sm:text-xl font-semibold text-[#1E1C18] leading-snug break-keep">
                        {currentPage.title}
                      </h4>
                      {currentPage.subtitle && (
                        <p className="text-xs sm:text-sm text-[#6E6960] break-keep">
                          {currentPage.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Archival Photo Block (unmodified original files only) */}
                    {currentPage.imageUrl && (
                      <ArchivalPhotoFigure
                        imageUrl={currentPage.imageUrl}
                        fallbackImageUrl={currentPage.fallbackImageUrl}
                        caption={currentPage.imageCaption}
                        credit={currentPage.imageCredit}
                        title={currentPage.title}
                        onZoom={(url, caption) => setZoomedImage({ url, caption })}
                      />
                    )}

                    {/* Stage ②: 사료 핵심 내용 (Clean bright neutral surface, Sans-serif 16–17px) */}
                    {(showFallbackCoreSummary ||
                      currentPage.body ||
                      currentPage.translationText ||
                      currentPage.table ||
                      (currentPage.bullets && currentPage.bullets.length > 0)) && (
                      <div className="space-y-5 font-sans text-[15px] sm:text-base lg:text-[17px] text-[#262420] leading-[1.78]">
                        {showFallbackCoreSummary && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wider uppercase text-[#6F2C27]">
                              사료 핵심 내용
                            </p>
                            <p className="break-keep">
                              {activeSource.translationText}
                            </p>
                          </div>
                        )}

                        {currentPage.body && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wider uppercase text-[#59544B]">
                              사료 핵심 내용
                            </p>
                            <p className="break-keep whitespace-pre-line">
                              {currentPage.body}
                            </p>
                          </div>
                        )}

                        {currentPage.translationText && (
                          <div className="p-4 sm:p-5 bg-[#FFFFFF] border border-[#DFD9CC] space-y-2">
                            <p className="text-xs font-semibold tracking-wider text-[#59544B]">
                              현대어 풀이 · 핵심 내용
                            </p>
                            <p className="text-[#22201C] leading-[1.82] whitespace-pre-line break-keep">
                              {currentPage.translationText}
                            </p>
                          </div>
                        )}

                        {currentPage.table && (
                          <div className="overflow-x-auto border border-[#D4CEBF] bg-[#FFFFFF]">
                            <table className="w-full text-left border-collapse text-sm sm:text-[15px]">
                              <thead>
                                <tr className="bg-[#EFEBE2] border-b border-[#D4CEBF]">
                                  {currentPage.table.headers.map((h, i) => (
                                    <th
                                      key={i}
                                      className="p-3 sm:p-3.5 font-semibold text-[#23201C] border-r last:border-r-0 border-[#DDD6C7]"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {currentPage.table.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className="border-b last:border-b-0 border-[#E5DFD3] align-top"
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="p-3 sm:p-3.5 text-[#2B2823] leading-[1.7] whitespace-pre-line border-r last:border-r-0 border-[#E5DFD3]"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {currentPage.bullets && currentPage.bullets.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold tracking-wider text-[#59544B]">
                              핵심 정리
                            </p>
                            <ul className="space-y-3">
                              {currentPage.bullets.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2.5 break-keep"
                                >
                                  <span className="text-[#6F2C27] font-bold mt-0.5 shrink-0">
                                    ·
                                  </span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stage ③: 원문 펼쳐보기 / 원문 접기 (Collapsed by default, Warm Beige + Serif) */}
                    {activeOriginalText && (
                      <section className="pt-2 space-y-3.5">
                        <button
                          type="button"
                          onClick={() => setIsOriginalExpanded((prev) => !prev)}
                          aria-expanded={isOriginalExpanded}
                          className="w-full min-h-[50px] px-4 sm:px-5 py-3 bg-[#EFE9DC] hover:bg-[#E7DFCE] border border-[#C9BFA9] text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-[#6F2C27] shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-sm sm:text-[15px] font-semibold text-[#1F1D19]">
                                {isOriginalExpanded ? '원문 접기' : '원문 펼쳐보기'}
                              </span>
                              <span className="block text-xs text-[#6A6459]">
                                {isOriginalExpanded
                                  ? '사료 원문 전문을 확인하고 있습니다'
                                  : `사료 원문 전문 보기 (${originalBlocks.length}개 조항·문단)`}
                              </span>
                            </div>
                          </div>
                          {isOriginalExpanded ? (
                            <ChevronUp className="w-5 h-5 text-[#5A544A] shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#5A544A] shrink-0" />
                          )}
                        </button>

                        {isOriginalExpanded && (
                          <div className="p-4 sm:p-6 bg-[#F2ECE0] border border-[#D4CBB7] space-y-4">
                            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#DCD3C0]">
                              <p className="text-xs font-semibold tracking-wider text-[#6F2C27]">
                                사료 원문 (전문)
                              </p>
                              <span className="text-xs text-[#6F695E]">
                                원문 그대로 수록
                              </span>
                            </div>

                            <div className="space-y-3.5">
                              {originalBlocks.map((block, bIdx) => (
                                <div
                                  key={bIdx}
                                  className="p-4 sm:p-5 bg-[#F9F6EE] border border-[#DDD5C3] space-y-2"
                                >
                                  {block.label && (
                                    <p className="text-xs font-semibold text-[#6F2C27] tracking-wide">
                                      {block.label}
                                    </p>
                                  )}
                                  <p className="font-editorial text-[15px] sm:text-base lg:text-[17px] text-[#211E19] leading-[1.88] whitespace-pre-line break-keep">
                                    {block.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                    {/* Quiet Footnote */}
                    {currentPage.footnote && (
                      <aside className="p-4 bg-[#F1ECE2] border border-[#D5CEBE] text-sm text-[#35322C] leading-[1.75] break-keep">
                        {currentPage.footnote}
                      </aside>
                    )}
                  </>
                )}

                {/* Final Page of Each Source: Historical Context, Fact vs Fiction (BOLD) & Commentary */}
                {isCommentaryPage && (
                  <div className="space-y-6 font-sans text-[15px] sm:text-base lg:text-[17px] text-[#262420] leading-[1.8]">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold tracking-wider text-[#6F2C27]">
                        실제 역사적 사실 및 제도 맥락
                      </p>
                      <p className="break-keep">{activeSource.historicalContext}</p>
                    </div>

                    <div className="pt-5 border-t border-[#DFD9CC] space-y-2">
                      <p className="text-xs font-bold tracking-wider text-[#1C1A17]">
                        학습 안내 · 역사적 사실과 게임 각색의 구분
                      </p>
                      <p className="font-bold text-[#1A1815] break-keep leading-[1.8]">
                        {activeSource.factVsFiction}
                      </p>
                    </div>

                    <div className="pt-5 border-t border-[#DFD9CC] space-y-2">
                      <p className="text-xs font-semibold tracking-wider text-[#545049]">
                        사료 해설
                      </p>
                      <p className="text-[#2E2B26] break-keep">
                        {activeSource.commentary}
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 bg-[#EFEBE2] border border-[#CFC8B9] text-sm sm:text-[15px] text-[#26231F] leading-[1.75] flex items-start gap-3">
                      <BookOpen className="w-4 h-4 text-[#6F2C27] shrink-0 mt-1" />
                      <span className="break-keep">
                        {activeSource.gameplayInsight}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Built-in Pagination Footer */}
              <footer className="px-5 sm:px-8 py-4 bg-[#EFEBE2] border-t border-[#D4CEBF] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={safePageIndex === 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  className="min-h-[44px] px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#FFFFFF] disabled:opacity-45 disabled:cursor-not-allowed text-[#262420] border border-[#C7C0B1] text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>이전 페이지</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPageIndex(idx)}
                      aria-label={`${idx + 1}페이지로 이동`}
                      className={`min-w-[38px] min-h-[38px] px-2.5 text-xs sm:text-sm font-data border transition-colors cursor-pointer ${
                        idx === safePageIndex
                          ? 'bg-[#6F2C27] text-[#F4F1EB] border-[#6F2C27] font-semibold'
                          : 'bg-[#FAF9F6] text-[#45413B] border-[#CFC8B9] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={safePageIndex >= totalPages - 1}
                  onClick={() =>
                    setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                  }
                  className="min-h-[44px] px-3.5 py-2 bg-[#6F2C27] hover:bg-[#82352F] disabled:opacity-45 disabled:cursor-not-allowed text-[#F4F1EB] border border-[#6F2C27] text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span>다음 페이지</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </footer>
            </article>
          )}
        </section>
      </div>

      {/* Fullscreen Archival Photo Lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90dvh] flex flex-col gap-3 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="min-w-[44px] min-h-[44px] bg-[#181A1E] border border-[#4A4E57] text-[#F1EEE8] flex items-center justify-center cursor-pointer"
                aria-label="사진 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={zoomedImage.url}
              alt={zoomedImage.caption}
              className="max-h-[75dvh] w-auto object-contain border border-[#515763] bg-[#0E0F11]"
            />
            <p className="text-xs sm:text-sm text-[#E6E3DC] text-center max-w-2xl break-keep">
              {zoomedImage.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
