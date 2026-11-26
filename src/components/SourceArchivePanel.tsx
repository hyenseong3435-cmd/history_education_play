import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
    <figure className="bg-[#EFECE4] border border-[#C8C2B5] p-3 space-y-2">
      <div className="relative group flex justify-center bg-[#181715]/5 overflow-hidden">
        <img
          src={activeUrl}
          alt={caption ?? title}
          className="max-h-[340px] sm:max-h-[380px] w-auto object-contain cursor-zoom-in"
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
          className="absolute bottom-2 right-2 px-2.5 py-1 bg-[#14161A]/85 hover:bg-[#14161A] text-[#F1EEE8] text-[11px] flex items-center gap-1 border border-[#4A4E57] cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>크게 보기</span>
        </button>
      </div>
      {caption && (
        <figcaption className="text-xs text-[#393630] leading-relaxed break-keep">
          <strong>▲ 사료 사진: </strong>
          {caption}
          {credit && <span className="text-[#6B665D] ml-1.5">({credit})</span>}
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
  const [zoomedImage, setZoomedImage] = useState<{
    url: string;
    caption: string;
  } | null>(null);

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
        if (isSourceUnlocked(found)) {
          onMarkSourceRead(found.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceId]);

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
      if (isSourceUnlocked(first)) {
        onMarkSourceRead(first.id);
      }
    }
  };

  const handleSelectSource = (src: HistoricalSource) => {
    setSelectedSourceId(src.id);
    setPageIndex(0);
    if (isSourceUnlocked(src)) {
      onMarkSourceRead(src.id);
    }
  };

  // Build paginated view: custom source pages + final commentary/fact-vs-fiction summary page
  const contentPages = activeSource.pages ?? [];
  const totalPages = contentPages.length + 1;
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const isCommentaryPage = safePageIndex === contentPages.length;
  const currentPage = !isCommentaryPage ? contentPages[safePageIndex] : null;

  return (
    <div className="space-y-4">
      {/* Category Navigation Bar: 공통 사료 / 각 직업군 사료 / 참고 자료 */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#292D34] pb-3">
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
              className={`min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                isCurrent
                  ? 'bg-[#7A2E29] text-[#F4F1EB] border-[#96453F]'
                  : 'bg-[#14161A] text-[#C8C4BC] border-[#2C3037] hover:border-[#515763]'
              }`}
            >
              {tab.label}{' '}
              <span className="font-data text-[11px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Sources inside active category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {categorySources.map((src) => {
          const srcUnlocked = isSourceUnlocked(src);
          const read = state.readSources.includes(src.id);
          const selected = src.id === activeSource.id;
          const hasPhoto = Boolean(
            src.imageUrl || src.pages?.some((p) => Boolean(p.imageUrl))
          );

          return (
            <button
              key={src.id}
              type="button"
              onClick={() => handleSelectSource(src)}
              className={`min-h-[52px] px-3 py-2 text-left border transition-colors cursor-pointer ${
                selected
                  ? 'bg-[#202328] border-[#B2A999] text-[#F4F1EB]'
                  : srcUnlocked
                  ? 'bg-[#17191D] border-[#2C3037] hover:border-[#4D535E] text-[#CFCBC2]'
                  : 'bg-[#121417] border-[#22252B] text-[#6E6C67]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 text-xs font-semibold">
                <span className="flex items-center gap-1.5 truncate">
                  <span>{src.code}</span>
                  {hasPhoto && (
                    <ImageIcon
                      className="w-3.5 h-3.5 text-[#D4A79A] shrink-0"
                      aria-label="사진 자료 포함"
                    />
                  )}
                </span>
                {!srcUnlocked ? (
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                ) : read || src.alwaysUnlocked || unlockAll ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A49B8C] shrink-0" />
                ) : (
                  <span className="text-[11px] text-[#D49790] shrink-0">
                    미열람
                  </span>
                )}
              </div>
              <p className="text-[11px] truncate opacity-85 mt-0.5">
                {srcUnlocked ? src.title : '탐색으로 해금'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Source Paginated Document */}
      {!unlocked ? (
        <div className="p-6 bg-[#111316] border border-[#292D34] text-center space-y-2">
          <Lock className="w-6 h-6 mx-auto text-[#7B7973]" />
          <p className="font-editorial text-base text-[#D4D0C7]">
            아직 획득하지 못한 사료입니다 ({activeSource.code})
          </p>
          <p className="text-xs sm:text-sm text-[#8F8C85]">
            관련 사건({activeSource.relatedEvent})을 진행하거나 면사무소·주재소·들말을
            탐색하면 열람할 수 있습니다.
          </p>
        </div>
      ) : (
        <article className="hanji-surface border border-[#BDB7A9] overflow-hidden flex flex-col">
          {/* Document Header */}
          <header className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3.5 border-b border-[#C8C2B5] space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F2C27] font-semibold">
                <span>{activeSource.code}</span>
                <span aria-hidden="true">·</span>
                <span>{activeSource.period}</span>
              </div>
              <span className="font-data text-xs font-semibold text-[#544F47] bg-[#E3DDD1] border border-[#C2BCAE] px-2 py-0.5">
                페이지 {safePageIndex + 1} / {totalPages}
              </span>
            </div>
            <h3 className="font-editorial text-lg sm:text-2xl font-semibold text-[#1C1B18] leading-snug break-keep">
              {activeSource.title}
            </h3>
            <p className="text-xs text-[#545049]">
              출처: {activeSource.citation}
            </p>
          </header>

          {/* Current Page Body */}
          <div className="p-4 sm:p-6 space-y-4">
            {currentPage && (
              <>
                <div className="space-y-0.5">
                  <h4 className="font-editorial text-base sm:text-lg font-semibold text-[#231F1B]">
                    {currentPage.title}
                  </h4>
                  {currentPage.subtitle && (
                    <p className="text-xs text-[#6B665D]">
                      {currentPage.subtitle}
                    </p>
                  )}
                </div>

                {/* Archival Photo Block (original unmanipulated files only) */}
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

                {currentPage.body && (
                  <p className="text-xs sm:text-sm text-[#262420] leading-[1.82] break-keep whitespace-pre-line">
                    {currentPage.body}
                  </p>
                )}

                {(currentPage.originalText || currentPage.translationText) && (
                  <div
                    className={`grid grid-cols-1 ${
                      currentPage.originalText && currentPage.translationText
                        ? 'md:grid-cols-2'
                        : ''
                    } gap-3.5`}
                  >
                    {currentPage.originalText && (
                      <div className="p-4 bg-[#F5F2EB] border border-[#CCC6B9] space-y-1.5">
                        <p className="text-xs font-semibold text-[#6F2C27]">
                          사료 원문
                        </p>
                        <p className="text-xs sm:text-sm text-[#26231F] leading-[1.85] font-editorial whitespace-pre-line break-keep">
                          {currentPage.originalText}
                        </p>
                      </div>
                    )}
                    {currentPage.translationText && (
                      <div className="p-4 bg-[#F5F2EB] border border-[#CCC6B9] space-y-1.5">
                        <p className="text-xs font-semibold text-[#544F47]">
                          현대어 번역 · 요지
                        </p>
                        <p className="text-xs sm:text-sm text-[#26231F] leading-[1.85] whitespace-pre-line break-keep">
                          {currentPage.translationText}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentPage.table && (
                  <div className="overflow-x-auto border border-[#C6C0B2] bg-[#F5F2EB]">
                    <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                      <thead>
                        <tr className="bg-[#E3DDD1] border-b border-[#C6C0B2]">
                          {currentPage.table.headers.map((h, i) => (
                            <th
                              key={i}
                              className="p-2.5 font-semibold text-[#2B2823] border-r last:border-r-0 border-[#CCC6B9]"
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
                            className="border-b last:border-b-0 border-[#D5CFC2] align-top"
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="p-2.5 text-[#2D2A26] leading-relaxed whitespace-pre-line border-r last:border-r-0 border-[#D5CFC2]"
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
                  <ul className="space-y-1.5 text-xs sm:text-sm text-[#2B2823] leading-[1.78]">
                    {currentPage.bullets.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 break-keep">
                        <span className="text-[#6F2C27] font-bold mt-0.5">·</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {currentPage.footnote && (
                  <p className="p-3 bg-[#E3DDD1] border border-[#C2BCAE] text-xs text-[#2B2823] leading-relaxed break-keep">
                    {currentPage.footnote}
                  </p>
                )}
              </>
            )}

            {/* Final Page of Each Source: Historical Context, Fact vs Fiction & Gameplay Insight */}
            {isCommentaryPage && (
              <div className="space-y-3.5 text-xs sm:text-sm text-[#262420] leading-[1.82]">
                <div>
                  <p className="text-xs font-bold text-[#6F2C27] mb-1">
                    실제 역사적 사실 및 제도 맥락
                  </p>
                  <p className="break-keep">{activeSource.historicalContext}</p>
                </div>

                <div className="pt-2.5 border-t border-[#CFC9BC]">
                  <p className="text-xs font-bold text-[#444039] mb-1">
                    역사적 사실과 게임 각색의 구분
                  </p>
                  <p className="text-[#393630] break-keep">
                    {activeSource.factVsFiction}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#CFC9BC]">
                  <p className="text-xs font-bold text-[#444039] mb-1">
                    사료 해설
                  </p>
                  <p className="text-[#393630] break-keep">
                    {activeSource.commentary}
                  </p>
                </div>

                <div className="p-3 bg-[#E3DDD1] border border-[#C2BCAE] text-xs text-[#2B2823] flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-[#6F2C27] shrink-0 mt-0.5" />
                  <span className="break-keep">{activeSource.gameplayInsight}</span>
                </div>
              </div>
            )}
          </div>

          {/* Built-in Pagination Footer for Readability */}
          <footer className="px-4 sm:px-6 py-3 bg-[#E6E0D4] border-t border-[#C8C2B5] flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled={safePageIndex === 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              className="min-h-[38px] px-3 py-1.5 bg-[#F5F2EB] hover:bg-[#FAF8F4] disabled:opacity-45 disabled:cursor-not-allowed text-[#262420] border border-[#BDB7A9] text-xs sm:text-sm font-medium flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>이전 페이지</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPageIndex(idx)}
                  aria-label={`${idx + 1}페이지로 이동`}
                  className={`min-w-[32px] min-h-[32px] px-2 text-xs font-data border transition-colors cursor-pointer ${
                    idx === safePageIndex
                      ? 'bg-[#6F2C27] text-[#F4F1EB] border-[#6F2C27] font-semibold'
                      : 'bg-[#F5F2EB] text-[#45413B] border-[#C6C0B2] hover:bg-[#EFECE4]'
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
              className="min-h-[38px] px-3 py-1.5 bg-[#6F2C27] hover:bg-[#82352F] disabled:opacity-45 disabled:cursor-not-allowed text-[#F4F1EB] border border-[#6F2C27] text-xs sm:text-sm font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>다음 페이지</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </footer>
        </article>
      )}

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
                className="min-w-[40px] min-h-[40px] bg-[#181A1E] border border-[#4A4E57] text-[#F1EEE8] flex items-center justify-center cursor-pointer"
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
