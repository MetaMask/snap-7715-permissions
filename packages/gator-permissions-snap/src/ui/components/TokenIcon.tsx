import {
  extractZodError,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Image, Text } from '@metamask/snaps-sdk/jsx';
import { z } from 'zod';

export type TokenIconParams = {
  imageDataBase64: string | null;
  altText: string;
  width?: number;
  height?: number;
};

const MAX_ICON_SIZE = 512;

// Dangerous SVG elements and attributes that could execute scripts
const DANGEROUS_SVG_ELEMENTS = [
  'script',
  'foreignObject',
  'iframe',
  'object',
  'embed',
  'link',
  'style',
];

const DANGEROUS_SVG_ATTRIBUTES = [
  'onload',
  'onerror',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onmousedown',
  'onmouseup',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onreset',
  'onselect',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onabort',
  'oncanplay',
  'oncanplaythrough',
  'ondurationchange',
  'onemptied',
  'onended',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onpause',
  'onplay',
  'onplaying',
  'onprogress',
  'onratechange',
  'onseeked',
  'onseeking',
  'onstalled',
  'onsuspend',
  'ontimeupdate',
  'onvolumechange',
  'onwaiting',
  'href',
  'xlink:href',
];

// zod schema for runtime validation
const TokenIconParamsSchema = z.object({
  imageDataBase64: z
    .string()
    .regex(
      /^data:image\/(svg\+xml|png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/u,
      'Must be a valid base64 data URI',
    )
    .refine((dataUri) => {
      // Only validate SVG content for security
      if (!dataUri.startsWith('data:image/svg+xml;base64,')) {
        return true; // PNG/JPEG don't need content validation
      }

      try {
        const base64Content = dataUri.replace('data:image/svg+xml;base64,', '');
        const decodedContent = atob(base64Content);
        const lowercaseContent = decodedContent.toLowerCase();

        // Check for dangerous elements
        for (const element of DANGEROUS_SVG_ELEMENTS) {
          if (lowercaseContent.includes(`<${element}`)) {
            return false;
          }
        }

        // Check for dangerous attributes
        for (const attribute of DANGEROUS_SVG_ATTRIBUTES) {
          if (lowercaseContent.includes(`${attribute}=`)) {
            return false;
          }
        }
        return true;
      } catch {
        return false; // Invalid base64 or decoding error
      }
    }, 'SVG content contains dangerous elements or attributes'),
  altText: z.string().default(''),
  width: z.number().int().positive().max(MAX_ICON_SIZE).default(24),
  height: z.number().int().positive().max(MAX_ICON_SIZE).default(24),
});

export const TokenIcon: SnapComponent<TokenIconParams> = (props) => {
  if (!props.imageDataBase64) {
    return <Text> </Text>;
  }

  const parseResult = TokenIconParamsSchema.safeParse(props);

  if (!parseResult.success) {
    logger.warn(
      'TokenIcon: Invalid parameters',
      extractZodError(parseResult.error.errors),
    );
    return <Text> </Text>;
  }

  const { imageDataBase64, altText, width, height } = parseResult.data;

  const imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <image href="${imageDataBase64}" width="${width}" height="${height}" />
  </svg>`;

  return <Image src={imageSvg} alt={altText} />;
};
