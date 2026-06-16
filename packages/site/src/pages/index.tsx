import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions';
import type {
  Erc7715Client,
  RequestExecutionPermissionsParameters,
} from '@metamask/smart-accounts-kit/actions';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { createClient, http, custom, createPublicClient } from 'viem';
import type { Chain, Hex } from 'viem';
import type { UserOperationReceipt } from 'viem/account-abstraction';

import { ErrorAlert, SnapConnectionCards } from '../components';
import {
  PermissionQueriesPanel,
  PermissionRequestPanel,
  PermissionResponsePanel,
  RedeemPermissionPanel,
} from '../components/permissions';
import type { RedemptionCall } from '../components/permissions';
import type { PermissionRequest } from '../components/permissions/types';
import {
  defaultSupportedChain,
  gatorSnapOrigin,
  kernelSnapOrigin,
  supportedChains,
} from '../config';
import {
  useMetaMask,
  useMetaMaskContext,
  useRequestSnap,
  useDelegateAccount,
  useBundlerClient,
  useCopyToClipboard,
} from '../hooks';
import {
  Container,
  Heading,
  Span,
  Subtitle,
  CardContainer,
  Box,
} from '../styles';
import {
  decodePermissionContext,
  formatDelegatedExecutionError,
  stringifyWithBigInt,
} from '../utils';

const BUNDLER_RPC_URL = import.meta.env.VITE_BUNDLER_RPC_URL;

