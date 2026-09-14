/**
 * TownGrid.tsx
 * Main game world rendering component
 * Renders tiles, buildings, and citizens in a 16×16 town grid
 *
 * TODO: Implement in v1.1
 * - Canvas-based tile rendering for performance
 * - Building sprites and rendering
 * - Citizen pathfinding and movement
 * - Click-to-select and drag-to-move interactions
 * - Fog of war / visibility system
 * - Minimap display
 */

import React from 'react';
import { Tile, Building, Citizen, GameDimensions } from '../types/game';
import '../styles/TownGrid.css';

export interface TownGridProps {
  /** Grid dimensions */
  dimensions: GameDimensions;
  /** Tile data */
  tiles: Tile[][];
  /** Buildings in the world */
  buildings: Map<string, Building>;
  /** Citizens in the world */
  citizens: Map<string, Citizen>;
  /** Selected building or citizen ID */
  selectedId?: string;
  /** Callback when tile is clicked */
  onTileClick?: (x: number, y: number) => void;
  /** Callback when building is clicked */
  onBuildingClick?: (buildingId: string) => void;
  /** Callback when citizen is clicked */
  onCitizenClick?: (citizenId: string) => void;
}

/**
 * TownGrid component - main game world view
 * Renders the town grid with tiles, buildings, and citizens
 *
 * CURRENT STATUS: Stub/Placeholder
 * This component is planned for v1.1 and will render:
 * - 16×16 tile grid
 * - Terrain types (grass, water, sand, stone, forest)
 * - Building sprites positioned on tiles
 * - Animated citizens moving around
 * - Interactive selection and task assignment
 */
const TownGrid: React.FC<TownGridProps> = ({
  dimensions,
  tiles,
  buildings,
  citizens,
  selectedId,
  onTileClick,
  onBuildingClick,
  onCitizenClick,
}) => {
  return (
    <div className="town-grid">
      <div
        className="grid-canvas"
        style={{
          width: `${dimensions.width * dimensions.tileSize}px`,
          height: `${dimensions.height * dimensions.tileSize}px`,
        }}
      >
        <div className="grid-placeholder">
          <p>🏗️ TownGrid Coming in v1.1</p>
          <p className="subtext">Grid: {dimensions.width}×{dimensions.height}</p>
          <p className="subtext">Tile Size: {dimensions.tileSize}px</p>
          <p className="subtext">Buildings: {buildings.size} | Citizens: {citizens.size}</p>
        </div>
      </div>
    </div>
  );
};

export default TownGrid;
