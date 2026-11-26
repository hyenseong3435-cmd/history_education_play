import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CHAPTERS, ENDINGS, EVENTS_BY_ID } from './data';
import {
  advanceToNextChapter,
  appendPlaythroughRecord,
  applyChoiceToState,
  applyNodeSideEffects,
  clearAutoSave,
  createInitialGameState,
  deleteManualSlot,
  loadAutoSave,
  loadManualSlots,
  loadPlaythroughRecords,
  loadSettings,
  resolveEnding,
  resolveNextNodeId,
  saveAutoSave,
  saveManualSlot,
  saveSettings,
  startNewOccupationGame,
} from './engine/gameEngine';
import type {
  ChoiceOption,
  DelayedEffect,
  DisplayRatioMode,
  GameSettings,
  GameState,
  LocationData,
  OccupationId,
  PlaythroughRecord,
  SaveSlotData,
} from './types/game';
import { playUiSound } from './utils/soundFx';
import { EndingScreen } from './components/EndingScreen';
import { ExplorationView } from './components/ExplorationView';
import { GameModals } from './components/GameModals';
import { OccupationSelectScreen } from './components/OccupationSelectScreen';
import { TitleScreen } from './components/TitleScreen';
import { TopGameBar, type ActiveModalType } from './components/TopGameBar';
import { VisualNovelStage } from './components/VisualNovelStage';

const RATIO_CYCLE: DisplayRatioMode[] = ['auto', '16:9', '4:3', 'portrait'];

