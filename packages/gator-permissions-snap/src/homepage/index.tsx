import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  Text,
  Box,
  Section,
  Heading,
  Link,
  Row,
  Divider,
} from '@metamask/snaps-sdk/jsx';

import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../profileSync';

export class HomePage {
  #snapsProvider: SnapsProvider;

  #profileSyncManager: ProfileSyncManager;

  constructor({
    snapsProvider,
    profileSyncManager,
  }: {
    snapsProvider: SnapsProvider;
    profileSyncManager: ProfileSyncManager;
  }) {
    this.#snapsProvider = snapsProvider;
    this.#profileSyncManager = profileSyncManager;
  }

  public async buildHomepage() {
    const content = await this.buildContents({
      showDirectionsToHomepage: false,
    });

    return content;
  }

  async buildContents({
    showDirectionsToHomepage,
  }: {
    showDirectionsToHomepage: boolean;
  }) {
    const grantedPermissions: StoredGrantedPermission[] =
      await this.#profileSyncManager.getAllGrantedPermissions();

    return (
      <Box>
        <Section>
          <Heading>Welcome to Gator Permissions!</Heading>
          <Text>
            Thanks for joining our preview phase! This snap currently only works
            with a special build of MetaMask Flask - if you need help getting
            started, reach out to us on{' '}
            <Link href="https://t.me/+I2dliwXiqqYyYjMx">Telegram</Link>.
          </Text>
          {showDirectionsToHomepage && (
            <Text>
              You'll be able to find this screen again by clicking ⋮ &gt; Snaps
              &gt; Gator Permissions.
            </Text>
          )}
          <Text>
            We're excited to have you building alongside us as we shape the
            future of web3 together.
          </Text>
          <Text>
            This is a work in progress and we'd love to hear your feedback -
            please reach out to us on{' '}
            <Link href="https://t.me/+I2dliwXiqqYyYjMx">Telegram</Link> if you
            have any questions or feedback.
          </Text>
          <Text fontWeight="bold">LFB!</Text>
        </Section>

        {grantedPermissions.length > 0 && (
          <Section>
            <Heading>Permissions</Heading>
            <Text>
              You have {grantedPermissions.length.toString()} permissions
              granted.
            </Text>

            <Box direction="vertical" alignment="center">
              {grantedPermissions.map(
                (item: StoredGrantedPermission, index: number) => (
                  <Box direction="vertical" alignment="start">
                    <Row label="Type">
                      <Text>
                        {extractPermissionName(
                          item.permissionResponse.permission.type,
                        )}
                      </Text>
                    </Row>
                    <Row label="Site origin">
                      <Text>{item.siteOrigin}</Text>
                    </Row>
                    {index !== grantedPermissions.length - 1 && <Divider />}
                  </Box>
                ),
              )}
            </Box>
          </Section>
        )}
      </Box>
    );
  }

  public async showWelcomeScreen() {
    const content = await this.buildContents({
      showDirectionsToHomepage: true,
    });

    await this.#snapsProvider.request({
      method: 'snap_dialog',
      params: {
        type: 'alert',
        content,
      },
    });
  }
}
