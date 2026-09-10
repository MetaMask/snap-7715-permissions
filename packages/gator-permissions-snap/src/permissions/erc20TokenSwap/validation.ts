import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import {
  createAllowedMethodsTerms,
  createAllowedTargetsTerms,
} from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { validateHexInteger, validateRedeemerRule } from '../validation';
import { toFourByteSelector } from './selectors';
import type {
  Erc20TokenSwapPermission,
  Erc20TokenSwapPermissionRequest,
} from './types';
import { zErc20TokenSwapPermission } from './types';

/**
 * Validates the allow-listed targets and selectors by encoding them with the
 * same helpers used to build the caveats, so encoding errors surface before
 * the confirmation dialog is shown.
 * @param via - The allow-listed contracts and functions.
 * @param via.targets - The contracts the permission may call.
 * @param via.selectors - The function selectors or signatures the permission may call.
 * @throws {InvalidInputError} If the targets or selectors cannot be encoded.
 */
function validateVia(via: Erc20TokenSwapPermission['data']['via']): void {
  try {
    createAllowedTargetsTerms({ targets: via.targets });
  } catch (error) {
    throw new InvalidInputError(
      `Invalid via.targets: ${(error as Error).message}`,
    );
  }

  try {
    createAllowedMethodsTerms({
      selectors: via.selectors.map(toFourByteSelector),
    });
  } catch (error) {
    throw new InvalidInputError(
      `Invalid via.selectors: ${(error as Error).message}`,
    );
  }
}

/**
 * Validates that a dApp-supplied recipient, when present, is the granting account.
 * @param recipient - The recipient from the permission data, if any.
 * @param from - The granting account from the permission request, if any.
 * @throws {InvalidInputError} If the recipient is not the granting account.
 */
function validateRecipient(
  recipient: Erc20TokenSwapPermission['data']['recipient'],
  from: PermissionRequest['from'],
): void {
  if (recipient === undefined) {
    return;
  }

  if (from?.toLowerCase() !== recipient.toLowerCase()) {
    throw new InvalidInputError(
      'Invalid recipient: must be the account granting the permission',
    );
  }
}

/**
 * Validates a permission object data specific to the ERC-20 token swap permission type.
 * @param permission - The permission object to validate.
 * @param permissionRequest - The permission request the permission belongs to.
 * @returns True if the permission data is valid.
 * @throws {InvalidInputError} If any validation check fails.
 */
function validatePermissionData(
  permission: Erc20TokenSwapPermission,
  permissionRequest: PermissionRequest,
): true {
  const { spend, receive, via, recipient } = permission.data;

  validateHexInteger({
    name: 'spend.maxAmount',
    value: spend.maxAmount,
    required: true,
    allowZero: false,
  });

  validateHexInteger({
    name: 'receive.minAmount',
    value: receive.minAmount,
    required: true,
    allowZero: false,
  });

  validateVia(via);
  validateRecipient(recipient, permissionRequest.from);
  validateRedeemerRule(permissionRequest.rules);

  return true;
}

/**
 * Parses and validates a permission request for an ERC-20 token swap.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {InvalidInputError} If the permission request is invalid.
 */
export function parseAndValidate(
  permissionRequest: PermissionRequest,
): Erc20TokenSwapPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zErc20TokenSwapPermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new InvalidInputError(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult, permissionRequest);

  return {
    ...permissionRequest,
    permission: validationResult,
  };
}
