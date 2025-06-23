import { SnapComponent, Image, Text } from '@metamask/snaps-sdk/jsx';

export type TokenIconParams = {
  imageDataBase64: string | null;
  altText: string;
  width?: number;
  height?: number;
};

export const TokenIcon: SnapComponent<TokenIconParams> = ({
  imageDataBase64,
  altText,
  width = 24,
  height = 24,
}) => {
  if (!imageDataBase64) {
    return <Text> </Text>;
  }

  const imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="${imageDataBase64}" width="${width}" height="${height}" />
  </svg>`;

  return <Image src={imageSvg} alt={altText} />;
};
