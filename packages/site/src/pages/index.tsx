import { useState } from 'react';
import styled from 'styled-components';
import { toHex } from 'viem';
import { sepolia } from 'viem/chains';

import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  CustomMessageButton,
  Card,
} from '../components';
import { kernelSnapOrigin, gatorSnapOrigin } from '../config';
import {
  useMetaMask,
  useInvokeSnap,
  useMetaMaskContext,
  useRequestSnap,
} from '../hooks';
import { isLocalSnap, shouldDisplayReconnectButton } from '../utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary?.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  color: ${({ theme }) => theme.colors.text?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const LogWrapper = styled.pre`
  background-color: ${(props) => props.theme.colors.primary?.default};
  padding: 1rem;
  border-radius: 0.5rem;
  width: 50%;
  height: 16rem;
  overflow-x: auto;
  overflow-y: auto;
  word-break: break-word;
`;

const Index = () => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected, installedSnaps } = useMetaMask();
  const requestKernelSnap = useRequestSnap(kernelSnapOrigin);
  const requestGatorSnap = useRequestSnap(gatorSnapOrigin);
  const invokeKernelSnap = useInvokeSnap(kernelSnapOrigin);

  const isMetaMaskReady = isLocalSnap(kernelSnapOrigin)
    ? isFlask
    : snapsDetected;
  const isKernelSnapReady = Boolean(installedSnaps[kernelSnapOrigin]);
  const isGatorSnapReady = Boolean(installedSnaps[gatorSnapOrigin]);
  const mockDappSessionAccount = '0x016562aA41A8697720ce0943F003141f5dEAe006';

  const [log, setLog] = useState<string[]>([]);
  const appendToLog = (action: string, response: any) => {
    const timestamp = new Date().toISOString();
    const body = JSON.stringify(
      response,
      (_, value: any) =>
        typeof value === 'bigint' || typeof value === 'number'
          ? BigInt(value).toString()
          : value,
      2,
    );
    const logEntry = `${timestamp} - ${action}:\n${body}`;
    setLog((prevLog) => [...prevLog, logEntry]);
  };

  const handleGrantPermissions = async () => {
    const permissionsRequests = [
      {
        chainId: toHex(sepolia.id),
        expiry: 1,
        signer: {
          type: 'account',
          data: {
            address: mockDappSessionAccount,
          },
        },
        permission: {
          type: 'native-token-transfer',
          data: {
            justification: 'shh...permission 1',
            allowance: '0x1DCD6500',
          },
        },
      },
    ];
    const response = await invokeKernelSnap({
      method: 'wallet_grantPermissions',
      params: permissionsRequests,
    });
    appendToLog('Request Permission(single permission)', response);
  };

  const handleGrantPermissionsMulti = async () => {
    const permissionsRequests = [
      {
        chainId: toHex(sepolia.id),
        expiry: 1,
        signer: {
          type: 'account',
          data: {
            address: mockDappSessionAccount,
          },
        },
        permission: {
          type: 'native-token-transfer',
          data: {
            justification: 'shh...permission 1',
            allowance: '0x1DCD6500',
          },
        },
      },
      {
        chainId: toHex(sepolia.id),
        expiry: 1,
        signer: {
          type: 'account',
          data: {
            address: mockDappSessionAccount,
          },
        },
        permission: {
          type: 'erc20-token-transfer',
          data: {
            justification: 'shh...permission 2',
            address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            allowance: '0x1DCD6500',
          },
        },
      },
      {
        chainId: toHex(sepolia.id),
        expiry: 1,
        signer: {
          type: 'account',
          data: {
            address: mockDappSessionAccount,
          },
        },
        permission: {
          type: 'erc20-token-transfer',
          data: {
            justification: 'shh...permission 3',
            address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
            allowance: '0x1DCD6500',
          },
        },
      },
    ];
    const response = await invokeKernelSnap({
      method: 'wallet_grantPermissions',
      params: permissionsRequests,
    });
    appendToLog('Request Permission(Multi permissions)', response);
  };

  const handleGrantPermissionsNoOffer = async () => {
    const permissionsRequests = [
      {
        chainId: toHex(sepolia.id),
        expiry: 1,
        signer: {
          type: 'account',
          data: {
            address: mockDappSessionAccount,
          },
        },
        permission: {
          type: 'erc721-token-transfer', // This permission type is not registered by gator snap
          data: {
            justification: 'shh',
            allowance: '0x1DCD6500',
          },
        },
      },
    ];
    const response = await invokeKernelSnap({
      method: 'wallet_grantPermissions',
      params: permissionsRequests,
    });
    appendToLog('Request Permission(offer not registered)', response);
  };

  return (
    <Container>
      <Heading>
        Welcome to <Span>7715 permissions snap</Span>
      </Heading>
      <Subtitle>
        Get started by installing snaps and sending permissions requests.
      </Subtitle>
      <LogWrapper>
        {log.length > 0 ? log.join('\n\n') : 'No actions logged...'}
      </LogWrapper>
      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        )}
        {!isMetaMaskReady && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}

        {/* Show connect buttons */}
        {!isKernelSnapReady && (
          <Card
            content={{
              title: 'Connect(kernel)',
              description:
                'Get started by connecting to and installing the kernel snap.',
              button: (
                <ConnectButton
                  onClick={requestKernelSnap}
                  disabled={!isMetaMaskReady}
                />
              ),
            }}
            disabled={!isMetaMaskReady}
          />
        )}
        {!isGatorSnapReady && (
          <Card
            content={{
              title: 'Connect(gator)',
              description:
                'Get started by connecting to and installing the gator snap.',
              button: (
                <ConnectButton
                  onClick={requestGatorSnap}
                  disabled={!isMetaMaskReady}
                />
              ),
            }}
            disabled={!isMetaMaskReady}
          />
        )}

        {/* Show reconnect buttons */}
        {shouldDisplayReconnectButton(installedSnaps[kernelSnapOrigin]) && (
          <Card
            content={{
              title: 'Reconnect(kernel)',
              description:
                'While connected to a local running kernel snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={requestKernelSnap}
                  disabled={!isKernelSnapReady}
                />
              ),
            }}
            disabled={!isKernelSnapReady}
          />
        )}
        {shouldDisplayReconnectButton(installedSnaps[gatorSnapOrigin]) && (
          <Card
            content={{
              title: 'Reconnect(gator)',
              description:
                'While connected to a local running gator snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={requestGatorSnap}
                  disabled={!isGatorSnapReady}
                />
              ),
            }}
            disabled={!isGatorSnapReady}
          />
        )}

        {/* Send permissions request */}
        <Card
          content={{
            title: 'Grant Permission',
            description: 'Send a single 7715 permission request to MetaMask.',
            button: (
              <CustomMessageButton
                text="Grant Permission"
                onClick={handleGrantPermissions}
                disabled={!installedSnaps[kernelSnapOrigin]}
              />
            ),
          }}
          disabled={!installedSnaps[kernelSnapOrigin]}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnaps[kernelSnapOrigin]) &&
            !shouldDisplayReconnectButton(installedSnaps[kernelSnapOrigin])
          }
        />

        <Card
          content={{
            title: 'Grant Permissions',
            description: 'Send a multiple 7715 permission request to MetaMask.',
            button: (
              <CustomMessageButton
                text="Grant Permissions"
                onClick={handleGrantPermissionsMulti}
                disabled={!installedSnaps[kernelSnapOrigin]}
              />
            ),
          }}
          disabled={!installedSnaps[kernelSnapOrigin]}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnaps[kernelSnapOrigin]) &&
            !shouldDisplayReconnectButton(installedSnaps[kernelSnapOrigin])
          }
        />

        <Card
          content={{
            title: 'Grant Permission(no offer registered)',
            description:
              'Send a single 7715 permission request to MetaMask with a type that is not registered by gator snap.',
            button: (
              <CustomMessageButton
                text="Grant Permission(no offer registered)"
                onClick={handleGrantPermissionsNoOffer}
                disabled={!installedSnaps[kernelSnapOrigin]}
              />
            ),
          }}
          disabled={!installedSnaps[kernelSnapOrigin]}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnaps[kernelSnapOrigin]) &&
            !shouldDisplayReconnectButton(installedSnaps[kernelSnapOrigin])
          }
        />
        <Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Notice>
      </CardContainer>
    </Container>
  );
};

export default Index;
