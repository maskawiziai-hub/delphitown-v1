/**
 * Asset Context Provider
 *
 * Makes assets available throughout the app via React Context.
 * Provides useAssets() hook for components to load assets.
 *
 * Usage:
 * 1. Wrap app with <AssetProvider>
 * 2. Use useAssets() hook in any component
 * 3. Access asset functions and cached data
 */

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import * as assetService from "../services/assetService";
import { AssetManifest } from "../types";

interface AssetContextType {
  assets: AssetManifest[];
  isLoading: boolean;
  error: string | null;
  getAssetByKey: (key: string) => AssetManifest | undefined;
  getAssetsByCategory: (category: string) => Promise<AssetManifest[]>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

/**
 * Asset Provider: Wraps your app to provide asset access.
 */
export function AssetProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<AssetManifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssets() {
      try {
        setIsLoading(true);
        const manifest = await assetService.fetchManifest();
        const loadedAssets = Array.from(manifest.values());
        setAssets(loadedAssets);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assets");
        console.error("Asset loading error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAssets();
  }, []);

  const value: AssetContextType = {
    assets,
    isLoading,
    error,
    getAssetByKey: (key: string) => assets.find((a) => a.asset_key === key),
    getAssetsByCategory: assetService.getAssetsByCategory,
  };

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

/**
 * useAssets: Hook to access assets in any component.
 *
 * Usage:
 * const { getAssetByKey, getAssetPath } = useAssets();
 * const spriteAsset = getAssetByKey('pricing_agent_idle_16x16');
 * if (spriteAsset) {
 *   return <img src={getAssetPath(spriteAsset)} />;
 * }
 */
export function useAssets(): AssetContextType {
  const context = useContext(AssetContext);

  if (!context) {
    throw new Error("useAssets must be used within AssetProvider");
  }

  return context;
}
