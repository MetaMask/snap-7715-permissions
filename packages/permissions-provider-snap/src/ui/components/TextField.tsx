import { Box, Text } from '@metamask/snaps-sdk/jsx';
import { TooltipIcon } from './TooltipIcon';

export type TextFieldParams = {
  label: string;
  value: string;
  tooltip?: string | undefined;
};

export const TextField = ({ label, value, tooltip }: TextFieldParams) => {
  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;

  return (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{label}</Text>
        {tooltipElement}
      </Box>
      <Box direction="horizontal">
        <Text>{value}</Text>
      </Box>
    </Box>
  );
};
