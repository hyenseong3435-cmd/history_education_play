import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Lock } from 'lucide-react';
import { CHARACTERS_BY_ID, LOCATIONS_BY_ID } from '../data';
import { evaluateCondition } from '../engine/gameEngine';
import type {
  ChoiceOption,
  DialogueNode,
  GameSettings,
  GameState,
} from '../types/game';
import { PixelSprite } from './PixelSprite';
import { ResilientBackground } from './ResilientBackground';

interface VisualNovelStageProps {
  node: DialogueNode;
  state: GameState;
  settings: GameSettings;
  isModalOpen: boolean;
  onAdvance: () => void;
  onSelectChoice: (choice: ChoiceOption) => void;
  onOpenSourceById: (sourceId: string) => void;
}

const SPEED_MS: Record<GameSettings['textSpeed'], number> = {
  slow: 38,
  normal: 20,
  fast: 9,
  instant: 0,
};

export function VisualNovelStage({
  node,
  state,
  settings,
  isModalOpen,
  onAdvance,
  onSelectChoice,
  onOpenSourceById,
}: VisualNovelStageProps) {
  const [displayedCount, setDisplayedCount] = useState<number>(
    settings.textSpeed === 'instant' ? node.text.length : 0
  );

  const isTypingDone = displayedCount >= node.text.length;
  const visibleText = node.text.slice(0, displayedCount);
  const hasChoices = Boolean(node.choices && node.choices.length > 0);

  useEffect(() => {
    if (settings.textSpeed === 'instant') {
      setDisplayedCount(node.text.length);
      return;
    }
    setDisplayedCount(0);
    const delay = SPEED_MS[settings.textSpeed];
    const timer = window.setInterval(() => {
      setDisplayedCount((prev) => {
        if (prev >= node.text.length) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => window.clearInterval(timer);
  }, [node.id, node.text, settings.textSpeed]);

  const handleBoxAction = useCallback(() => {
    if (!isTypingDone) {
      setDisplayedCount(node.text.length);
      return;
    }
    if (!hasChoices) {
      onAdvance();
    }
  }, [isTypingDone, node.text.length, hasChoices, onAdvance]);

  const evaluatedChoices = (node.choices ?? [])
    .map((choice) => {
      const unlocked = evaluateCondition(choice.condition, state);
      return { choice, unlocked };
    })
    .filter((item) => item.unlocked || item.choice.showWhenLocked);

  useEffect(() => {
    if (isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === ' ' || e.key === 'Enter') {
        if (!isTypingDone) {
          e.preventDefault();
          setDisplayedCount(node.text.length);
        } else if (!hasChoices) {
          e.preventDefault();
          onAdvance();
        }
      } else if (
        isTypingDone &&
        hasChoices &&
        ['1', '2', '3', '4'].includes(e.key)
      ) {
        const idx = Number(e.key) - 1;
        const target = evaluatedChoices[idx];
        if (target && target.unlocked) {
          e.preventDefault();
          onSelectChoice(target.choice);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isModalOpen,
    isTypingDone,
    hasChoices,
    node.text.length,
    onAdvance,
    evaluatedChoices,
    onSelectChoice,
  ]);

  const location = LOCATIONS_BY_ID[node.locationId];
  const bgUrl = node.background || location?.background || '';

  const speakerChar = node.speakerId ? CHARACTERS_BY_ID[node.speakerId] : null;
  const speakerDisplayName = node.speakerName ?? speakerChar?.name ?? '해설';
  const speakerDisplayRole =
    node.speakerRole ?? (node.speakerId ? speakerChar?.role : undefined);

  const stageCharacters = node.characters ?? [];
  const forceSplitPortrait = settings.displayRatio === 'portrait';

  const renderSprites = (sizeClass: string) =>
    stageCharacters.map((sc, index) => {
      const charData = CHARACTERS_BY_ID[sc.characterId];
      if (!charData) return null;
      const exprKey = sc.expression ?? charData.defaultExpression;
      const spriteSrc =
        charData.expressions[exprKey] ??
        charData.expressions[charData.defaultExpression];
      const isSpeaking =
        !sc.dimmed && (!node.speakerId || node.speakerId === sc.characterId);

      const posClass =
        sc.position === 'left'
          ? 'left-3 sm:left-10 md:left-16'
          : sc.position === 'right'
          ? 'right-3 sm:right-10 md:right-16'
          : 'left-1/2 -translate-x-1/2';

      return (
        <div
          key={`${sc.characterId}-${sc.position}-${index}`}
          className={`absolute bottom-0 ${posClass} h-full flex items-end transition-all duration-200 ${
            isSpeaking
              ? 'opacity-100 scale-100 z-20'
              : 'opacity-65 scale-[0.95] brightness-70 z-10'
          }`}
        >
          <PixelSprite
            src={spriteSrc}
            alt={charData.name}
            fallbackName={charData.name}
            className={sizeClass}
          />
        </div>
      );
    });

  const renderTopBadges = () => (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-5 pt-2.5 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121417]/90 border border-[#2F333B] text-[11px] sm:text-xs text-[#D6D2C9]">
        <span className="font-medium text-[#F1EEE8]">
          {location?.name ?? '송현면'}
        </span>
        {location?.district && (
          <>
            <span aria-hidden="true" className="text-[#6F6D68]">
              ·
            </span>
            <span className="text-[#9E9B94]">{location.district}</span>
          </>
        )}
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 max-w-full">
        <div className="hidden sm:block px-2.5 py-1 bg-[#121417]/86 border border-[#2A2D34] text-[11px] font-editorial text-[#ABA59A]">
          끝을 알 수 없는 지배 · 10년? 50년? 영원히?
        </div>
        {node.historicalBadge && (
          <div className="max-w-xs sm:max-w-sm">
            {node.historicalBadge.kind === 'source' &&
            node.historicalBadge.sourceId ? (
              <button
                type="button"
                onClick={() => onOpenSourceById(node.historicalBadge!.sourceId!)}
                className="px-2.5 py-1 bg-[#181A1E]/95 hover:bg-[#23262C] border border-[#7E7668] text-[11px] sm:text-xs text-[#ECE8E0] flex items-center gap-1.5 text-left transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#B2A999] shrink-0" />
                <span className="line-clamp-1">{node.historicalBadge.label}</span>
              </button>
            ) : (
              <div className="px-2.5 py-1 bg-[#131519]/92 border border-[#32363E] text-[11px] sm:text-xs text-[#C6C2B9] line-clamp-1">
                {node.historicalBadge.label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const showChoices = hasChoices && isTypingDone;

  const renderChoices = (layout: 'mobile' | 'desktop') =>
    showChoices ? (
      <div
        role="group"
        aria-label="선택지"
        className="w-full space-y-2"
      >
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] sm:text-xs font-medium tracking-wide text-[#B2A999]">
            행동을 선택하세요
          </span>
          <span className="hidden sm:inline text-[11px] text-[#7D7A74] font-data">
            단축키 1 – {evaluatedChoices.length}
          </span>
        </div>

        <div
          className={
            layout === 'desktop'
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5 max-h-[46dvh] overflow-y-auto overscroll-contain pr-0.5'
              : 'flex flex-col gap-2.5'
          }
        >
          {evaluatedChoices.map(({ choice, unlocked }, idx) => {
            const requiredSourceId = choice.condition?.requiredSources?.[0];
            const sourceIsUnlockedButUnread =
              Boolean(requiredSourceId) &&
              state.unlockedSources.includes(requiredSourceId!) &&
              !state.readSources.includes(requiredSourceId!);

            if (!unlocked) {
              return (
                <div
                  key={choice.id}
                  className="w-full px-3.5 py-3 bg-[#121417]/94 border border-[#282C33] text-[#83817B] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-medium flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>조건 미충족 선택지</span>
                    </p>
                    <p className="text-xs text-[#918E87]">
                      {choice.lockedReason ??
                        '특정 단서 또는 사료 열람이 필요합니다.'}
                    </p>
                  </div>
                  {sourceIsUnlockedButUnread && requiredSourceId && (
                    <button
                      type="button"
                      onClick={() => onOpenSourceById(requiredSourceId)}
                      className="min-h-[38px] px-3 py-1.5 bg-[#1B1E23] hover:bg-[#252930] text-[#E3DED4] border border-[#5B564D] text-xs font-medium flex items-center gap-1.5 self-start sm:self-center cursor-pointer whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#B2A999]" />
                      사료 열람하여 해금
                    </button>
                  )}
                </div>
              );
            }

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onSelectChoice(choice)}
                className="group w-full min-h-[54px] px-3.5 sm:px-4 py-3 bg-[#171A20]/96 hover:bg-[#21252D] active:bg-[#2A2F38] border border-[#444A55] hover:border-[#B5AC9C] active:border-[#C7BFA9] text-left transition-colors duration-150 flex items-start gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B2A999]"
              >
                <span className="font-data text-[11px] font-semibold text-[#C2B9A8] bg-[#22262E] border border-[#3E434E] group-hover:border-[#9E9586] w-6 h-6 flex items-center justify-center mt-0.5 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`block font-medium text-[#F2EFE9] leading-[1.6] break-keep ${
                      settings.textSize === 'large'
                        ? 'text-[16px] sm:text-[17px]'
                        : 'text-[14px] sm:text-[15px]'
                    }`}
                  >
                    {choice.text}
                  </span>
                  {choice.unlockTag && (
                    <span className="inline-block mt-1 text-[11px] text-[#B2A999] font-normal">
                      · {choice.unlockTag}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8B84] group-hover:text-[#D8D1C5] mt-1 shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const renderDialogueCard = (isSplitPanel: boolean, compact = false) => (
    <div
      onClick={handleBoxAction}
      role={!hasChoices ? 'button' : undefined}
      tabIndex={!hasChoices ? 0 : undefined}
      onKeyDown={(e) => {
        if (!hasChoices && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleBoxAction();
        }
      }}
      className={`${
        isSplitPanel
          ? `bg-[#14161A] border border-[#2D3139] ${
              compact ? 'px-3.5 py-2.5' : 'p-3.5 sm:p-4'
            } flex flex-col justify-between`
          : `dialogue-box ${compact ? 'px-4 py-3 sm:px-5 sm:py-3.5' : 'p-4 sm:p-5'}`
      } transition-colors ${!hasChoices || !isTypingDone ? 'cursor-pointer' : ''}`}
    >
      {/* Speaker nameplate */}
      <div
        className={`flex items-baseline justify-between gap-3 border-b border-[#292D34] shrink-0 ${
          compact ? 'mb-1.5 pb-1' : 'mb-2 pb-1.5'
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-2 min-w-0">
          <span
            className={`font-editorial font-semibold text-[#F1EEE8] ${
              compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
            }`}
          >
            {speakerDisplayName}
          </span>
          {speakerDisplayRole && (
            <span className="text-xs text-[#9E978B]">· {speakerDisplayRole}</span>
          )}
        </div>
        {!hasChoices && (
          <span className="hidden sm:inline text-[11px] text-[#74726D] font-data whitespace-nowrap">
            SPACE / ENTER
          </span>
        )}
      </div>

      {/* Dialogue prose */}
      <div
        className={`flex flex-col justify-between gap-2.5 ${
          compact ? 'min-h-0' : 'min-h-[64px] sm:min-h-[72px]'
        }`}
      >
        <p
          className={`text-[#E3E0D9] leading-[1.68] break-keep ${
            settings.textSize === 'large'
              ? compact
                ? 'text-[15px] sm:text-lg'
                : 'text-base sm:text-xl'
              : compact
              ? 'text-[13.5px] sm:text-[15px]'
              : 'text-sm sm:text-base md:text-[16.5px]'
          }`}
        >
          {visibleText}
          {!isTypingDone && (
            <span className="inline-block w-1.5 h-4 bg-[#A39A8B] ml-1 align-middle" />
          )}
        </p>

        {/* Next Button Row */}
        {(!hasChoices || !isTypingDone) && (
          <div className="flex items-center justify-end pt-0.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBoxAction();
              }}
              className="min-h-[42px] px-4 py-1.5 bg-[#1B1E23] hover:bg-[#252930] text-[#ECE9E2] border border-[#3E434D] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{isTypingDone ? '다음' : '전체 보기'}</span>
              <ChevronRight className="w-4 h-4 text-[#A49B8C]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden bg-[#0E0F11]">
      {/* SPLIT PORTRAIT VIEW — Mobile phones & portrait tablets (or forced 'portrait' ratio) */}
      <div
        className={`${
          forceSplitPortrait
            ? 'flex'
            : settings.displayRatio === 'auto'
            ? 'flex md:landscape:hidden'
            : 'flex md:hidden'
        } flex-1 min-h-0 w-full flex-col overflow-hidden`}
      >
        {/* Adaptive upper scene canvas: generous during dialogue, smoothly yields space when choices appear */}
        <div
          className={`relative w-full border-b border-[#2A2D34] overflow-hidden flex flex-col justify-between shrink-0 transition-all duration-300 ${
            showChoices
              ? 'h-[23%] min-h-[116px] max-h-[172px]'
              : 'h-[44%] min-h-[200px] max-h-[360px]'
          }`}
        >
          <div className="absolute inset-0 z-0">
            <ResilientBackground
              src={bgUrl}
              alt={location?.name ?? '장면 배경'}
              className="w-full h-full"
              imageClassName="saturate-[0.8] brightness-[0.92]"
              overlayClassName="bg-gradient-to-t from-[#0D0E10]/85 via-transparent to-[#0D0E10]/45"
            />
          </div>

          {renderTopBadges()}

          <div className="relative z-10 flex-1 min-h-0 w-full max-w-3xl mx-auto px-3 pointer-events-none">
            {renderSprites(
              showChoices
                ? 'h-[92%] max-h-[135px] w-auto max-w-[34vw]'
                : 'h-[86%] max-h-[270px] w-auto max-w-[44vw]'
            )}
          </div>
        </div>

        {/* Unified single-scroll lower dialogue & choice panel (no nested scroll traps) */}
        <section className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-3.5 sm:px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain bg-[#0F1114]">
          <div className="flex flex-col gap-3">
            {renderDialogueCard(true, showChoices)}
            {renderChoices('mobile')}
          </div>
        </section>
      </div>

      {/* FULL CINEMATIC LANDSCAPE VIEW — Desktop & Tablet Landscape */}
      {!forceSplitPortrait && (
        <div
          className={`${
            settings.displayRatio === 'auto'
              ? 'hidden md:landscape:flex'
              : 'hidden md:flex'
          } relative flex-1 min-h-0 w-full flex-col justify-between overflow-hidden`}
        >
          {/* Full Background Layer */}
          <div className="absolute inset-0 z-0">
            <ResilientBackground
              src={bgUrl}
              alt={location?.name ?? '장면 배경'}
              className="w-full h-full"
              imageClassName="saturate-[0.78] brightness-[0.9]"
              overlayClassName="bg-gradient-to-t from-[#0D0E10] via-[#0D0E10]/25 to-[#0D0E10]/45"
            />
          </div>

          {renderTopBadges()}

          {/* Character Sprite Layer — scales cleanly to remaining vertical space */}
          <div className="relative z-10 flex-1 min-h-[120px] w-full max-w-5xl mx-auto px-6 pointer-events-none">
            {renderSprites(
              showChoices
                ? 'h-[90%] max-h-[280px] min-h-[110px] w-auto max-w-[30vw]'
                : 'h-[88%] max-h-[380px] min-h-[150px] w-auto max-w-[38vw]'
            )}
          </div>

          {/* Bottom Interactive Dock — Consistent top-to-bottom reading flow (situation -> choices) */}
          <section className="relative z-20 shrink-0 w-full max-w-5xl mx-auto px-5 pb-4 space-y-2.5">
            {renderDialogueCard(false, showChoices)}
            {renderChoices('desktop')}
          </section>
        </div>
      )}
    </div>
  );
}
