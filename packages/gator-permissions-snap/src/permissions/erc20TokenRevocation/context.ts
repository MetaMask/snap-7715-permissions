import { NO_ASSET_ADDRESS } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';
import { parseCaipAccountId, toCaipAccountId, type Hex } from '@metamask/utils';

import type { TokenMetadataService } from '../../services/tokenMetadataService';
import { validateExpiry } from '../contextValidation';
import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
  Erc20TokenRevocationPermission,
  Erc20TokenRevocationPermissionRequest,
  PopulatedErc20TokenRevocationPermission,
} from './types';
import { applyExpiryRule } from '../rules';

const CHAIN_NAMESPACE = 'eip155';
// presently BaseContext assumes that a token is associated with a permission.
// This constant defines placeholder data that is not used for revocation
// permissions.
const EXTRANEOUS_CONTEXT_DATA = {
  tokenAddressCaip19: NO_ASSET_ADDRESS,
  tokenMetadata: {
    symbol: '',
    decimals: 0,
    iconDataBase64: '',
  },
} as const;

/**
 * Applies the context to the original request.
 * @param args - The options object containing the context and original request.
 * @param args.context - The context containing the permission details.
 * @param args.originalRequest - The original request containing the permission details.
 * @returns The modified request with the context applied.
 */
export async function applyContext({
  context,
  originalRequest,
}: {
  context: Erc20TokenRevocationContext;
  originalRequest: Erc20TokenRevocationPermissionRequest;
}): Promise<Erc20TokenRevocationPermissionRequest> {
  const { justification } = context;

  const { rules } = applyExpiryRule(context, originalRequest);

  const { address } = parseCaipAccountId(context.accountAddressCaip10);

  return {
    ...originalRequest,
    address: address as Hex,
    permission: {
      type: 'erc20-token-revocation',
      data: {
        justification,
      },
      isAdjustmentAllowed: originalRequest.permission.isAdjustmentAllowed,
    },
    rules,
  };
}

/**
 * Populates the permission with the necessary data.
 * @param args - The options object containing the permission.
 * @param args.permission - The permission to populate.
 * @returns The populated permission.
 */
export async function populatePermission({
  permission,
}: {
  permission: Erc20TokenRevocationPermission;
}): Promise<PopulatedErc20TokenRevocationPermission> {
  return {
    ...permission,
  };
}

/**
 * Converts a permission request into a context object that can be used to render the UI
 * and manage the permission state.
 * @param args - The options object containing the request and required services.
 * @param args.permissionRequest - The Erc20 token revocation permission request to convert.
 * @param args.tokenMetadataService - Service for fetching token metadata.
 * @returns A context object containing the formatted permission details and account information.
 */
export async function buildContext({
  permissionRequest,
}: {
  permissionRequest: Erc20TokenRevocationPermissionRequest;
  tokenMetadataService: TokenMetadataService;
}): Promise<Erc20TokenRevocationContext> {
  const chainId = Number(permissionRequest.chainId);

  const {
    address,
    permission: { data, isAdjustmentAllowed },
  } = permissionRequest;

  if (!address) {
    throw new InvalidInputError(
      'PermissionRequest.address was not found. This should be resolved within the buildContextHandler function in PermissionHandler.',
    );
  }

  const expiryRule = permissionRequest.rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'expiry',
  );

  const expiry = expiryRule
    ? {
        timestamp: expiryRule.data.timestamp,
        isAdjustmentAllowed: expiryRule.isAdjustmentAllowed ?? true,
      }
    : null;

  const accountAddressCaip10 = toCaipAccountId(
    CHAIN_NAMESPACE,
    chainId.toString(),
    address,
  );

  return {
    expiry,
    justification: data.justification,
    isAdjustmentAllowed,
    accountAddressCaip10,
    // unfortunately there is a presumption that every permission has a related token.
    ...EXTRANEOUS_CONTEXT_DATA,
  };
}

/**
 * Derives the metadata for the permission.
 * @param args - The options object containing the context.
 * @param args.context - The context containing the permission details.
 * @returns The metadata for the permission.
 */
export async function deriveMetadata({
  context,
}: {
  context: Erc20TokenRevocationContext;
}): Promise<Erc20TokenRevocationMetadata> {
  const { expiry } = context;

  const validationErrors: Erc20TokenRevocationMetadata['validationErrors'] = {};

  if (expiry) {
    const expiryError = validateExpiry(expiry.timestamp);
    if (expiryError) {
      validationErrors.expiryError = expiryError;
    }
  }

  return {
    validationErrors,
  };
}
