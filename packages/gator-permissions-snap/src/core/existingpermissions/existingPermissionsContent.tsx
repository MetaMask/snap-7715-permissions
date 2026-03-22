import {
  Box,
  Section,
  Heading,
  Text,
  Address,
  Container,
  Button,
  Footer,
} from '@metamask/snaps-sdk/jsx';
import { Hex } from '@metamask/utils';

import { groupPermissionsByFromAddress } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import { PermissionCard } from '../../ui/components/PermissionCard';
import { t } from '../../utils/i18n';

// Button name constant for event handling
export const EXISTING_PERMISSIONS_CONFIRM_BUTTON =
  'existing-permissions-confirm';

/**
 * Builds the existing permissions display content: a grouped list of stored grants for review.
 *
 * @param config - The configuration for the existing permissions display.
 * @returns The existing permissions UI as a JSX.Element.
 */
export function buildExistingPermissionsContent(
  config: ExistingPermissionDisplayConfig,
): JSX.Element {
  const { existingPermissions, title, description, buttonLabel } = config;

  const grouped = groupPermissionsByFromAddress(existingPermissions);

  return (
    <Container>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{t(title)}</Heading>
          <Text>{t(description)}</Text>
        </Box>

        {Object.entries(grouped).map(([accountAddress, permissions]) => {
          return (
            <Box key={`account-${accountAddress}`} direction="vertical">
              <Section direction="horizontal" alignment="space-between">
                <Text fontWeight="bold">{t('accountLabel')}</Text>
                <Address address={accountAddress as Hex} displayName={true} />
              </Section>
              {permissions.map((detail, index) => (
                <PermissionCard
                  key={`${accountAddress}-${index}`}
                  detail={detail}
                  index={index}
                />
              ))}
            </Box>
          );
        })}
      </Box>
      <Footer>
        <Button name={EXISTING_PERMISSIONS_CONFIRM_BUTTON}>
          {t(buttonLabel)}
        </Button>
      </Footer>
    </Container>
  );
}
