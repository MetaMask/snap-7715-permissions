import type { JsonObject, SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Section,
  Box,
  Tooltip,
  Icon,
  Image,
  Button,
} from '@metamask/snaps-sdk/jsx';
import { extractChain } from 'viem';
import * as ALL_CHAINS from 'viem/chains';

import { ASSET_ICONS, NETWORK_ICONS } from '../iconConstant';

type RequestDetailsProps = JsonObject & {
  siteOrigin: string;
  justification: string | undefined;
  chainId: number;
  asset: string;
};

type ItemDetails = {
  label: string;
  text: string;
  tooltipText?: string;
  hiddable?: boolean;
  icon?: string;
};

/**
 * Renders a tooltip with the given text.
 *
 * @param tooltipText - The text to display in the tooltip.
 * @returns A tooltip component.
 */
const renderTooltip = (tooltipText?: string) => {
  if (!tooltipText) {
    return null;
  }

  return (
    <Tooltip content={<Text>{tooltipText}</Text>}>
      <Icon name="question" size="inherit" color="muted" />
    </Tooltip>
  );
};

/**
 * Renders an icon with the given URL.
 *
 * @param icon - The URL of the icon to display.
 * @returns An image component.
 */
const renderIconAsImage = (icon?: string) => {
  if (!icon) {
    return null;
  }

  return <Image src={icon} />;
};

/**
 * Renders the text with the option to show more.
 *
 * @param text - The text to display.
 * @param label - The label of the text.
 * @param hiddable - Whether the text is hiddable.
 * @returns A text component.
 */
const renderHiddableText = (
  text: string,
  label: string,
  hiddable?: boolean,
) => {
  if (!hiddable) {
    return <Text>{text}</Text>;
  }

  // TODO: Add the event handle logic to make the button interactive
  const buttonName = `request-details.hiddableText.${label}`;
  return (
    <Box direction="horizontal">
      <Text>{`${text.slice(0, 12)}...`}</Text>
      <Button name={buttonName}>Show more</Button>
    </Box>
  );
};

export const RequestDetails: SnapComponent<RequestDetailsProps> = ({
  siteOrigin,
  justification,
  chainId,
  asset,
}) => {
  // @ts-expect-error - extractChain does not work well with dynamic `chains`
  const chain = extractChain({
    chains: Object.values(ALL_CHAINS),
    id: chainId as any,
  });

  const networkIcon = NETWORK_ICONS[chainId];
  const assetIcon = ASSET_ICONS[chainId];
  if (!networkIcon || !assetIcon) {
    throw new Error('No icon found');
  }

  const items: ItemDetails[] = [
    {
      label: 'Recipient',
      text: siteOrigin,
      tooltipText: 'Recipient tool tip text',
    },
    {
      label: 'Network',
      text: chain.name,
      icon: networkIcon,
    },
    {
      label: 'Token',
      text: asset,
      icon: assetIcon,
    },
    {
      label: 'Reason',
      text: justification ?? 'No reason provided',
      tooltipText: 'Tooltip text',
      hiddable: true,
    },
  ];

  const itemsDisplay = items.map((item) => (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{item.label}</Text>
        {renderTooltip(item.tooltipText)}
      </Box>
      <Box direction="horizontal">
        {renderIconAsImage(item.icon)}
        {renderHiddableText(item.text, item.label, item.hiddable)}
      </Box>
    </Box>
  ));

  return <Section>{itemsDisplay}</Section>;
};
