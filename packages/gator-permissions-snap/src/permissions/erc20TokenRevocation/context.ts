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

export async function applyContext({
  context,
  originalRequest,
}: {
  context: Erc20TokenRevocationContext;
  originalRequest: Erc20TokenRevocationPermissionRequest;
}): Promise<Erc20TokenRevocationPermissionRequest> {
  const {
    justification,
    expiry: { timestamp: expiry },
  } = context;

  let isExpiryRuleFound = false;

  const rules: Erc20TokenRevocationPermissionRequest['rules'] =
    originalRequest.rules?.map((rule) => {
      if (extractDescriptorName(rule.type) === 'expiry') {
        isExpiryRuleFound = true;
        return {
          ...rule,
          data: { ...rule.data, timestamp: expiry },
        };
      }
      return rule;
    }) ?? [];

  if (!isExpiryRuleFound) {
    throw new InvalidInputError(
      'Expiry rule not found. An expiry is required on all permissions.',
    );
  }

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

export async function populatePermission({
  permission,
}: {
  permission: Erc20TokenRevocationPermission;
}): Promise<PopulatedErc20TokenRevocationPermission> {
  return {
    ...permission,
  };
}

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

  if (!expiryRule) {
    throw new InvalidInputError(
      'Expiry rule not found. An expiry is required on all permissions.',
    );
  }

  const expiry = {
    timestamp: expiryRule.data.timestamp,
    isAdjustmentAllowed: expiryRule.isAdjustmentAllowed ?? true,
  };

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

export async function deriveMetadata({
  context,
}: {
  context: Erc20TokenRevocationContext;
}): Promise<Erc20TokenRevocationMetadata> {
  const { expiry } = context;

  const validationErrors: Erc20TokenRevocationMetadata['validationErrors'] = {};

  const expiryError = validateExpiry(expiry.timestamp);
  if (expiryError) {
    validationErrors.expiryError = expiryError;
  }

  return {
    validationErrors,
  };
}
