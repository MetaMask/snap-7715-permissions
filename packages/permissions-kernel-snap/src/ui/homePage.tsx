import type {
  PermissionOfferRegistry,
  RegisteredPermissionOffer,
} from '@metamask/7715-permissions-shared/types';
import {
  Box,
  Text,
  Row,
  Divider,
  Section,
  Bold,
} from '@metamask/snaps-sdk/jsx';

import { extractPermissionName } from '../utils';
import { Header } from './components';

export const HomePageContent = (
  permissionOfferRegistry: PermissionOfferRegistry,
) => {
  return {
    content: (
      <Box>
        <Header
          title="Permission Offer Registry"
          subtitle="View list of cryptographic abilities as permissions from permission providers."
        />

        <Divider />

        {Object.entries(permissionOfferRegistry).map(([key, values]) => (
          <Box>
            <Text>
              <Bold>Permission provider: {key}</Bold>
            </Text>
            <Box direction="vertical" alignment="center">
              {values.map((offer: RegisteredPermissionOffer, _) => (
                <Box direction="vertical" alignment="end">
                  <Section>
                    <Text>
                      <Bold>Permission Offer</Bold>
                    </Text>
                    <Row label="Type">
                      <Text>{extractPermissionName(offer.type)}</Text>
                    </Row>
                    <Row label="Proposed Name">
                      <Text>{offer.proposedName}</Text>
                    </Row>
                  </Section>
                </Box>
              ))}
            </Box>
            <Divider />
          </Box>
        ))}
      </Box>
    ),
  };
};
