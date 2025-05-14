import { Text, Section, Box, Image } from '@metamask/snaps-sdk/jsx';
import { TooltipIcon } from './TooltipIcon';
import { ShowMoreText } from './ShowMoreText';

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
  iconUrl?: string | undefined;
};

export const RequestDetails = ({
  itemDetails,
  justification,
  isJustificationShowMoreCollapsed,
  justificationShowMoreElementName,
}: RequestDetailsProps) => {
  const requestDetailsFields = itemDetails.map(
    ({ label, text, iconUrl, tooltipText }) => {
      const iconElement = iconUrl ? <Image src={iconUrl} alt={text} /> : null;

      const tooltipElement = tooltipText ? (
        <TooltipIcon tooltip={tooltipText} />
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
