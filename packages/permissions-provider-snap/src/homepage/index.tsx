import { SnapsProvider } from '@metamask/snaps-sdk';
import {
  Text,
  Box,
  Section,
  Heading,
  Link,
  Address,
} from '@metamask/snaps-sdk/jsx';

import { AccountController } from '../core';
import { sepolia } from 'viem/chains';

export class HomePage {
  #accountController: AccountController;
  #snapsProvider: SnapsProvider;

  constructor({
    accountController,
    snapsProvider,
  }: {
    accountController: AccountController;
    snapsProvider: SnapsProvider;
  }) {
    this.#accountController = accountController;
    this.#snapsProvider = snapsProvider;
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
            <Link href="https://t.me/+I2dliwXiqqYyYjMx">Telegram</Link> if you have
            any questions or feedback.
          </Text>
          <Text fontWeight="bold">LFB!</Text>
        </Section>
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
