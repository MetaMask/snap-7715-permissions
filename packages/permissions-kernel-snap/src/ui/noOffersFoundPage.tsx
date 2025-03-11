/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type {
  Permission,
  PermissionsRequest,
} from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import {
  Bold,
  Box,
  Divider,
  Row,
  Section,
  Text,
} from '@metamask/snaps-sdk/jsx';

import { Header } from './components';

const renderPermissions = (origin: string, permissions: Permission[]) => {
  return permissions.map((permission, _) => (
    <Section>
      <Row label="Origin">
        <Text>{`The site at ${origin} requests access to **${extractPermissionName(
          permission.type,
        )}**`}</Text>
      </Row>
      <Row label="Their justification">
        <Text>
          {permission.data.justification || 'No justification provided'}
        </Text>
      </Row>
      <Text>
        <Bold>However, no offers found for the requested permission.</Bold>
      </Text>
    </Section>
  ));
};

export const NoOffersFoundPage = (
  origin: string,
  requestedPermission: PermissionsRequest,
) => {
  return (
    <Box>
      <Header
        title="Permission Request"
        subtitle="Attempt to request permission"
      />
      <Divider />

      {requestedPermission.map((value, _) => (
        <Box direction="vertical" alignment="center">
          {renderPermissions(origin, value.permissions)}
        </Box>
      ))}
    </Box>
  );
};
