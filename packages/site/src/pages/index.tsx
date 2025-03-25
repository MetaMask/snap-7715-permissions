import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { createClient, custom } from 'viem';

import {
  ConnectButton,
  InstallFlaskButton,
  CustomMessageButton,
  Card,
} from '../components';
import { kernelSnapOrigin, gatorSnapOrigin } from '../config';
import { useMetaMask, useMetaMaskContext, useRequestSnap } from '../hooks';
import { isLocalSnap } from '../utils';
import { erc7715ProviderActions } from '@metamask-private/delegator-core-viem/experimental';
import { sepolia } from 'viem/chains';

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

const Box = styled.div`
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

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  label {
    display: inline-block;
    width: 9rem;
    margin-right: 1rem;
    font-weight: 500;
  }

  textarea,
  input {
    padding: 0.8rem;
    border: 1px solid ${({ theme }) => theme.colors.border?.default};
    border-radius: 0.3rem;
    flex-grow: 1;
  }

  div {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  }
`;

const ResponseContainer = styled.div`
  position: relative;
  max-height: 50rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background-color: ${({ theme }) => theme.colors.primary?.default};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary?.alternative};
  }
  cursor: pointer;
  font-size: 2rem;
`;

const Index = () => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected, installedSnaps, provider } = useMetaMask();
  const requestKernelSnap = useRequestSnap(kernelSnapOrigin);
  const requestPermissionSnap = useRequestSnap(gatorSnapOrigin);

  const isMetaMaskReady = isLocalSnap(kernelSnapOrigin)
    ? isFlask
    : snapsDetected;

  const metaMaskClient = useMemo(() => {
    if (!provider || !isMetaMaskReady) return undefined;

    return createClient({
      transport: custom(provider),
    }).extend(
      erc7715ProviderActions({
        kernelSnapId: kernelSnapOrigin,
        providerSnapId: gatorSnapOrigin,
      }),
    );
  }, [provider, kernelSnapOrigin, gatorSnapOrigin, isMetaMaskReady]);

  const isKernelSnapReady = Boolean(installedSnaps[kernelSnapOrigin]);
  const isGatorSnapReady = Boolean(installedSnaps[gatorSnapOrigin]);
  const mockDappSessionAccount = '0x016562aA41A8697720ce0943F003141f5dEAe006';
  const chainId = sepolia.id;
  const [initialAmount, setInitialAmount] = useState<bigint>(1n);
  const [amountPerSecond, setAmountPerSecond] = useState<bigint>(1n);
  const [maxAmount, setMaxAmount] = useState<bigint>(2000n);
  const [startTime, setStartTime] = useState<number>(
    Math.floor(Date.now() / 1000),
  );
  const [expiry, setExpiry] = useState<number>(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState<string>('Money please!');
  const [permissionType, setPermissionType] = useState<string>(
    'native-token-stream',
  );
  const [permissionResponse, setPermissionResponse] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleInitialAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setInitialAmount(BigInt(value));
  };

  const handleAmountPerSecondChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setAmountPerSecond(BigInt(value));
  };

  const handleMaxAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setMaxAmount(BigInt(value));
  };

  const handleStartTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setStartTime(Number(value));
  };

  const handleJustificationChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setJustification(event.target.value);
  };

  const handleExpiryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setExpiry(Number(value));
  };

  const handlePermissionTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPermissionType(event.target.value);
  };

  const handleGrantPermissions = async () => {
    const permissionsRequests = [
      {
        chainId,
        expiry,
        signer: {
          type: 'account',
          data: {
            address: mockDappSessionAccount,
          },
        },
        permission: {
          type: permissionType,
          data: {
            justification,
            initialAmount,
            amountPerSecond,
            startTime,
            maxAmount,
          },
        },
      },
    ];

    const response = await metaMaskClient?.grantPermissions(
      permissionsRequests,
    );
    setPermissionResponse(response);
  };

  const handleCopyToClipboard = () => {
    if (permissionResponse) {
      navigator.clipboard
        .writeText(JSON.stringify(permissionResponse, null, 2))
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  return (
    <Container>
      <Heading>
        Welcome to <Span>7715 permissions snap</Span>
      </Heading>
      <Subtitle>
        Get started by installing snaps and sending permissions requests.
      </Subtitle>

      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        )}

        {permissionResponse && (
          <Box>
            <ResponseContainer>
              <CopyButton
                onClick={handleCopyToClipboard}
                title={'Copy to clipboard'}
              >
                {isCopied ? '✅' : '📝'}
              </CopyButton>
              <pre>{JSON.stringify(permissionResponse, null, 2)}</pre>
            </ResponseContainer>
          </Box>
        )}
        {metaMaskClient && (
          <Box style={{ position: 'relative' }}>
            <StyledForm>
              <div>
                <label htmlFor="permissionType">Permission Type:</label>
                <input
                  type="text"
                  id="permissionType"
                  name="permissionType"
                  value={permissionType}
                  onChange={handlePermissionTypeChange}
                />
              </div>
              <div>
                <label htmlFor="initialAmount">Initial Amount:</label>
                <input
                  type="text"
                  id="initialAmount"
                  name="initialAmount"
                  value={initialAmount.toString()}
                  onChange={handleInitialAmountChange}
                />
              </div>
              <div>
                <label htmlFor="amountPerSecond">Amount Per Second:</label>
                <input
                  type="text"
                  id="amountPerSecond"
                  name="amountPerSecond"
                  value={amountPerSecond.toString()}
                  onChange={handleAmountPerSecondChange}
                />
              </div>
              <div>
                <label htmlFor="maxAmount">Max Amount:</label>
                <input
                  type="text"
                  id="maxAmount"
                  name="maxAmount"
                  value={maxAmount.toString()}
                  onChange={handleMaxAmountChange}
                />
              </div>
              <div>
                <label htmlFor="startTime">Start Time:</label>
                <input
                  type="number"
                  id="startTime"
                  name="startTime"
                  value={startTime}
                  onChange={handleStartTimeChange}
                />
              </div>
              <div>
                <label htmlFor="justification">Justification:</label>
                <textarea
                  id="justification"
                  name="justification"
                  rows={3}
                  value={justification}
                  onChange={handleJustificationChange}
                ></textarea>
              </div>
              <div>
                <label htmlFor="expiry">Expiry:</label>
                <input
                  type="number"
                  id="expiry"
                  name="expiry"
                  value={expiry}
                  onChange={handleExpiryChange}
                />
              </div>
            </StyledForm>
            <CustomMessageButton
              text="Grant Permission"
              onClick={handleGrantPermissions}
            />
          </Box>
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

        <Card
          content={{
            title: `${isKernelSnapReady ? 'Reconnect' : 'Connect'}(kernel)`,
            description:
              'Get started by connecting to and installing the kernel snap.',
            button: (
              <ConnectButton
                onClick={requestKernelSnap}
                disabled={!isMetaMaskReady}
                isReconnect={isKernelSnapReady}
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
                onClick={requestPermissionSnap}
                disabled={!isMetaMaskReady}
                isReconnect={isGatorSnapReady}
              />
            ),
          }}
          disabled={!isMetaMaskReady}
        />

        <Box>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Box>
      </CardContainer>
    </Container>
  );
};

export default Index;