function getDisplayFrameStyle(ratio: DisplayRatioMode): CSSProperties | undefined {
  if (ratio === '16:9') {
    return {
      width: 'min(100vw, calc(100dvh * 16 / 9))',
      height: 'min(100dvh, max(560px, calc(100vw * 9 / 16)))',
    };
  }
  if (ratio === '4:3') {
    return {
      width: 'min(100vw, calc(100dvh * 4 / 3))',
      height: 'min(100dvh, max(560px, calc(100vw * 3 / 4)))',
    };
  }
  return undefined;
}

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [autoSave, setAutoSave] = useState<SaveSlotData | null>(() => loadAutoSave());
  const [manualSlots, setManualSlots] = useState<Record<string, SaveSlotData>>(() =>
    loadManualSlots()
  );
  const [records, setRecords] = useState<PlaythroughRecord[]>(() =>
    loadPlaythroughRecords()
  );

  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [focusedSourceId, setFocusedSourceId] = useState<string | null>(null);
  const [recentDelayedEffects, setRecentDelayedEffects] = useState<DelayedEffect[]>(
    []
  );

  // Latest save for Title screen "이어하기"
  const latestSave = useMemo<SaveSlotData | null>(() => {
    const candidates: SaveSlotData[] = [];
    if (autoSave) candidates.push(autoSave);
    Object.values(manualSlots).forEach((s) => candidates.push(s));
    if (candidates.length === 0) return null;
    candidates.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    return candidates[0];
  }, [autoSave, manualSlots]);

  // Persist auto-save whenever gameplay state updates
  useEffect(() => {
    if (
      state.occupation &&
      (state.screen === 'DIALOGUE' || state.screen === 'EXPLORE')
    ) {
      saveAutoSave(state);
      setAutoSave(loadAutoSave());
    }
  }, [state]);

  const unreadSourceCount = useMemo(() => {
    return state.unlockedSources.filter(
      (id) => !state.readSources.includes(id)
    ).length;
  }, [state.unlockedSources, state.readSources]);

  const handleUpdateSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const handleCycleDisplayRatio = useCallback(() => {
    playUiSound('click', settings.soundEnabled);
    const idx = RATIO_CYCLE.indexOf(settings.displayRatio);
    const nextRatio = RATIO_CYCLE[(idx + 1) % RATIO_CYCLE.length];
    const nextSettings: GameSettings = { ...settings, displayRatio: nextRatio };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }, [settings]);

  const handleOpenModal = useCallback(
    (modal: ActiveModalType) => {
      if (modal === 'sources') {
        playUiSound('paper', settings.soundEnabled);
      } else if (modal) {
        playUiSound('click', settings.soundEnabled);
      }
      setFocusedSourceId(null);
      setActiveModal(modal);
    },
    [settings.soundEnabled]
  );

  const handleOpenSourceById = useCallback(
    (sourceId: string) => {
      playUiSound('paper', settings.soundEnabled);
      setFocusedSourceId(sourceId);
      setActiveModal('sources');
    },
    [settings.soundEnabled]
  );

  const handleMarkSourceRead = useCallback((sourceId: string) => {
    setState((prev) => {
      if (prev.readSources.includes(sourceId)) return prev;
      return {
        ...prev,
        readSources: [...prev.readSources, sourceId],
      };
    });
  }, []);

  // Start new game (clears auto-save & enters Prologue)
  const handleStartNewGame = useCallback(() => {
    playUiSound('click', settings.soundEnabled);
    clearAutoSave();
    setAutoSave(null);
    setRecentDelayedEffects([]);
    const fresh = createInitialGameState();
    setState({ ...fresh, screen: 'PROLOGUE' });
  }, [settings.soundEnabled]);

  const handleContinueGame = useCallback(() => {
    if (!latestSave) return;
    playUiSound('click', settings.soundEnabled);
    setRecentDelayedEffects([]);
    setState(latestSave.state);
  }, [latestSave, settings.soundEnabled]);

  const handleSelectOccupation = useCallback(
    (occupationId: OccupationId) => {
      playUiSound('chapter', settings.soundEnabled);
      setRecentDelayedEffects([]);
      const initial = startNewOccupationGame(occupationId);
      const firstNode = initial.currentNodeId
        ? EVENTS_BY_ID[initial.currentNodeId]
        : null;
      setState(firstNode ? applyNodeSideEffects(initial, firstNode) : initial);
    },
    [settings.soundEnabled]
  );

  const handleVisitLocation = useCallback(
    (location: LocationData, startNodeId: string, visitKey: string) => {
      playUiSound('click', settings.soundEnabled);
      const targetNode = EVENTS_BY_ID[startNodeId];
      if (!targetNode) return;

      setState((prev) => {
        const nextVisited = prev.visitedExplorationKeys.includes(visitKey)
          ? prev.visitedExplorationKeys
          : [...prev.visitedExplorationKeys, visitKey];

        const baseState: GameState = {
          ...prev,
          screen: 'DIALOGUE',
          currentNodeId: startNodeId,
          currentLocationId: location.id,
          visitedExplorationKeys: nextVisited,
        };
        return applyNodeSideEffects(baseState, targetNode);
      });
    },
    [settings.soundEnabled]
  );

  const handleStartMainEvent = useCallback(() => {
    if (!state.occupation) return;
    const chapter = CHAPTERS.find((c) => c.number === state.chapter);
    if (!chapter) return;
    const mainNodeId = chapter.mainEventNodeByOccupation[state.occupation];
    if (!mainNodeId) return;
    const mainNode = EVENTS_BY_ID[mainNodeId];
    if (!mainNode) return;

    playUiSound('chapter', settings.soundEnabled);
    setRecentDelayedEffects([]);
    setState((prev) => {
      const next: GameState = {
        ...prev,
        screen: 'DIALOGUE',
        currentNodeId: mainNodeId,
        currentLocationId: mainNode.locationId,
      };
      return applyNodeSideEffects(next, mainNode);
    });
  }, [state.occupation, state.chapter, settings.soundEnabled]);

  const transitionToTarget = useCallback(
    (currentState: GameState, targetId: string | null) => {
      if (!targetId || targetId === '__EXPLORE__') {
        setState({
          ...currentState,
          screen: 'EXPLORE',
          currentNodeId: null,
        });
        return;
      }

      if (targetId === '__NEXT_CHAPTER__') {
        playUiSound('chapter', settings.soundEnabled);
        const { nextState, newlyTriggered } = advanceToNextChapter(currentState);
        setRecentDelayedEffects(newlyTriggered);
        setState(nextState);
        return;
      }

      if (targetId === '__ENDING__') {
        playUiSound('chapter', settings.soundEnabled);
        const ending = resolveEnding(currentState);
        const updatedRecords = appendPlaythroughRecord(currentState, ending);
        setRecords(updatedRecords);
        clearAutoSave();
        setAutoSave(null);
        setState({
          ...currentState,
          screen: 'ENDING',
          activeEndingId: ending.id,
          currentNodeId: null,
        });
        return;
      }

      const nextNode = EVENTS_BY_ID[targetId];
      if (!nextNode) {
        setState({
          ...currentState,
          screen: 'EXPLORE',
          currentNodeId: null,
        });
        return;
      }

      const nextBase: GameState = {
        ...currentState,
        screen: 'DIALOGUE',
        currentNodeId: nextNode.id,
        currentLocationId: nextNode.locationId,
      };
      setState(applyNodeSideEffects(nextBase, nextNode));
    },
    [settings.soundEnabled]
  );

  const handleAdvanceDialogue = useCallback(() => {
    if (!state.currentNodeId) return;
    const currentNode = EVENTS_BY_ID[state.currentNodeId];
    if (!currentNode) return;

    playUiSound('advance', settings.soundEnabled);
    const nextTarget = resolveNextNodeId(currentNode, state);
    transitionToTarget(state, nextTarget);
  }, [state, settings.soundEnabled, transitionToTarget]);

  const handleSelectChoice = useCallback(
    (choice: ChoiceOption) => {
      playUiSound('choice', settings.soundEnabled);
      const updatedState = applyChoiceToState(state, choice);
      transitionToTarget(updatedState, choice.next);
    },
    [state, settings.soundEnabled, transitionToTarget]
  );

  const handleSaveManualSlot = useCallback(
    (slotId: string) => {
      playUiSound('paper', settings.soundEnabled);
      saveManualSlot(slotId, state);
      setManualSlots(loadManualSlots());
    },
    [state, settings.soundEnabled]
  );

  const handleLoadSlot = useCallback(
    (slot: SaveSlotData) => {
      playUiSound('click', settings.soundEnabled);
      setRecentDelayedEffects([]);
      setState(slot.state);
    },
    [settings.soundEnabled]
  );

  const handleDeleteSlot = useCallback(
    (slotId: string) => {
      playUiSound('click', settings.soundEnabled);
      deleteManualSlot(slotId);
      setManualSlots(loadManualSlots());
    },
    [settings.soundEnabled]
  );

  const handleReturnToTitle = useCallback(() => {
    playUiSound('click', settings.soundEnabled);
    setState((prev) => ({ ...prev, screen: 'TITLE' }));
  }, [settings.soundEnabled]);

  const currentNode = state.currentNodeId
    ? EVENTS_BY_ID[state.currentNodeId] ?? null
    : null;

  const activeEnding =
    state.activeEndingId
      ? ENDINGS.find((e) => e.id === state.activeEndingId) ?? resolveEnding(state)
      : null;

  const isFramedRatio =
    settings.displayRatio === '16:9' || settings.displayRatio === '4:3';
  const frameStyle = getDisplayFrameStyle(settings.displayRatio);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#08090B] flex items-center justify-center">
      <div
        style={frameStyle}
        className={`relative flex flex-col overflow-hidden bg-[#0E0F11] text-[#E6E3DC] ${
          isFramedRatio
            ? 'border border-[#2A2D34] shadow-[0_0_60px_rgba(0,0,0,0.75)]'
            : 'h-full w-full'
        }`}
      >
        {state.screen === 'TITLE' && (
          <TitleScreen
            latestSave={latestSave}
            recordCount={records.length}
            displayRatio={settings.displayRatio}
            onCycleDisplayRatio={handleCycleDisplayRatio}
            onNewGame={handleStartNewGame}
            onContinue={handleContinueGame}
            onOpenRecords={() => handleOpenModal('records')}
            onOpenGuide={() => handleOpenModal('guide')}
            onOpenCredits={() => handleOpenModal('credits')}
          />
        )}

        {(state.screen === 'PROLOGUE' ||
          state.screen === 'OCCUPATION_SELECT') && (
          <OccupationSelectScreen
            step={state.screen}
            onProceedToSelect={() => {
              playUiSound('click', settings.soundEnabled);
              setState((prev) => ({ ...prev, screen: 'OCCUPATION_SELECT' }));
            }}
            onSelectOccupation={handleSelectOccupation}
            onBackToTitle={handleReturnToTitle}
          />
        )}

        {(state.screen === 'EXPLORE' || state.screen === 'DIALOGUE') && (
          <>
            <TopGameBar
              state={state}
              unreadSourceCount={unreadSourceCount}
              displayRatio={settings.displayRatio}
              onCycleDisplayRatio={handleCycleDisplayRatio}
              onOpenModal={handleOpenModal}
            />

            {state.screen === 'EXPLORE' && (
              <ExplorationView
                state={state}
                recentDelayedEffects={recentDelayedEffects}
                onVisitLocation={handleVisitLocation}
                onStartMainEvent={handleStartMainEvent}
                onOpenSources={() => handleOpenModal('sources')}
                onOpenStatus={() => handleOpenModal('status')}
              />
            )}

            {state.screen === 'DIALOGUE' && currentNode && (
              <VisualNovelStage
                node={currentNode}
                state={state}
                settings={settings}
                isModalOpen={activeModal !== null}
                onAdvance={handleAdvanceDialogue}
                onSelectChoice={handleSelectChoice}
                onOpenSourceById={handleOpenSourceById}
                onOpenStatus={() => handleOpenModal('status')}
              />
            )}
          </>
        )}

        {state.screen === 'ENDING' && activeEnding && (
          <>
            <TopGameBar
              state={state}
              unreadSourceCount={0}
              displayRatio={settings.displayRatio}
              onCycleDisplayRatio={handleCycleDisplayRatio}
              onOpenModal={handleOpenModal}
            />
            <EndingScreen
              ending={activeEnding}
              state={state}
              onRestartOtherOccupation={() => {
                playUiSound('click', settings.soundEnabled);
                setRecentDelayedEffects([]);
                const fresh = createInitialGameState();
                setState({ ...fresh, screen: 'OCCUPATION_SELECT' });
              }}
              onReturnTitle={handleReturnToTitle}
              onOpenSources={() => handleOpenModal('sources')}
              onOpenSourceById={handleOpenSourceById}
            />
          </>
        )}

        <GameModals
          activeModal={activeModal}
          initialSourceId={focusedSourceId}
          state={state}
          settings={settings}
          autoSave={autoSave}
          manualSlots={manualSlots}
          records={records}
          onClose={() => setActiveModal(null)}
          onMarkSourceRead={handleMarkSourceRead}
          onSaveSlot={handleSaveManualSlot}
          onLoadSlot={handleLoadSlot}
          onDeleteSlot={handleDeleteSlot}
          onUpdateSettings={handleUpdateSettings}
          onReturnToTitle={handleReturnToTitle}
        />
      </div>
    </div>
  );
}
