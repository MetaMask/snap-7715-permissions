import { Box, Skeleton, Text } from '@metamask/snaps-sdk/jsx';

import { TooltipIcon } from './TooltipIcon';

export type SkeletonFieldParams = {
  label: string;
  tooltip?: string | undefined;
};

export const SkeletonField = ({ label, tooltip }: SkeletonFieldParams) => {
  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;

  return (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{label}</Text>
        {tooltipElement}
      </Box>
      <Box direction="horizontal">
        <Skeleton />
      </Box>
    </Box>
  );
};
