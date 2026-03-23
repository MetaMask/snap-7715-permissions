import {
  Box,
  Section,
  Heading,
  Text,
  Address,
  Container,
  Button,
  Footer,
  Skeleton,
  SnapElement,
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
 * Builds a skeleton loading UI for the existing permissions page.
 * Displays placeholder content while permissions are being loaded and formatted.
 *
 * @returns The skeleton UI as a JSX.Element.
 */
export function buildExistingPermissionsSkeletonContent(
  config: ExistingPermissionDisplayConfig,
): SnapElement {
  const { title, description, buttonLabel } = config;

  return (
    <Container>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{t(title)}</Heading>
          <Text>{t(description)}</Text>
        </Box>

        {/* Show 2 skeleton account groups */}
        {[0, 1].map((index) => (
          <Section key={`skeleton-account-${index}`}>
            <Box direction="vertical">
              <Box direction="horizontal" alignment="space-between">
                <Text fontWeight="bold">{t('accountLabel')}</Text>
                <Skeleton />
              </Box>
              {/* Show 2 skeleton permission cards */}
              {[0, 1].map((permIndex) => (
                <Box
                  key={`skeleton-permission-${permIndex}`}
                  direction="vertical"
                >
                  <Box direction="vertical">
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                  </Box>
                </Box>
              ))}
            </Box>
          </Section>
        ))}
      </Box>
      <Footer>
        <Button name={EXISTING_PERMISSIONS_CONFIRM_BUTTON} disabled={true}>
          {t(buttonLabel)}
        </Button>
      </Footer>
    </Container>
  );
}

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
