import { erc7715ProviderActions } from '@metamask/delegation-toolkit/experimental';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  type Hex,
  createClient,
  http,
  custom,
  createPublicClient,
  parseUnits,
  toHex,
} from 'viem';
import type { UserOperationReceipt } from 'viem/account-abstraction';
import { sepolia as chain } from 'viem/chains';

import {
  ConnectButton,
  InstallFlaskButton,
  CustomMessageButton,
  Card,
  Title,
} from '../components';
import { kernelSnapOrigin, gatorSnapOrigin } from '../config';
import {
  useMetaMask,
  useMetaMaskContext,
  useRequestSnap,
  useDelegateAccount,
  useBundlerClient,
} from '../hooks';
import { isLocalSnap } from '../utils';

/* eslint-disable no-restricted-globals */
const BUNDLER_RPC_URL = process.env.GATSBY_BUNDLER_RPC_URL;

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
  & pre {
    max-height: 50rem;
    overflow-y: auto;
    overflow-x: hidden;
  }
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
  const { error: metaMaskContextError } = useMetaMaskContext();
  const [permissionResponseError, setPermissionResponseError] =
    useState<Error | null>(null);

  const errors = [metaMaskContextError, permissionResponseError].filter(
    (e) => !!e,
  );
  const { isFlask, snapsDetected, installedSnaps, provider } = useMetaMask();
  const requestKernelSnap = useRequestSnap(kernelSnapOrigin);
  const requestPermissionSnap = useRequestSnap(gatorSnapOrigin);
  const { delegateAccount } = useDelegateAccount({ chain });
  const { bundlerClient, getFeePerGas } = useBundlerClient({
    chain,
    bundlerRpcUrl: BUNDLER_RPC_URL,
  });

  const isMetaMaskReady = isLocalSnap(kernelSnapOrigin)
    ? isFlask
    : snapsDetected;

  const metaMaskClient = useMemo(() => {
    if (!provider || !isMetaMaskReady) {
      return undefined;
    }

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

  const chainId = chain.id;
  const [initialAmount, setInitialAmount] = useState(
    BigInt(toHex(parseUnits('.5', 18))),
  ); // .5 ETH in wei
  const [amountPerSecond, setAmountPerSecond] = useState(
    BigInt(toHex(parseUnits('.5', 18))),
  ); // .5 ETH in wei
  const [maxAmount, setMaxAmount] = useState(
    BigInt(toHex(parseUnits('2.5', 18))),
  ); // 2.5 ETH in wei
  const [startTime, setStartTime] = useState(Math.floor(Date.now() / 1000));
  const [expiry, setExpiry] = useState(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState('Money please!');
  const [permissionType, setPermissionType] = useState('native-token-stream');
  const [permissionResponse, setPermissionResponse] = useState<any>(null);

  const [isCopied, setIsCopied] = useState(false);

  const [to, setTo] = useState<Hex>('0x');
  const [data, setData] = useState<Hex>('0x');
  const [value, setValue] = useState<bigint>(0n);
  const [receipt, setReceipt] = useState<UserOperationReceipt | null>(null);

  const [isWorking, setIsWorking] = useState(false);

  const handleInitialAmountChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setInitialAmount(BigInt(inputValue));
  };

  const handleAmountPerSecondChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setAmountPerSecond(BigInt(inputValue));
  };

  const handleMaxAmountChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setMaxAmount(BigInt(inputValue));
  };

  const handleStartTimeChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(Number(inputValue));
  };

  const handleJustificationChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJustification(inputValue);
  };

  const handleExpiryChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(Number(inputValue));
  };

  const handlePermissionTypeChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setPermissionType(inputValue);
  };

  const handleToChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setTo(inputValue as Hex);
  };

  const handleDataChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setData(inputValue as Hex);
  };

  const handleValueChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setValue(BigInt(inputValue));
  };

  const handleRedeemPermission = async () => {
    if (!delegateAccount) {
      throw new Error('Delegate account not found');
    }
    setIsWorking(true);
    setReceipt(null);
    setPermissionResponseError(null);

    const feePerGas = await getFeePerGas();

    const { accountMeta, context, signerMeta } = permissionResponse[0];
    const { delegationManager } = signerMeta;

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    try {
      const userOperationHash =
        await bundlerClient.sendUserOperationWithDelegation({
          publicClient,
          account: delegateAccount,
          calls: [
            {
              to,
              data,
              value,
              permissionsContext: context,
              delegationManager,
            },
          ],
          ...feePerGas,
          accountMetadata: accountMeta,
        });

      const operationReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
      });

      setReceipt(operationReceipt);
    } catch (error) {
      setPermissionResponseError(error as Error);
    }
    setIsWorking(false);
  };

  const handleGrantPermissions = async () => {
    if (!delegateAccount) {
      throw new Error('Delegate account not found');
    }

    const permissionsRequests = [
      {
        chainId,
        expiry,
        signer: {
          type: 'account',
          data: {
            address: delegateAccount.address,
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

    setIsWorking(true);
    setPermissionResponse(null);
    setReceipt(null);
    setPermissionResponseError(null);
    try {
      const response = await metaMaskClient?.grantPermissions(
        permissionsRequests,
      );
      setPermissionResponse(response);
    } catch (error) {
      setPermissionResponse(null);
      setPermissionResponseError(error as Error);
    }
    setIsWorking(false);
  };

  const handleCopyToClipboard = () => {
    if (permissionResponse) {
      navigator.clipboard
        .writeText(JSON.stringify(permissionResponse, null, 2))
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((clipboardError) => {
          console.error('Failed to copy: ', clipboardError);
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
      {isWorking && <p>Loading...</p>}
      <CardContainer>
        {errors.map((error) => (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        ))}

        {permissionResponse && (
          <Box>
            {receipt && (
              <div style={{ marginTop: '1rem' }}>
                <ResponseContainer>
                  <Title>User operation receipt</Title>
                  <pre>
                    {JSON.stringify(
                      receipt,
                      (_key, val) =>
                        typeof val === 'bigint' ? val.toString() : val,
                      2,
                    )}
                  </pre>
                </ResponseContainer>
              </div>
            )}
            <StyledForm>
              <Title>Redeem Permission</Title>
              <div>
                <label htmlFor="to">To:</label>
                <input
                  type="text"
                  id="to"
                  name="to"
                  value={to}
                  onChange={handleToChange}
                  placeholder="Recipient address"
                />
              </div>
              <div>
                <label htmlFor="data">Data:</label>
                <input
                  type="text"
                  id="data"
                  name="data"
                  value={data}
                  onChange={handleDataChange}
                  placeholder="Transaction calldata (hex)"
                />
              </div>
              <div>
                <label htmlFor="value">Value:</label>
                <input
                  type="text"
                  id="value"
                  name="value"
                  value={value.toString()}
                  onChange={handleValueChange}
                  placeholder="ETH value to send"
                />
              </div>
              <div>
                <label>From:</label>
                <div>{delegateAccount?.address}</div>
              </div>
            </StyledForm>
            <CustomMessageButton
              text="Redeem Permission"
              onClick={handleRedeemPermission}
              disabled={isWorking}
            />
          </Box>
        )}
        {metaMaskClient && (
          <Box style={{ position: 'relative' }}>
            <ResponseContainer>
              <Title>Permission Response</Title>
              <CopyButton
                onClick={handleCopyToClipboard}
                title={'Copy to clipboard'}
              >
                {isCopied ? '✅' : '📝'}
              </CopyButton>
              <pre>{JSON.stringify(permissionResponse, null, 2)}</pre>
            </ResponseContainer>
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
              disabled={isWorking}
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
