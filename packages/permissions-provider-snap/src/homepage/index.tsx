import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  Text,
  Box,
  Section,
  Heading,
  Link,
  Address,
  Divider,
} from '@metamask/snaps-sdk/jsx';
import { sepolia } from 'viem/chains';

import type { AccountController } from '../accountController';
import type { ProfileSyncManager } from '../profileSync';

export class HomePage {
  #accountController: AccountController;

  #snapsProvider: SnapsProvider;

  #profileSyncManager: ProfileSyncManager;

  constructor({
    accountController,
    snapsProvider,
    profileSyncManager,
  }: {
    accountController: AccountController;
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
    const address = await this.#accountController.getAccountAddress({
      // this chainId actually doesn't matter here, because we're only using it to infer the address
      chainId: sepolia.id,
    });

    const grantedPermissions =
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
            <Link href={`https://sepolia.etherscan.io/address/${address}`}>
              <Address address={address} />
            </Link>
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
            <Divider />
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
