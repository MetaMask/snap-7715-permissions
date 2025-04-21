import { formatEther, parseEther, toHex } from 'viem';
import { AccountController } from 'src/accountController';
import { TokenPricesService } from '../../services/tokenPricesService';
import type {
  NativeTokenStreamContext,
  ValidatedNativeTokenStreamPermissionRequest,
} from './types';
import {
  convertReadableDateToTimestamp,
  convertTimestampToReadableDate,
} from '../../utils/time';

/**
 * Builds the granted permission based on user adjustments.
 */
export function contextToPermissionRequest({
  permissionRequest,
  context,
}: {
  context: NativeTokenStreamContext;
  permissionRequest: ValidatedNativeTokenStreamPermissionRequest;
}): ValidatedNativeTokenStreamPermissionRequest {
  const maxAmount = parseEther(context.permissionDetails.maxAmount);
  const amountPerSecond = parseEther(context.permissionDetails.amountPerSecond);
  const initialAmount = parseEther(context.permissionDetails.initialAmount);
  const startTime = convertReadableDateToTimestamp(
    context.permissionDetails.startTime,
  );
  const expiry = convertReadableDateToTimestamp(context.expiry);

  return {
    ...permissionRequest,
    expiry: expiry,
    permission: {
      type: 'native-token-stream',
      data: {
        maxAmount: toHex(maxAmount),
        amountPerSecond: toHex(amountPerSecond),
        initialAmount: toHex(initialAmount),
        startTime,
        justification: permissionRequest.permission.data.justification,
      },
    },
  };
}

export async function permissionRequestToContext({
  permissionRequest,
  tokenPricesService,
  accountController,
}: {
  permissionRequest: ValidatedNativeTokenStreamPermissionRequest;
  tokenPricesService: TokenPricesService;
  accountController: AccountController;
}): Promise<NativeTokenStreamContext> {
  //todo: let's figure out how to make the async stuff deferred
  // maybe put placceholders in and have functions within the orchestrator
  // that resolve them asyncronously.
  const chainId = Number(permissionRequest.chainId);

  const address = await accountController.getAccountAddress({
    chainId,
  });

  const balance = await accountController.getAccountBalance({
    chainId,
  });

  const balanceFormatted = await tokenPricesService.getCryptoToFiatConversion(
    `eip155:1/slip44:60`,
    balance,
  );

  const expiry = convertTimestampToReadableDate(permissionRequest.expiry);

  const initialAmount = formatEther(
    BigInt(permissionRequest.permission.data.initialAmount),
  );
  const maxAmount = formatEther(
    BigInt(permissionRequest.permission.data.maxAmount),
  );
  const amountPerSecond = formatEther(
    BigInt(permissionRequest.permission.data.amountPerSecond),
  );
  const startTime = convertTimestampToReadableDate(
    permissionRequest.permission.data.startTime,
  );

  return {
    expiry,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed,
    accountDetails: {
      account: {
        address,
        balance,
        valueFormattedAsCurrency: balanceFormatted,
      },
      senderDetails: {
        title: 'Stream from',
        tooltip: 'The account that the token stream comes from.',
      },
    },
    permissionDetails: {
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
    },
  };
}
