import {
  Box,
  Button,
  Container,
  Section,
  Footer,
  Heading,
  Text,
  AccountSelector,
} from '@metamask/snaps-sdk/jsx';
import { toCaipAccountId } from '@metamask/utils';

import { formatPermissionDetails } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import { PermissionCard } from '../../ui/components/PermissionCard';
import { t } from '../../utils/i18n';

// Button name constant for event handling
export const EXISTING_PERMISSIONS_CONFIRM_BUTTON =
  'existing-permissions-confirm';

export const ACCOUNT_SELECTOR_NAME = 'account-selector';
/**
 * Builds the existing permissions display content.
 * Shows a comparison between an existing permission and what the user is about to grant.
 *
 * @param config - The configuration for the existing permissions display.
 * @returns The existing permissions UI as a JSX.Element.
 */
export function buildExistingPermissionsContent(
  config: ExistingPermissionDisplayConfig,
): JSX.Element {
  const { existingPermissions, title, description, buttonLabel } = config;

  const permissionDetails = existingPermissions.map(formatPermissionDetails);

  // Get chainId and account address from the first permission
  const chainId = existingPermissions[0]?.chainId;
  const accountAddress = existingPermissions[0]?.from;

  // Convert to CAIP-10 format using the eip155 chain namespace
  const accountAddressCaip10 =
    chainId && accountAddress
      ? toCaipAccountId('eip155', chainId, accountAddress)
      : undefined;

  return (
    <Container>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{t(title)}</Heading>
          <Text>{t(description)}</Text>
        </Box>

        <Section>
          <Box direction="vertical">
            <Box direction="horizontal" alignment="space-between">
              <Box direction="horizontal">
                <Text>{t('accountLabel')}</Text>
              </Box>
            </Box>
            <AccountSelector
              name={ACCOUNT_SELECTOR_NAME}
              chainIds={chainId ? [`eip155:${chainId}`] : []}
              switchGlobalAccount={false}
              value={accountAddressCaip10}
            />
          </Box>
        </Section>

        <Section>
          <Box direction="vertical">
            {permissionDetails.map((detail, index) => (
              <PermissionCard
                key={`permission-${index}`}
                detail={detail}
                index={index}
              />
            ))}
          </Box>
        </Section>
      </Box>
      <Footer>
        <Button name={EXISTING_PERMISSIONS_CONFIRM_BUTTON}>
          {t(buttonLabel)}
        </Button>
      </Footer>
    </Container>
  );
}
