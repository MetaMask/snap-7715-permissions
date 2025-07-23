import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Section, Text, Skeleton } from '@metamask/snaps-sdk/jsx';

import {
  ShowMoreText,
  SkeletonField,
  TextField,
  TooltipIcon,
} from '../ui/components';
import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from './permissionHandler';
import type { IconData } from './types';

export const RECIPIENT_LABEL = 'Recipient';
export const RECIPIENT_TOOLTIP = 'The site requesting the permission';
export const NETWORK_LABEL = 'Network';
export const NETWORK_TOOLTIP =
  'The network on which the permission is being requested';
export const TOKEN_LABEL = 'Token';
export const TOKEN_TOOLTIP = 'The token being requested';
export const REASON_LABEL = 'Reason';
export const REASON_TOOLTIP =
  'Reason given by the recipient for requesting this permission.';

export type PermissionHandlerContentProps = {
  children: SnapElement;
  permissionTitle: string;
  justification: string;
  networkName: string;
  tokenSymbol: string;
  tokenIconData?: IconData | undefined;
  isJustificationCollapsed: boolean;
  origin: string;
};

/**
 * Content wrapping a permission confirmation, including the title and add-more-rules button.
 *
 * @param options - The params for the content.
 * @param options.children - The children of the content.
 * @param options.permissionTitle - The title of the permission.
 * @param options.origin - The origin of the permission request.
 * @param options.justification - The justification for the permission request.
 * @param options.networkName - The name of the network.
 * @param options.tokenSymbol - The symbol of the token.
 * @param options.tokenIconData - The icon data of the token.
 * @param options.isJustificationCollapsed - Whether the justification is collapsed.
 * @returns The confirmation content.
 */
export const PermissionHandlerContent = ({
  children,
  permissionTitle,
  origin,
  justification,
  networkName,
  tokenSymbol,
  tokenIconData,
  isJustificationCollapsed,
}: PermissionHandlerContentProps): SnapElement => {
  return (
    <Box>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{permissionTitle}</Heading>
        </Box>
        <Section>
          <TextField
            label={RECIPIENT_LABEL}
            value={origin}
            tooltip={RECIPIENT_TOOLTIP}
          />
          <TextField
            label={NETWORK_LABEL}
            value={networkName}
            tooltip={NETWORK_TOOLTIP}
          />
          <TextField
            label={TOKEN_LABEL}
            value={tokenSymbol}
            tooltip={TOKEN_TOOLTIP}
            iconData={tokenIconData}
          />
          <Box direction="horizontal" alignment="space-between">
            <Box direction="horizontal">
              <Text>{REASON_LABEL}</Text>
              <TooltipIcon tooltip={REASON_TOOLTIP} />
            </Box>
            <Box direction="horizontal">
              <ShowMoreText
                text={justification}
                buttonName={JUSTIFICATION_SHOW_MORE_BUTTON_NAME}
                isCollapsed={isJustificationCollapsed}
              />
            </Box>
          </Box>
        </Section>
        {children}
      </Box>
    </Box>
  );
};

export const SkeletonPermissionHandlerContent = ({
  permissionTitle,
}: {
  permissionTitle: string;
}) => {
  return (
    <Box>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{permissionTitle}</Heading>
        </Box>
        <Section>
          <SkeletonField label={RECIPIENT_LABEL} tooltip={RECIPIENT_TOOLTIP} />
          <SkeletonField label={NETWORK_LABEL} tooltip={NETWORK_TOOLTIP} />
          <SkeletonField label={TOKEN_LABEL} tooltip={TOKEN_TOOLTIP} />
          <SkeletonField label={REASON_LABEL} tooltip={REASON_TOOLTIP} />
        </Section>
        <Section>
          <Skeleton />
          <Skeleton />
        </Section>
      </Box>
    </Box>
  );
};
