import { erc7715ProviderActions } from '@metamask/delegation-toolkit/experimental';
import { useCallback, useMemo, useState } from 'react';
import {
  type Hex,
  createClient,
  http,
  custom,
  createPublicClient,
  extractChain,
  Chain,
} from 'viem';
import type { UserOperationReceipt } from 'viem/account-abstraction';
import * as chains from 'viem/chains';

import {
  ConnectButton,
  InstallFlaskButton,
  CustomMessageButton,
  Card,
  Title,
} from '../components';
import {
  NativeTokenStreamForm,
  ERC20TokenStreamForm,
  NativeTokenPeriodicForm,
  ERC20TokenPeriodicForm,
} from '../components/permissions';
import {
  Container,
  Heading,
  Span,
  Subtitle,
  CardContainer,
  Box,
  ErrorMessage,
  StyledForm,
  ResponseContainer,
  CopyButton,
} from '../styles';
import { kernelSnapOrigin, gatorSnapOrigin } from '../config';
import {
  useMetaMask,
  useMetaMaskContext,
  useRequestSnap,
  useDelegateAccount,
  useBundlerClient,
} from '../hooks';
import { isLocalSnap } from '../utils';
import type {
  PermissionRequest,
  NativeTokenStreamPermissionRequest,
  ERC20TokenStreamPermissionRequest,
  NativeTokenPeriodicPermissionRequest,
  ERC20TokenPeriodicPermissionRequest,
} from '../components/permissions/types';

/* eslint-disable no-restricted-globals */
const BUNDLER_RPC_URL = process.env.GATSBY_BUNDLER_RPC_URL;

const ALL_CHAINS = Object.values(chains);

const supportedChainsString = process.env.GATSBY_SUPPORTED_CHAINS;

const DEFAULT_CHAINS = [chains.sepolia];

const supportedChains: Chain[] = supportedChainsString
  ? supportedChainsString.split(',').map((chainIdString) => {
      const chainId = parseInt(chainIdString);
      const chain = extractChain({
        chains: ALL_CHAINS,
        id: chainId as any,
      });

      return chain;
    })
  : DEFAULT_CHAINS;

const Index = () => {
  const { error: metaMaskContextError } = useMetaMaskContext();
  const [permissionResponseError, setPermissionResponseError] =
    useState<Error | null>();

  const errors = [metaMaskContextError, permissionResponseError].filter((e) =>
    Boolean(e),
  );

  if (!supportedChains[0]) {
    throw new Error('No supported chains found.');
  }

  const [selectedChain, setSelectedChain] = useState<Chain>(supportedChains[0]);

  const { isFlask, snapsDetected, installedSnaps, provider } = useMetaMask();
  const requestKernelSnap = useRequestSnap(kernelSnapOrigin);
  const requestPermissionSnap = useRequestSnap(gatorSnapOrigin);
  const { delegateAccount } = useDelegateAccount({ chain: selectedChain });
  const { bundlerClient, getFeePerGas } = useBundlerClient({
    chain: selectedChain,
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

  const chainId = selectedChain.id;
  const [permissionType, setPermissionType] = useState('native-token-stream');
  const [permissionRequest, setPermissionRequest] =
    useState<PermissionRequest | null>(null);
  const [permissionResponse, setPermissionResponse] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [to, setTo] = useState<Hex>('0x');
  const [data, setData] = useState<Hex>('0x');
  const [value, setValue] = useState<bigint>(0n);
  const [receipt, setReceipt] = useState<UserOperationReceipt | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handleChainChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLSelectElement>) => {
    const chainId = parseInt(inputValue);
    const chain = supportedChains.find((c) => c.id === chainId);
    if (chain) {
      setSelectedChain(chain);
    }
  };

  const handlePermissionTypeChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLSelectElement>) => {
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
    setPermissionResponseError(undefined);

    const feePerGas = await getFeePerGas();

    const { accountMeta, context, signerMeta } = permissionResponse[0];
    const { delegationManager } = signerMeta;

    const publicClient = createPublicClient({
      chain: selectedChain,
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

    if (!permissionRequest) {
      throw new Error('No permission request data');
    }

    const { type, expiry, isAdjustmentAllowed, ...permissionData } =
      permissionRequest;

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
        isAdjustmentAllowed,
        permission: {
          type,
          data: permissionData,
        },
      },
    ];

    setIsWorking(true);
    setPermissionResponse(null);
    setReceipt(null);
    setPermissionResponseError(null);

    try {
      const response =
        await metaMaskClient?.grantPermissions(permissionsRequests);
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

  const onFormChange = useCallback(
    (
      request:
        | ERC20TokenPeriodicPermissionRequest
        | ERC20TokenStreamPermissionRequest
        | NativeTokenPeriodicPermissionRequest
        | NativeTokenStreamPermissionRequest,
    ) => {
      setPermissionRequest(request);
    },
    [],
  );

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
        {errors.map((error, idx) => (
          <ErrorMessage key={idx}>
            <b>An error happened:</b> {error?.message}
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
              $text="Redeem Permission"
              onClick={handleRedeemPermission}
              disabled={isWorking}
            />
          </Box>
        )}
        {metaMaskClient && (
          <Box style={{ position: 'relative' }}>
            {permissionResponse && (
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
            )}
            <StyledForm>
              <div>
                <label htmlFor="chainSelector">Chain:</label>
                <select
                  id="chainSelector"
                  name="chainSelector"
                  value={selectedChain.id}
                  onChange={handleChainChange}
                  style={{
                    padding: '0.8rem',
                    border: '1px solid',
                    borderRadius: '0.3rem',
                    flexGrow: 1,
                  }}
                >
                  {supportedChains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="permissionType">Permission Type:</label>
                <select
                  id="permissionType"
                  name="permissionType"
                  value={permissionType}
                  onChange={handlePermissionTypeChange}
                  style={{
                    padding: '0.8rem',
                    border: '1px solid',
                    borderRadius: '0.3rem',
                    flexGrow: 1,
                  }}
                >
                  <option value="native-token-stream">
                    Native Token Stream
                  </option>
                  <option value="erc20-token-stream">ERC20 Token Stream</option>
                  <option value="native-token-periodic">
                    Native Token Periodic
                  </option>
                  <option value="erc20-token-periodic">
                    ERC20 Token Periodic
                  </option>
                </select>
              </div>

              {permissionType === 'native-token-stream' && (
                <NativeTokenStreamForm onChange={onFormChange} />
              )}

              {permissionType === 'erc20-token-stream' && (
                <ERC20TokenStreamForm onChange={onFormChange} />
              )}

              {permissionType === 'native-token-periodic' && (
                <NativeTokenPeriodicForm onChange={onFormChange} />
              )}

              {permissionType === 'erc20-token-periodic' && (
                <ERC20TokenPeriodicForm onChange={onFormChange} />
              )}
            </StyledForm>
            <CustomMessageButton
              $text="Grant Permission"
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
                onClick={requestPermissionSnap}
                disabled={!isMetaMaskReady}
                $isReconnect={isGatorSnapReady}
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
