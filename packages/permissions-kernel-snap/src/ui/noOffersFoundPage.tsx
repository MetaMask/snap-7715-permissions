import type { PermissionsRequest } from '@metamask/7715-permissions-shared/types';
import {
  Bold,
  Box,
  Divider,
  Row,
  Section,
  Text,
} from '@metamask/snaps-sdk/jsx';

import { extractPermissionName } from '../utils';
import { Header } from './components';

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
          <Section>
            <Row label="Origin">
              <Text>{`The site at ${origin} requests access to **${extractPermissionName(
                value.permission.type,
              )}**`}</Text>
            </Row>
            <Row label="Their justification">
              <Text>
                {value.permission.data.justification ||
                  'No justification provided'}
              </Text>
            </Row>
            <Text>
              <Bold>
                However, no offers found for the requested permission.
              </Bold>
            </Text>
          </Section>
        </Box>
      ))}
    </Box>
  );
};
