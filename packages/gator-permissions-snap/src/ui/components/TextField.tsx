import { Box, Text } from '@metamask/snaps-sdk/jsx';

import { TokenIcon } from './TokenIcon';
import { TooltipIcon } from './TooltipIcon';

export type TextFieldParams = {
  label: string;
  value: string;
  tooltip?: string | undefined;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
};

export const TextField = ({
  label,
  value,
  tooltip,
  iconData,
}: TextFieldParams) => {
  const iconElement = iconData ? (
    <TokenIcon
      imageDataBase64={iconData.iconDataBase64}
      altText={iconData.iconAltText}
    />
  ) : null;
  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;

  return (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{label}</Text>
        {tooltipElement}
      </Box>
      <Box direction="horizontal">
        {iconElement}
        <Text>{value}</Text>
      </Box>
    </Box>
  );
};
