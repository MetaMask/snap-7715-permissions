import type { JsonObject, SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Divider,
  Section,
  Box,
  Tooltip,
  Icon,
} from '@metamask/snaps-sdk/jsx';
import { extractChain, toHex } from 'viem';
import * as ALL_CHAINS from 'viem/chains';

type RequestDetails = JsonObject & {
  siteOrigin: string;
  justification: string | undefined;
  chainId: number;
};

export const RequestDetails: SnapComponent<RequestDetails> = ({
  siteOrigin,
  justification,
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
      <Text>{justification ?? 'No justification provided'}</Text>
    </Section>
  );
};
