import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  parseCaipAccountId,
  toCaipAssetType,
  toCaipAccountId,
} from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamMetadata,
  PopulatedNativeTokenStreamPermission,
  NativeTokenStreamPermission,
} from './types';
import { TimePeriod } from '../../core/types';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import { t } from '../../utils/i18n';
import { TIME_PERIOD_TO_SECONDS } from '../../utils/time';
import { parseUnits, formatUnits, formatUnitsFromHex } from '../../utils/value';
import {
  validateAndParseAmount,
  validateStartTime,
  validateExpiry,
  validateMaxAmountVsInitialAmount,
  calculateAmountPerSecond,
  validateStartTimeVsExpiry,
} from '../contextValidation';
import { applyExpiryRule } from '../rules';

const DEFAULT_MAX_AMOUNT =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const DEFAULT_INITIAL_AMOUNT = '0x0';
const ASSET_NAMESPACE = 'slip44';
const CHAIN_NAMESPACE = 'eip155';
const ASSET_REFERENCE = '60';

/**
 * Construct an amended NativeTokenStreamPermissionRequest, based on the specified request,
 * with the changes made by the specified context.
 * @param options0 - The options object containing the context and original request.
 * @param options0.context - The native token stream context containing the updated permission details.
 * @param options0.originalRequest - The original permission request to be amended.
 * @returns A new permission request with the context changes applied.
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: NativeTokenStreamContext;
  originalRequest: NativeTokenStreamPermissionRequest;
}): Promise<NativeTokenStreamPermissionRequest> {
  const {
    permissionDetails,
    tokenMetadata: { decimals },
  } = context;

  const { rules } = applyExpiryRule(context, originalRequest);

  const permissionData = {
    maxAmount: permissionDetails.maxAmount
      ? bigIntToHex(
          parseUnits({ formatted: permissionDetails.maxAmount, decimals }),
        )
      : undefined,
    initialAmount: permissionDetails.initialAmount
      ? bigIntToHex(
          parseUnits({ formatted: permissionDetails.initialAmount, decimals }),
        )
      : undefined,
    amountPerSecond: bigIntToHex(
      parseUnits({ formatted: permissionDetails.amountPerPeriod, decimals }) /
        TIME_PERIOD_TO_SECONDS[permissionDetails.timePeriod],
    ),
    startTime: permissionDetails.startTime,
    justification: originalRequest.permission.data.justification,
  };

  const { address } = parseCaipAccountId(context.accountAddressCaip10);

  return {
    ...originalRequest,
    from: address as Hex,
    permission: {
      type: 'native-token-stream',
      data: permissionData,
      isAdjustmentAllowed: originalRequest.permission.isAdjustmentAllowed,
    },
    rules,
  };
}

/**
 * Populate a native token stream permission by filling in default values for optional fields.
 * @param options0 - The options object containing the permission to populate.
 * @param options0.permission - The native token stream permission to populate with default values.
 * @returns A populated native token stream permission with all required fields populated.
 */
export async function populatePermission({
  permission,
}: {
  permission: NativeTokenStreamPermission;
}): Promise<PopulatedNativeTokenStreamPermission> {
  return {
    ...permission,
    data: {
      ...permission.data,
      initialAmount: permission.data.initialAmount ?? DEFAULT_INITIAL_AMOUNT,
      maxAmount: permission.data.maxAmount ?? DEFAULT_MAX_AMOUNT,
      startTime: permission.data.startTime ?? Math.floor(Date.now() / 1000),
    },
  };
}

