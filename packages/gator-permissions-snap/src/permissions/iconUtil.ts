import type { CaipAssetType } from '@metamask/snaps-sdk';

import type { TokenMetadataCoordinator } from '../core/coordinators/TokenMetadataCoordinator';
import type { IconData } from '../core/types';

/**
 * Extracts icon data from the token metadata coordinator for a CAIP-19 asset.
 * @param coordinator - Token metadata coordinator for the request.
 * @param caip19 - CAIP-19 asset identifier.
 * @returns Icon data or undefined when metadata or icon is unavailable.
 */
export const getIconData = (
  coordinator: TokenMetadataCoordinator,
  caip19: CaipAssetType | undefined,
): IconData | undefined => {
  if (!caip19) {
    return undefined;
  }

  const metadata = coordinator.getMetadata(caip19);
  if (!metadata?.iconDataBase64) {
    return undefined;
  }

  return {
    iconDataBase64: metadata.iconDataBase64,
    iconAltText: metadata.symbol,
  };
};

/**
 * Returns the token symbol from the coordinator for a CAIP-19 asset.
 * @param coordinator - Token metadata coordinator for the request.
 * @param caip19 - CAIP-19 asset identifier.
 * @returns Token symbol or empty string when unavailable.
 */
export const getTokenSymbol = (
  coordinator: TokenMetadataCoordinator,
  caip19: CaipAssetType | undefined,
): string => {
  if (!caip19) {
    return '';
  }

  return coordinator.getMetadata(caip19)?.symbol ?? '';
};