const Index = () => {
  const { error: metaMaskContextError } = useMetaMaskContext();
  const [permissionResponseError, setPermissionResponseError] =
    useState<Error | null>();

  const errors = [metaMaskContextError, permissionResponseError].filter((e) =>
    Boolean(e),
  );

  const [selectedChain, setSelectedChain] = useState<Chain>(
    defaultSupportedChain,
  );

  const { snapsDetected, installedSnaps, provider } = useMetaMask();
  const requestKernelSnap = useRequestSnap(kernelSnapOrigin);
  const requestPermissionSnap = useRequestSnap(gatorSnapOrigin);

  const { delegateAccount } = useDelegateAccount({ chain: selectedChain });
  const { bundlerClient, getFeePerGas } = useBundlerClient({
    chain: selectedChain,
    bundlerRpcUrl: BUNDLER_RPC_URL,
  });

  const isMetaMaskReady = snapsDetected;

  const metaMaskClient = useMemo<Erc7715Client | undefined>(() => {
    if (!provider || !isMetaMaskReady) {
      return undefined;
    }

    const baseMetaMaskClient = createClient({
      transport: custom(provider),
    });

    return baseMetaMaskClient.extend(erc7715ProviderActions());
  }, [provider, kernelSnapOrigin, gatorSnapOrigin, isMetaMaskReady]);

  const isKernelSnapReady = Boolean(installedSnaps[kernelSnapOrigin]);
  const isGatorSnapReady = Boolean(installedSnaps[gatorSnapOrigin]);

  const chainId = selectedChain.id;
  const [permissionType, setPermissionType] = useState<
    PermissionRequest['type']
  >('native-token-stream');
  const [permissionRequest, setPermissionRequest] =
    useState<PermissionRequest | null>(null);
  const [permissionResponse, setPermissionResponse] = useState<any>(null);
  const permissionResponseClipboard = useCopyToClipboard();
  const decodedPermissionContextClipboard = useCopyToClipboard();
  const [supportedPermissionsResponse, setSupportedPermissionsResponse] =
    useState<any>(null);
  const [grantedPermissionsResponse, setGrantedPermissionsResponse] =
    useState<any>(null);
  const supportedPermissionsClipboard = useCopyToClipboard();
  const grantedPermissionsClipboard = useCopyToClipboard();
  const [to, setTo] = useState<Hex>('0x');
  const [data, setData] = useState<Hex>('0x');
  const [value, setValue] = useState<bigint>(0n);
  const [receipt, setReceipt] = useState<UserOperationReceipt | null>(null);
  const [pendingPermissionRequests, setPendingPermissionRequests] = useState<
    Set<string>
  >(new Set());

  const selectedPermissionResponse = Array.isArray(permissionResponse)
    ? permissionResponse[0]
    : undefined;

  const decodedPermissionContext = useMemo(
    () => decodePermissionContext(permissionResponse, selectedChain.id),
    [permissionResponse, selectedChain.id],
  );

  const handleChainChange = ({
    target: { value: inputValue },
  }: ChangeEvent<HTMLSelectElement>) => {
    const chainId = parseInt(inputValue);
    const chain = supportedChains.find((ch) => ch.id === chainId);
    if (chain) {
      setSelectedChain(chain);
    }
  };

  const handlePermissionTypeChange = ({
    target: { value: inputValue },
  }: ChangeEvent<HTMLSelectElement>) => {
    setPermissionType(inputValue as PermissionRequest['type']);
  };

  const handleRedemptionCallChange = useCallback(
    ({ data: nextData, to: nextTo, value: nextValue }: RedemptionCall) => {
      setTo(nextTo);
      setData(nextData);
      setValue(nextValue);
    },
    [],
  );

  const handleRedeemPermission = async () => {
    if (!delegateAccount) {
      throw new Error('Delegate account not found');
    }

    // Generate a unique identifier for this redemption request
    const requestId = `redeem-${Date.now()}-${Math.random()}`;

    // Add this request to pending requests
    setPendingPermissionRequests((prev) => new Set(prev).add(requestId));

    setReceipt(null);
    setPermissionResponseError(null);

    const feePerGas = await getFeePerGas();

    const { context, delegationManager } = permissionResponse[0];

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
              permissionContext: context,
              delegationManager,
            },
          ],
          ...feePerGas,
        });

      const operationReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
      });

      setReceipt(operationReceipt);
    } catch (error) {
      setPermissionResponseError(formatDelegatedExecutionError(error));
    } finally {
      // Remove this request from pending requests
      setPendingPermissionRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleGrantPermissions = async () => {
    if (!delegateAccount) {
      throw new Error('Delegate account not found');
    }

    if (!permissionRequest) {
      throw new Error('No permission request data');
    }

    const {
      type,
      expiry,
      isAdjustmentAllowed,
      redeemerAddresses,
      payeeAddresses,
      ...permissionData
    } = permissionRequest;

    if (!metaMaskClient) {
      throw new Error('Wallet client not ready');
    }

    const permissionRequestParam: RequestExecutionPermissionsParameters[0] = {
      chainId,
      to: delegateAccount.address,
      expiry,
      redeemer: (redeemerAddresses?.length ?? 0) > 0 ? redeemerAddresses : null,
      payee: (payeeAddresses?.length ?? 0) > 0 ? payeeAddresses : null,
      permission: {
        type,
        isAdjustmentAllowed,
        data: permissionData,
      } as RequestExecutionPermissionsParameters[0]['permission'],
    };

    // Generate a unique identifier for this permission request
    const requestId = `${type}-${Date.now()}-${Math.random()}`;

    // Add this request to pending requests
    setPendingPermissionRequests((prev) => new Set(prev).add(requestId));

    setPermissionResponse(null);
    setReceipt(null);
    setPermissionResponseError(null);

    try {
      const response = await metaMaskClient.requestExecutionPermissions([
        permissionRequestParam,
      ]);
      setPermissionResponse(response);
    } catch (error) {
      setPermissionResponse(null);
      setPermissionResponseError(error as Error);
    } finally {
      // Remove this request from pending requests
      setPendingPermissionRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleCopyToClipboard = () => {
    if (permissionResponse) {
      permissionResponseClipboard.copyToClipboard(
        stringifyWithBigInt(permissionResponse),
      );
    }
  };

  const handleCopyDecodedToClipboard = () => {
    if (decodedPermissionContext) {
      decodedPermissionContextClipboard.copyToClipboard(
        stringifyWithBigInt(decodedPermissionContext),
      );
    }
  };

  const handleGetSupportedPermissions = async () => {
    setPermissionResponseError(null);
    try {
      const response = await metaMaskClient?.getSupportedExecutionPermissions();
      setSupportedPermissionsResponse(response);
    } catch (error) {
      setPermissionResponseError(error as Error);
    }
  };

  const handleGetGrantedPermissions = async () => {
    setPermissionResponseError(null);
    try {
      const response = await metaMaskClient?.getGrantedExecutionPermissions();
      setGrantedPermissionsResponse(response);
    } catch (error) {
      setPermissionResponseError(error as Error);
    }
  };

  const handleCopySupportedToClipboard = () => {
    if (supportedPermissionsResponse) {
      supportedPermissionsClipboard.copyToClipboard(
        stringifyWithBigInt(supportedPermissionsResponse),
      );
    }
  };

  const handleCopyGrantedToClipboard = () => {
    if (grantedPermissionsResponse) {
      grantedPermissionsClipboard.copyToClipboard(
        stringifyWithBigInt(grantedPermissionsResponse),
      );
    }
  };

  const onFormChange = useCallback((request: PermissionRequest) => {
    setPermissionRequest(request);
  }, []);

  return (
    <Container>
      <Heading>
        Welcome to <Span>7715 permissions snap</Span>
      </Heading>
      <Subtitle>
        Get started by installing snaps and sending permissions requests.
      </Subtitle>
      <CardContainer>
        {errors.map((error, idx) => (
          <ErrorAlert key={idx} error={error} />
        ))}

        {selectedPermissionResponse && (
          <RedeemPermissionPanel
            delegateAddress={delegateAccount?.address}
            isPending={pendingPermissionRequests.size > 0}
            onRedeemPermission={handleRedeemPermission}
            onRedemptionCallChange={handleRedemptionCallChange}
            permissionResponse={selectedPermissionResponse}
            receipt={receipt}
            to={to}
            value={value}
          />
        )}
        {metaMaskClient && permissionResponse && (
          <PermissionResponsePanel
            decodedIsCopied={decodedPermissionContextClipboard.isCopied}
            decodedPermissionContext={decodedPermissionContext}
            isCopied={permissionResponseClipboard.isCopied}
            onCopyDecodedPermissionContext={handleCopyDecodedToClipboard}
            onCopyPermissionResponse={handleCopyToClipboard}
            permissionResponse={permissionResponse}
          />
        )}
        {metaMaskClient && (
          <PermissionRequestPanel
            onChainChange={handleChainChange}
            onFormChange={onFormChange}
            onGrantPermissions={handleGrantPermissions}
            onPermissionTypeChange={handlePermissionTypeChange}
            permissionType={permissionType}
            selectedChain={selectedChain}
            supportedChains={supportedChains}
          />
        )}

        {metaMaskClient && (
          <PermissionQueriesPanel
            grantedIsCopied={grantedPermissionsClipboard.isCopied}
            grantedPermissionsResponse={grantedPermissionsResponse}
            onCopyGrantedPermissions={handleCopyGrantedToClipboard}
            onCopySupportedPermissions={handleCopySupportedToClipboard}
            onGetGrantedPermissions={handleGetGrantedPermissions}
            onGetSupportedPermissions={handleGetSupportedPermissions}
            supportedIsCopied={supportedPermissionsClipboard.isCopied}
            supportedPermissionsResponse={supportedPermissionsResponse}
          />
        )}

        <SnapConnectionCards
          isGatorSnapReady={isGatorSnapReady}
          isKernelSnapReady={isKernelSnapReady}
          isMetaMaskReady={isMetaMaskReady}
          onRequestKernelSnap={requestKernelSnap}
          onRequestPermissionSnap={requestPermissionSnap}
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
