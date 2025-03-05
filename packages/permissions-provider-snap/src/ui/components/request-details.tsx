import type { JsonObject, SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Divider,
  Section,
  Box,
  Tooltip,
  Icon,
} from '@metamask/snaps-sdk/jsx';

import { getChainName } from '../../utils';

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
  const chainName = getChainName(chainId);
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
      text: `${chainName}`,
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