/**
 * Converts a permission request into a context object that can be used to render the UI
 * and manage the permission state.
 * @param options0 - The options object containing the request and required services.
 * @param options0.permissionRequest - The native token stream permission request to convert.
 * @param options0.tokenMetadataService - Service for fetching token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext({
  permissionRequest,
  tokenMetadataService,
}: {
  permissionRequest: NativeTokenStreamPermissionRequest;
  tokenMetadataService: TokenMetadataService;
}): Promise<NativeTokenStreamContext> {
  const chainId = Number(permissionRequest.chainId);

  const {
    from,
    permission: { data, isAdjustmentAllowed },
  } = permissionRequest;

  if (!from) {
    throw new InvalidInputError(
      'PermissionRequest.address was not found. This should be resolved within the buildContextHandler function in PermissionHandler.',
    );
  }

  const { decimals, symbol, iconUrl } =
    await tokenMetadataService.getTokenBalanceAndMetadata({
      chainId,
      account: from,
    });

  const iconDataResponse =
    await tokenMetadataService.fetchIconDataAsBase64(iconUrl);

  const iconDataBase64 = iconDataResponse.success
    ? iconDataResponse.imageDataBase64
    : null;

  const expiryRule = permissionRequest.rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'expiry',
  );

  const expiry = expiryRule
    ? {
        timestamp: expiryRule.data.timestamp,
      }
    : undefined;

  const initialAmount = formatUnitsFromHex({
    value: data.initialAmount,
    allowNull: true,
    decimals,
  });

  const timePeriod = TimePeriod.MONTHLY;

  const maxAmount = formatUnitsFromHex({
    value: data.maxAmount,
    allowNull: true,
    decimals,
  });

  const amountPerSecond = BigInt(data.amountPerSecond);

  // It may seem strange to convert the amount per second to amount per period, format, and then convert back to amount per second.
  // The user is inputting amount per period, and we derive amount per second, so it makes sense for the context to contain the amount per period.
  const amountPerPeriod = formatUnits({
    value: amountPerSecond * TIME_PERIOD_TO_SECONDS[timePeriod],
    decimals,
  });

  const startTime = data.startTime ?? Math.floor(Date.now() / 1000);

  const tokenAddressCaip19 = toCaipAssetType(
    CHAIN_NAMESPACE,
    chainId.toString(),
    ASSET_NAMESPACE,
    ASSET_REFERENCE,
  );

  const accountAddressCaip10 = toCaipAccountId(
    CHAIN_NAMESPACE,
    chainId.toString(),
    from,
  );

  return {
    expiry,
    justification: data.justification,
    isAdjustmentAllowed,
    accountAddressCaip10,
    tokenAddressCaip19,
    tokenMetadata: {
      symbol,
      decimals,
      iconDataBase64,
    },
    permissionDetails: {
      initialAmount,
      maxAmount,
      timePeriod,
      startTime,
      amountPerPeriod,
    },
  };
}

/**
 * Creates metadata for the native token stream context, including validation of amounts and timestamps.
 * @param options0 - The options object containing the context to create metadata for.
 * @param options0.context - The native token stream context to validate and create metadata from.
 * @returns Metadata object containing derived values and validation errors.
 */
export async function deriveMetadata({
  context,
}: {
  context: NativeTokenStreamContext;
}): Promise<NativeTokenStreamMetadata> {
  const {
    permissionDetails,
    expiry,
    tokenMetadata: { decimals },
  } = context;

  const validationErrors: NativeTokenStreamMetadata['validationErrors'] = {};

  // Validate max amount
  const maxAmountResult = validateAndParseAmount(
    permissionDetails.maxAmount,
    decimals,
    'max amount',
    false, // Disallow zero for max amount
  );
  if (maxAmountResult.error) {
    validationErrors.maxAmountError = maxAmountResult.error;
  }

  // Validate initial amount
  const initialAmountResult = validateAndParseAmount(
    permissionDetails.initialAmount,
    decimals,
    'initial amount',
    true, // Allow zero for initial amount
  );
  if (initialAmountResult.error) {
    validationErrors.initialAmountError = initialAmountResult.error;
  }

  // Validate amount per period
  const amountPerPeriodResult = validateAndParseAmount(
    permissionDetails.amountPerPeriod,
    decimals,
    'amount per period',
  );
  let amountPerSecond = t('unknownStreamRate');
  if (amountPerPeriodResult.error) {
    validationErrors.amountPerPeriodError = amountPerPeriodResult.error;
  } else if (amountPerPeriodResult.amount) {
    amountPerSecond = calculateAmountPerSecond(
      amountPerPeriodResult.amount,
      permissionDetails.timePeriod,
      decimals,
    );
  }

  // Validate start time
  const startTimeError = validateStartTime(permissionDetails.startTime);
  if (startTimeError) {
    validationErrors.startTimeError = startTimeError;
  }

  // Validate expiry if present
  if (expiry) {
    const expiryError = validateExpiry(expiry.timestamp);
    if (expiryError) {
      validationErrors.expiryError = expiryError;
    }
  }

  // Validate start time vs expiry (only if individual validations passed and expiry present)
  if (
    expiry &&
    !validationErrors.startTimeError &&
    !validationErrors.expiryError
  ) {
    const startTimeVsExpiryError = validateStartTimeVsExpiry(
      permissionDetails.startTime,
      expiry.timestamp,
    );
    if (startTimeVsExpiryError) {
      validationErrors.startTimeError = startTimeVsExpiryError;
    }
  }

  // Validate max amount vs initial amount
  const maxVsInitialError = validateMaxAmountVsInitialAmount(
    maxAmountResult.amount,
    initialAmountResult.amount,
  );
  if (maxVsInitialError) {
    validationErrors.maxAmountError = maxVsInitialError;
  }

  return {
    amountPerSecond,
    validationErrors,
  };
}
