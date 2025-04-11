import { SnapsProvider } from '@metamask/snaps-sdk';
import {
  Text,
  Box,
  Section,
  Heading,
  Link,
  Address,
} from '@metamask/snaps-sdk/jsx';

import { AccountController } from 'src/accountController';
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
          <Heading>Welcome!</Heading>
          <Text>
            We've created a special Smart Contract Account for testing
            permissions. It won't show in MetaMask like other accounts will.
            This account should only be used on the Sepolia testnet.
          </Text>
          <Box direction="vertical">
            <Link href={`https://sepolia.etherscan.io/address/${address}`}>
              <Address address={address} />
            </Link>
          </Box>
          {showDirectionsToHomepage && (
            <Text>
              You'll be able to find this information by clicking ⋮ &gt; Snaps
              &gt; Gator Permissions
            </Text>
          )}
          <Text>
            Thanks for testing with us! This is a work in progress and we'd love
            to hear your feedback.
          </Text>
          <Text>
            Please reach out to us on{' '}
            <Link href="https://discord.com/invite/consensys">Discord</Link> if
            you have any questions or feedback.
          </Text>
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
