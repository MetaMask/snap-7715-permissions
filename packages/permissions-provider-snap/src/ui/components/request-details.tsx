import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Divider,
  Section,
  Box,
  Tooltip,
  Icon,
} from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import type { Permission } from '../../../../shared/src';

type RequestDetails = {
  siteOrigin: string;
  chainId: Hex;
  permission: Permission;
};

export const RequestDetails: SnapComponent<RequestDetails> = ({
  siteOrigin,
  permission,
}) => {
  const items = [
    {
      label: 'Requested by',
      text: siteOrigin,
      tooltipText: 'Tooltip text',
    },
    {
      label: 'Requesting',
      text: '10 USDC',
      tooltipText: 'Tooltip text',
    },
    {
      label: 'Network',
      text: 'Linea Sepolia',
      tooltipText: 'Tooltip text',
    },
  ].map((item) => (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{item.label}</Text>
        <Tooltip content={<Text>{item.tooltipText}</Text>}>
          <Icon name="question" size="inherit" color="muted" />
        </Tooltip>
      </Box>
      <Text>{item.text}</Text>
    </Box>
  ));

  return (
    <Section>
      {items}

      <Divider />

      <Text>Reason</Text>
      <Text>{permission.data.justification}</Text>
    </Section>
  );
};
