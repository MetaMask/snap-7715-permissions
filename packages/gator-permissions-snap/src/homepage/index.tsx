import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  Text,
  Box,
  Section,
  Heading,
  Link,
  Address,
  Row,
  Divider,
  Skeleton,
} from '@metamask/snaps-sdk/jsx';

import type { AccountControllerInterface } from '../core/types';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../profileSync';

const MAINNET_CHAIN_ID = 1;

export class HomePage {
  #accountController: AccountControllerInterface;

  #snapsProvider: SnapsProvider;

  #profileSyncManager: ProfileSyncManager;

  constructor({
    accountController,
    snapsProvider,
    profileSyncManager,
  }: {
    accountController: AccountControllerInterface;
    snapsProvider: SnapsProvider;
    profileSyncManager: ProfileSyncManager;
  }) {
    this.#accountController = accountController;
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
    const [address] = await this.#accountController.getAccountAddresses({
      // this chainId actually doesn't matter here, because we're only using it to infer the address
      chainId: MAINNET_CHAIN_ID,
    });

    const grantedPermissions: StoredGrantedPermission[] =
      await this.#profileSyncManager.getAllGrantedPermissions();

    return (
      <Box>
        <Section>
          <Heading>Welcome to Gator Permissions!</Heading>
          <Text>
            Thanks for joining our preview phase! We've set up a dedicated Smart
            Account for you to easily experiment with permissions. This account
            won't appear alongside your usual MetaMask accounts and should only
            be used on Sepolia testnet.
          </Text>
          <Box direction="vertical">
            {address ? (
              <Link href={`https://sepolia.etherscan.io/address/${address}`}>
                <Address address={address} />
              </Link>
            ) : (
              <Skeleton />
            )}
          </Box>
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
