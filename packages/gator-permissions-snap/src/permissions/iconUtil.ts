import type { BaseContext, IconData } from '../core/types';

/**
 * Extracts icon data from a token permission context.
 *
 * This function takes a token permission context and extracts the icon data
 * from the token metadata. It returns an IconData object containing the base64
 * encoded icon and alt text, or undefined if no icon data is available.
 *
 * @param context - The token permission context containing token metadata.
 * @returns An IconData object with iconDataBase64 and iconAltText, or undefined if no icon data exists.
 */
export const getIconData = (context: BaseContext): IconData | undefined => {
  const { iconDataBase64: iconUrl } = context.tokenMetadata;
  if (!iconUrl) {
    return undefined;
  }

  return {
    iconDataBase64: iconUrl,
    iconAltText: context.tokenMetadata.symbol,
  };
};
