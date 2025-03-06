import type { Permission } from '@metamask/7715-permissions-shared/types';
import type { JSXElement } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Divider,
  Section,
  Box,
  Tooltip,
  Icon,
} from '@metamask/snaps-sdk/jsx';
import { extractChain, type Hex, toHex } from 'viem';
import * as ALL_CHAINS from 'viem/chains';

type RequestDetails = {
  siteOrigin: string;
  permission: Permission;
  accountAddress: Hex;
  chainId: number;
};

export const RequestDetails: (params: RequestDetails) => JSXElement = ({
  siteOrigin,
  permission,
  accountAddress,
  chainId,
}) => {
  // @ts-expect-error - extractChain does not work well with dynamic `chains`
  const chain = extractChain({
    chains: Object.values(ALL_CHAINS),
    id: chainId as any,
  });

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
      text: chain?.name || toHex(chainId),
      tooltipText: 'Tooltip text',
    },
    {
      label: 'Account',
      text: accountAddress,
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
      <Text>
        {permission.data.justification || 'No justification provided'}
      </Text>
    </Section>
  );
};
