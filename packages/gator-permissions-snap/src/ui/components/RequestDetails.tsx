import { Text, Section, Box } from '@metamask/snaps-sdk/jsx';

import { ShowMoreText } from './ShowMoreText';
import { TokenIcon } from './TokenIcon';
import { TooltipIcon } from './TooltipIcon';

type RequestDetailsProps = {
  itemDetails: ItemDetails[];
  justification: string;
  isJustificationShowMoreCollapsed: boolean;
  justificationShowMoreElementName: string;
};

export type ItemDetails = {
  label: string;
  text: string;
  tooltipText?: string | undefined;
  iconData?: { iconDataBase64: string; altText: string } | undefined;
};

export const RequestDetails = ({
  itemDetails,
  justification,
  isJustificationShowMoreCollapsed,
  justificationShowMoreElementName,
}: RequestDetailsProps) => {
  const requestDetailsFields = itemDetails.map(
    ({ label, text, iconData, tooltipText }) => {
      const tooltipElement = tooltipText ? (
        <TooltipIcon tooltip={tooltipText} />
      ) : null;

      const iconElement = iconData ? (
        <TokenIcon
          imageDataBase64={iconData.iconDataBase64}
          altText={iconData.altText}
        />
      ) : null;

      return (
        <Box direction="horizontal" alignment="space-between">
          <Box direction="horizontal">
            <Text>{label}</Text>
            {tooltipElement}
          </Box>
          <Box direction="horizontal">
            {iconElement}
            <Text>{text}</Text>
          </Box>
        </Box>
      );
    },
  );

  return (
    <Section>
      {requestDetailsFields}
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>Reason</Text>
          <TooltipIcon tooltip="Reason given by the recipient for requesting this token stream allowance." />
        </Box>
        <Box direction="horizontal">
          <ShowMoreText
            text={justification}
            buttonName={justificationShowMoreElementName}
            isCollapsed={isJustificationShowMoreCollapsed}
          />
        </Box>
      </Box>
    </Section>
  );
};
