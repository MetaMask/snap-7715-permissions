import {
  Box,
  Button,
  Container,
  Section,
  Footer,
  Heading,
  Text,
  Address,
  Divider,
  Bold,
  Skeleton,
} from '@metamask/snaps-sdk/jsx';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Hex } from '@metamask/utils';

import { groupPermissionsByFromAddress } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import { PermissionCard } from '../../ui/components/PermissionCard';
import { t } from '../../utils/i18n';

// Button name constant for event handling
export const EXISTING_PERMISSIONS_CONFIRM_BUTTON =
  'existing-permissions-confirm';

// Maximum number of permissions to display per account
const MAX_PERMISSIONS_PER_ACCOUNT = 3;

/**
 * Builds a skeleton loading state for the existing permissions dialog.
 * Shows placeholder UI while permissions are being fetched and formatted.
 *
 * @param config - The configuration for the existing permissions display (used for title/description).
 * @returns The skeleton loading UI as a JSX.Element.
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
              <Divider />
              {/* Show 2 skeleton permission cards */}
              {[0, 1].map((permIndex) => (
                <Box
                  key={`skeleton-permission-${permIndex}`}
                  direction="vertical"
                >
                  {permIndex > 0 && <Divider />}
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

  const grouped = groupPermissionsByFromAddress(existingPermissions);

  return (
    <Container>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{t(title)}</Heading>
          <Text>{t(description)}</Text>
        </Box>

        {Object.entries(grouped).map(([accountAddress, permissions]) => {
          const displayedPermissions = permissions.slice(
            0,
            MAX_PERMISSIONS_PER_ACCOUNT,
          );
          const hasMorePermissions =
            permissions.length > MAX_PERMISSIONS_PER_ACCOUNT;
          const moreCount = permissions.length - MAX_PERMISSIONS_PER_ACCOUNT;

          return (
            <Section key={`account-${accountAddress}`}>
              <Box direction="vertical">
                <Box direction="horizontal" alignment="space-between">
                  <Text fontWeight="bold">{t('accountLabel')}</Text>
                  <Address address={accountAddress as Hex} displayName={true} />
                </Box>
                <Divider />
                {displayedPermissions.map((detail, index) => (
                  <PermissionCard
                    key={`permission-${index}`}
                    detail={detail}
                    index={index}
                  />
                ))}
                {hasMorePermissions && (
                  <Box direction="vertical">
                    <Divider />
                    <Text>
                      {moreCount === 1
                        ? t('morePermissionsCountSingle')
                        : t('morePermissionsCountPlural', [String(moreCount)])}
                      <Bold>{t('dappConnectionsLink')}</Bold>
                    </Text>
                  </Box>
                )}
              </Box>
            </Section>
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
