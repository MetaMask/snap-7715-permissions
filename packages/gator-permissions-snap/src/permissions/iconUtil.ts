import { logger } from '@metamask/7715-permissions-shared/utils';
import { BaseTokenPermissionContext, IconData } from '../core/types';

/**
 * Fetches an icon from a URL and converts it to a base64 data URI.
 *
 * This function downloads an image from the provided URL, converts the binary data
 * to a base64 string using a browser-compatible approach, and returns it as a
 * data URI with PNG MIME type.
 *
 * @param iconUrl - The URL of the icon to fetch and convert
 * @returns A Promise that resolves to a base64 data URI string, or undefined if iconUrl is empty
 * @throws Will throw an error if the fetch request fails or if there's an issue processing the image data
 */
export const fetchIconDataBase64 = async (
  iconUrl: string | undefined,
): Promise<{ success: true; imageDataBase64: string } | { success: false }> => {
  if (!iconUrl) {
    return { success: false };
  }

  try {
    let base64 = 'data:image/png;base64,';

    const iconResponse = await fetch(iconUrl);
    const iconBuffer = await iconResponse.arrayBuffer();
    const uint8Array = new Uint8Array(iconBuffer);

    // Convert uint8Array to base64 string using browser-compatible approach
    const base64Chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < uint8Array.length; i += 3) {
      const a = uint8Array[i] ?? 0;
      const b = uint8Array[i + 1] ?? 0;
      const c = uint8Array[i + 2] ?? 0;

      const combined = (a << 16) | (b << 8) | c;

      result += base64Chars[(combined >>> 18) & 63];
      result += base64Chars[(combined >>> 12) & 63];
      result +=
        i + 1 < uint8Array.length ? base64Chars[(combined >>> 6) & 63] : '=';
      result += i + 2 < uint8Array.length ? base64Chars[combined & 63] : '=';
    }
    base64 += result;

    return { success: true, imageDataBase64: base64 };
  } catch (error) {
    logger.error('Error fetching icon data', error);
    return { success: false };
  }
};

/**
 * Extracts icon data from a token permission context.
 *
 * This function takes a token permission context and extracts the icon data
 * from the token metadata. It returns an IconData object containing the base64
 * encoded icon and alt text, or undefined if no icon data is available.
 *
 * @param context - The token permission context containing token metadata
 * @returns An IconData object with iconDataBase64 and iconAltText, or undefined if no icon data exists
 */
export const getIconData = (
  context: BaseTokenPermissionContext,
): IconData | undefined => {
  const { iconDataBase64: iconUrl } = context.tokenMetadata;
  if (!iconUrl) {
    return undefined;
  }

  return {
    iconDataBase64: iconUrl,
    iconAltText: context.tokenMetadata.symbol,
  };
};
