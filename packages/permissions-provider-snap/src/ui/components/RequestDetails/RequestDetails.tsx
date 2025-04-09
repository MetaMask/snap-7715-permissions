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

export enum RequestDetailsEventNames {
  ShowMoreButton = 'request-details.show-more-button',
}

type RequestDetailsProps = JsonObject & {
  itemDetails: ItemDetails[];
};

export type ItemDetails = {
  label: string;
  text: string;
  tooltipText?: string;
  isHideable?: boolean;
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
 * @param isHideable - Whether the text is isHideable.
 * @returns A text component or a text component with a button to show more.
 */
const renderIsHideableText = (text: string, isHideable?: boolean) => {
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
      <Button name={RequestDetailsEventNames.ShowMoreButton}>Show</Button>
    </Box>
  );
};

export const RequestDetails: SnapComponent<RequestDetailsProps> = ({
  itemDetails,
}) => {
  const itemsDisplay = itemDetails.map((item) => (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{item.label}</Text>
        {renderTooltip(item.tooltipText)}
      </Box>
      <Box direction="horizontal">
        {renderIconAsImage(item.iconUrl)}
        {renderIsHideableText(item.text, item.isHideable)}
      </Box>
    </Box>
  ));

  return <Section>{itemsDisplay}</Section>;
};
