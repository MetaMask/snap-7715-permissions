import {
  Box,
  Button,
  Container,
  Section,
  Footer,
  Heading,
  Text,
} from '@metamask/snaps-sdk/jsx';

import { formatPermissionDetails } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import { PermissionCard } from '../../ui/components/PermissionCard';
import { t } from '../../utils/i18n';

// Button name constant for event handling
export const EXISTING_PERMISSIONS_CONFIRM_BUTTON =
  'existing-permissions-confirm';

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

  return (
    <Container>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{t(title)}</Heading>
          <Text>{t(description)}</Text>
        </Box>

        <Section>
          <Box direction="vertical">
            <Heading size="md">{t('existingPermissionsSectionTitle')}</Heading>

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
