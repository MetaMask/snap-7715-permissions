import { ConnectButton, InstallMetaMaskButton } from './Buttons';
import { Card } from './Card';

type SnapConnectionCardsProps = {
  isGatorSnapReady: boolean;
  isKernelSnapReady: boolean;
  isMetaMaskReady: boolean;
  onRequestKernelSnap: () => Promise<void> | void;
  onRequestPermissionSnap: () => Promise<void> | void;
};

export const SnapConnectionCards = ({
  isGatorSnapReady,
  isKernelSnapReady,
  isMetaMaskReady,
  onRequestKernelSnap,
  onRequestPermissionSnap,
}: SnapConnectionCardsProps) => (
  <>
    {!isMetaMaskReady && (
      <Card
        content={{
          title: 'Install',
          description:
            'Snaps requires MetaMask to be installed. Install MetaMask to get started.',
          button: <InstallMetaMaskButton />,
        }}
        fullWidth
      />
    )}

    <Card
      content={{
        title: `${isKernelSnapReady ? 'Reconnect' : 'Connect'}(kernel)`,
        description:
          'Get started by connecting to and installing the kernel snap.',
        button: (
          <ConnectButton
            onClick={onRequestKernelSnap}
            disabled={!isMetaMaskReady}
            $isReconnect={isKernelSnapReady}
          />
        ),
      }}
      disabled={!isMetaMaskReady}
    />

    <Card
      content={{
        title: `${isGatorSnapReady ? 'Reconnect' : 'Connect'}(provider)`,
        description:
          'Get started by connecting to and installing the permission provider snap.',
        button: (
          <ConnectButton
            onClick={onRequestPermissionSnap}
            disabled={!isMetaMaskReady}
            $isReconnect={isGatorSnapReady}
          />
        ),
      }}
      disabled={!isMetaMaskReady}
    />
  </>
);
