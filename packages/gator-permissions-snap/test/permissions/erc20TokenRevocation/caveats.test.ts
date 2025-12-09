import { describe, expect, it } from '@jest/globals';
import {
  createAllowedCalldataTerms,
  createValueLteTerms,
} from '@metamask/delegation-core';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/erc20TokenRevocation/caveats';
import type { PopulatedErc20TokenRevocationPermission } from '../../../src/permissions/erc20TokenRevocation/types';

// Define the contracts with enforcers
const contracts = {
  allowedCalldataEnforcer: '0x1234567890123456789012345678901234567890',
  valueLteEnforcer: '0x1234567890123456789012345678901234567891',
} as unknown as DelegationContracts;

describe('erc20TokenRevocation:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('should create allowedCalldata and valueLte caveats for approval revocation', async () => {
      const permission: PopulatedErc20TokenRevocationPermission = {
        type: 'erc20-token-revocation',
        data: {
          justification: 'Permission to revoke approvals',
        },
        isAdjustmentAllowed: true,
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      // keccak("approve(address,uint256)")
      const approveFunctionSelector = '0x095ea7b3';
      const zeroAsUInt256 =
        '0x0000000000000000000000000000000000000000000000000000000000000000';

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.allowedCalldataEnforcer,
          terms: createAllowedCalldataTerms({
            startIndex: 0,
            value: approveFunctionSelector,
          }),
          args: '0x',
        },
        {
          enforcer: contracts.allowedCalldataEnforcer,
          terms: createAllowedCalldataTerms({
            startIndex: 36,
            value: zeroAsUInt256,
          }),
          args: '0x',
        },
        {
          enforcer: contracts.valueLteEnforcer,
          terms: createValueLteTerms({
            maxValue: 0n,
          }),
          args: '0x',
        },
      ]);
    });
  });
});
