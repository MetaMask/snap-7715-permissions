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

import { ICONS } from '../iconConstant';

type RequestDetailsProps = JsonObject & {
  siteOrigin: string;
  justification?: string | undefined;
  chainId: number;
  asset: string;
  isJustificationShowMoreExpanded: boolean;
  justificationShowMoreExpandedElementName: string;
};

type ItemDetails = {
  label: string;
  text: string;
  tooltipText?: string;
  iconUrl?: string;
};

/**
 * Renders a tooltip with the given text.
 *
 * @param tooltipText - The text to display in the tooltip.
 * @returns A tooltip component or null if no tooltip text is specified.
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
 * @param iconUrl - The URL of the icon to display.
 * @returns An image component null if no icon url is specified.
 */
const renderIconAsImage = (iconUrl?: string) => {
  if (!iconUrl) {
    return null;
  }

  return <Image src={iconUrl} />;
};

/**
 * Renders a text component or a text component with a button to show more.
 *
 * @param text - The text to display.
 * @param elementName - Element name for the toggle button.
 * @param isHideable - Whether the text is isHideable.
 * @returns A text component or a text component with a button to show more.
 */
const renderShowMoreText = (
  text: string,
  elementName: string,
  isHideable: boolean,
) => {
  if (!isHideable) {
    return <Text>{text}</Text>;
  }

  return (
    <Box direction="horizontal">
      {isHideable ? (
        <Text color="muted">{`${text.slice(0, 12)}...`}</Text>
      ) : (
        <Text color="muted">text</Text>
      )}
      <Button name={elementName}>Show</Button>
    </Box>
  );
};

export const RequestDetails: SnapComponent<RequestDetailsProps> = ({
  siteOrigin,
  justification,
  chainId,
  asset, // TODO: Update to use caip-19 asset
  isJustificationShowMoreExpanded,
  justificationShowMoreExpandedElementName,
}) => {
  // @ts-expect-error - extractChain does not work well with dynamic `chains`
  const chain = extractChain({
    chains: Object.values(ALL_CHAINS),
    id: chainId as any,
  });

  const icons = ICONS[chainId];
  if (!icons) {
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
      iconUrl: icons.network,
    },
    {
      label: 'Token',
      text: asset,
      iconUrl: icons.token,
    },
    {
      label: 'Reason',
      text: justification ?? 'No reason provided',
      tooltipText: 'Tooltip text',
    },
  ];

  const itemsDisplay = items.map((item) => (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{item.label}</Text>
        {renderTooltip(item.tooltipText)}
      </Box>
      <Box direction="horizontal">
        {renderIconAsImage(item.iconUrl)}
        {item.label === 'Reason' ? (
          renderShowMoreText(
            item.text,
            justificationShowMoreExpandedElementName,
            isJustificationShowMoreExpanded,
          )
        ) : (
          <Text>{item.text}</Text>
        )}
      </Box>
    </Box>
  ));

  return <Section>{itemsDisplay}</Section>;
};
