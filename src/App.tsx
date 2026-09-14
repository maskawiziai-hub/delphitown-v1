/**
 * App.tsx
 * DelphiTown v1 main application component
 * Root component that manages game state, UI layout, and game loop
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameSettings, Citizen, GameDimensions } from './types/game';
import CharacterAnimationTest from './components/CharacterAnimationTest';
import WorkerPanel from './components/WorkerPanel';
import Settings from './components/Settings';
import './styles/App.css';

/**
 * Default game settings
 */
const DEFAULT_SETTINGS: GameSettings = {
  animationSpeed: 1,
  gridSize: 16,
  tileSize: 32,
  displayScale: 1,
  maxCitizens: 20,
  maxBuildings: 30,
  dayLengthSeconds: 60,
  simulationSpeed: 20,
  soundEnabled: true,
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 80,
  showGrid: true,
  showDebugInfo: false,
  autoSave: true,
  autoSaveIntervalSeconds: 300,
};

/**
 * Default game dimensions (16×12 grid)
 */
const DEFAULT_DIMENSIONS: GameDimensions = {
  width: 16,
  height: 12,
  tileSize: 32,
  gridSize: 16,
};

/**
 * App component - main game application
 * Manages game state, settings, and renders game UI
 */
const App: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    dimensions: DEFAULT_DIMENSIONS,
    tiles: [],
    time: 0,
    isPaused: false,
    citizens: new Map(),
    buildings: new Map(),
    tasks: new Map(),
    resources: { wheat: 100, wood: 50, ore: 0, gold: 0 },
    settings: DEFAULT_SETTINGS,
    stats: {
      totalCitizensCreated: 0,
      totalBuildingsConstructed: 0,
      totalTasksCompleted: 0,
      playTimeSeconds: 0,
      dayNumber: 1,
      resourcesProduced: {},
      citizenHappiness: 75,
    },
  });

  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'main' | 'test'>('main');

  // Handle animation speed change
  const handleAnimationSpeedChange = useCallback((speed: number) => {
    setGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, animationSpeed: speed },
    }));
  }, []);

  // Handle grid size change
  const handleGridSizeChange = useCallback((size: number) => {
    setGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, gridSize: size },
    }));
  }, []);

  // Handle tile size change
  const handleTileSizeChange = useCallback((size: number) => {
    setGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, tileSize: size },
    }));
  }, []);

  // Handle max workers change
  const handleMaxWorkersChange = useCallback((max: number) => {
    setGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, maxCitizens: max },
    }));
  }, []);

  // Handle master volume change
  const handleMasterVolumeChange = useCallback((volume: number) => {
    setGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, masterVolume: volume },
    }));
  }, []);

  // Handle sound toggle
  const handleSoundEnabledChange = useCallback((enabled: boolean) => {
    setGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, soundEnabled: enabled },
    }));
  }, []);

  // Handle citizen selection
  const handleSelectCitizen = useCallback((citizenId: string) => {
    setSelectedCitizenId(citizenId);
  }, []);

  // Get citizens for worker panel (mock data for now)
 const getMockCitizens = useCallback((): any[] => {
    return [
      {
        id: 'citizen-1',
        name: 'Astra',
        role: 'Farmer',
        position: { x: 5, y: 5 },
        direction: 'down',
        animationState: 'idle',
        colorPreset: 'default',
        currentTask: 'Planting wheat',
        isAvailable: false,
        health: 85,
        stamina: 60,
        skills: { farming: 75, building: 30, scouting: 20 },
        inventory: [],
        createdAt: Date.now(),
      },
      {
        id: 'citizen-2',
        name: 'Bron',
        role: 'Builder',
        position: { x: 8, y: 3 },
        direction: 'right',
        animationState: 'idle',
        colorPreset: 'rusticFarmer',
        currentTask: null,
        isAvailable: true,
        health: 100,
        stamina: 100,
        skills: { farming: 20, building: 85, scouting: 40 },
        inventory: [],
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'citizen-3',
        name: 'Calis',
        role: 'Scout',
        position: { x: 2, y: 8 },
        direction: 'up',
        animationState: 'walk',
        colorPreset: 'forest',
        currentTask: 'Exploring',
        isAvailable: false,
        health: 90,
        stamina: 75,
        skills: { farming: 10, building: 25, scouting: 92 },
        inventory: [],
        createdAt: Date.now() - 7200000,
      },
      {
        id: 'citizen-4',
        name: 'Doria',
        role: 'Farmer',
        position: { x: 10, y: 7 },
        direction: 'down-left',
        animationState: 'idle',
        colorPreset: 'fairSkin',
        currentTask: null,
        isAvailable: true,
        health: 75,
        stamina: 55,
        skills: { farming: 65, building: 35, scouting: 45 },
        inventory: [],
        createdAt: Date.now() - 1800000,
      },
      {
        id: 'citizen-5',
        name: 'Elian',
        role: 'Worker',
        position: { x: 6, y: 10 },
        direction: 'right',
        animationState: 'walk',
        colorPreset: 'darkSkin',
        currentTask: 'Gathering wood',
        isAvailable: false,
        health: 80,
        stamina: 40,
        skills: { farming: 45, building: 50, scouting: 55 },
        inventory: [],
        createdAt: Date.now() - 5400000,
      },
    ];
  }, []);

  // Game loop (placeholder)
  useEffect(() => {
    const updateGame = () => {
      // TODO: Implement actual game loop
      // - Update citizen positions/states
      // - Process tasks
      // - Update resources
      // - Check for completions
    };

    // Run game loop at configured speed
    const interval = setInterval(updateGame, 1000 / gameState.settings.simulationSpeed);
    return () => clearInterval(interval);
  }, [gameState.settings.simulationSpeed]);

  // Render based on game mode
  if (gameMode === 'test') {
    return (
      <div className="app test-mode">
        <button
          className="mode-toggle"
          onClick={() => setGameMode('main')}
          title="Return to main game"
        >
          ← Back to Main
        </button>
        <CharacterAnimationTest />
      </div>
    );
  }

  return (
    <div className="app main-mode">
      <header className="app-header">
        <h1 className="app-title">DelphiTown v1</h1>
        <div className="header-info">
          <span className="day-counter">Day {gameState.stats.dayNumber}</span>
          <span className="time-display">{Math.floor(gameState.time / 1000)}s</span>
          <button
            className="mode-toggle"
            onClick={() => setGameMode('test')}
            title="Open animation test"
          >
            Test Animations →
          </button>
        </div>
      </header>

      <main className="app-content">
        {/* Left Sidebar: Worker Panel */}
        <aside className="sidebar sidebar-left">
          <WorkerPanel
            citizens={getMockCitizens()}
            selectedCitizenId={selectedCitizenId || undefined}
            onSelectCitizen={handleSelectCitizen}
            detailedView={true}
          />
        </aside>

        {/* Center: Game View (placeholder) */}
        <section className="game-view">
          <div className="game-canvas">
            <div className="placeholder">
              <p>Game World (TownGrid coming next)</p>
              <p className="subtext">Grid: {gameState.dimensions.width}×{gameState.dimensions.height}</p>
              <p className="subtext">Tile Size: {gameState.settings.tileSize}px</p>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Settings */}
        <aside className="sidebar sidebar-right">
          <Settings
            animationSpeed={gameState.settings.animationSpeed}
            onAnimationSpeedChange={handleAnimationSpeedChange}
            gridSize={gameState.settings.gridSize}
            onGridSizeChange={handleGridSizeChange}
            tileSize={gameState.settings.tileSize}
            onTileSizeChange={handleTileSizeChange}
            maxWorkers={gameState.settings.maxCitizens}
            onMaxWorkersChange={handleMaxWorkersChange}
            masterVolume={gameState.settings.masterVolume}
            onMasterVolumeChange={handleMasterVolumeChange}
            soundEnabled={gameState.settings.soundEnabled}
            onSoundEnabledChange={handleSoundEnabledChange}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <p className="footer-text">
          Resources: Wheat {gameState.resources.wheat} | Wood {gameState.resources.wood} | Gold{' '}
          {gameState.resources.gold}
        </p>
        <p className="footer-text">
          Citizens: {gameState.citizens.size} / {gameState.settings.maxCitizens}
        </p>
      </footer>
    </div>
  );
};

export default App;
