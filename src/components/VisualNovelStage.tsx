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

  const renderChoices = (maxHeightClass: string) =>
    hasChoices && isTypingDone ? (
      <div
        role="group"
        aria-label="선택지"
        className={`flex flex-col gap-1.5 sm:gap-2 ${maxHeightClass} overflow-y-auto pr-0.5`}
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
                className="w-full px-3.5 py-2.5 bg-[#121417]/94 border border-[#282C33] text-[#83817B] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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
              className="w-full min-h-[48px] sm:min-h-[52px] px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#15171B]/96 hover:bg-[#1E2127] active:bg-[#262A31] border border-[#3B4049] hover:border-[#9E9586] text-left transition-colors duration-150 flex items-start gap-2.5 sm:gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B2A999]"
            >
              <span className="font-data text-xs font-medium text-[#9E9586] mt-0.5 shrink-0">
                0{idx + 1}
              </span>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`font-medium text-[#EFECE6] leading-snug break-keep ${
                      settings.textSize === 'large'
                        ? 'text-base sm:text-lg'
                        : 'text-sm sm:text-base'
                    }`}
                  >
                    {choice.text}
                  </span>
                  {choice.unlockTag && (
                    <span className="text-[11px] text-[#B2A999] font-normal">
                      · {choice.unlockTag}
                    </span>
                  )}
                </div>
                {choice.subtext && (
                  <p className="text-xs text-[#9C9991] leading-snug break-keep">
                    {choice.subtext}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8B84] mt-0.5 shrink-0" />
            </button>
          );
        })}
      </div>
    ) : null;

  const renderDialogueCard = (isSplitPanel: boolean) => (
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
          ? 'bg-[#14161A] border border-[#2D3139] p-3.5 sm:p-4 flex flex-col justify-between'
          : 'dialogue-box p-4 sm:p-5'
      } transition-colors ${!hasChoices || !isTypingDone ? 'cursor-pointer' : ''}`}
    >
      {/* Speaker nameplate */}
      <div className="flex items-baseline justify-between gap-3 mb-2 pb-1.5 border-b border-[#292D34] shrink-0">
        <div className="flex flex-wrap items-baseline gap-2 min-w-0">
          <span className="font-editorial text-base sm:text-lg font-semibold text-[#F1EEE8]">
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
      <div className="flex flex-col justify-between gap-2.5 min-h-[60px] sm:min-h-[72px]">
        <p
          className={`text-[#E3E0D9] leading-[1.72] break-keep ${
            settings.textSize === 'large'
              ? 'text-base sm:text-xl'
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
              className="min-h-[40px] px-4 py-1.5 bg-[#1B1E23] hover:bg-[#252930] text-[#ECE9E2] border border-[#3E434D] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
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
      {/* SPLIT PORTRAIT VIEW — Auto on portrait phones & tablets (or whenever user selects 'portrait' ratio) */}
      <div
        className={`${
          forceSplitPortrait
            ? 'flex'
            : settings.displayRatio === 'auto'
            ? 'flex md:landscape:hidden'
            : 'flex sm:hidden'
        } flex-1 min-h-0 w-full flex-col overflow-hidden`}
      >
        {/* Crisp upper pixel-art scene canvas (prevents harsh vertical cropping) */}
        <div className="relative w-full flex-[1.08] min-h-[190px] max-h-[52%] border-b border-[#2A2D34] overflow-hidden flex flex-col justify-between shrink-0">
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
            {renderSprites('h-[84%] max-h-[280px] w-auto max-w-[44vw]')}
          </div>
        </div>

        {/* Lower dedicated dialogue & choice panel (thumb-zone friendly) */}
        <section className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-3 sm:px-5 py-3 sm:py-4 flex flex-col justify-between gap-2.5 overflow-y-auto bg-[#0F1114]">
          <div className="space-y-2">
            {renderDialogueCard(true)}
          </div>
          {renderChoices('flex-1 min-h-0')}
        </section>
      </div>

      {/* FULL CINEMATIC LANDSCAPE VIEW — Desktop & Tablet Landscape (Zero Scroll) */}
      {!forceSplitPortrait && (
        <div
          className={`${
            settings.displayRatio === 'auto'
              ? 'hidden md:landscape:flex'
              : 'hidden sm:flex'
          } relative flex-1 min-h-0 w-full flex-col justify-between overflow-hidden`}
        >
          {/* Full Background Layer */}
          <div className="absolute inset-0 z-0">
            <ResilientBackground
              src={bgUrl}
              alt={location?.name ?? '장면 배경'}
              className="w-full h-full"
              imageClassName="saturate-[0.78] brightness-[0.9]"
              overlayClassName="bg-gradient-to-t from-[#0D0E10] via-[#0D0E10]/20 to-[#0D0E10]/45"
            />
          </div>

          {renderTopBadges()}

          {/* Character Sprite Layer — scales cleanly to remaining vertical space */}
          <div className="relative z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto px-6 pointer-events-none">
            {renderSprites('h-[88%] max-h-[380px] min-h-[150px] w-auto max-w-[38vw]')}
          </div>

          {/* Bottom Interactive Dock */}
          <section className="relative z-20 shrink-0 w-full max-w-5xl mx-auto px-5 pb-4 space-y-2">
            {renderChoices('max-h-[36dvh]')}
            {renderDialogueCard(false)}
          </section>
        </div>
      )}
    </div>
  );
}
