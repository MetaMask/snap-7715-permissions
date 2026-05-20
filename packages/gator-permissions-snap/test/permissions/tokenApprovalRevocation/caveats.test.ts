import { describe, expect, it } from '@jest/globals';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/tokenApprovalRevocation/caveats';
import type { PopulatedTokenApprovalRevocationPermission } from '../../../src/permissions/tokenApprovalRevocation/types';

// Define the contracts with enforcers
const contracts = {
  approvalRevocationEnforcer: '0x1234567890123456789012345678901234567890',
} as unknown as DelegationContracts;

describe('tokenApprovalRevocation:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('should create an approval revocation caveat with all primitives enabled', async () => {
      const permission: PopulatedTokenApprovalRevocationPermission = {
        type: 'token-approval-revocation',
        data: {
          justification: 'Permission to revoke approvals',
          erc20Approve: true,
          erc721Approve: true,
          erc721SetApprovalForAll: true,
          permit2Approve: true,
          permit2Lockdown: true,
          permit2InvalidateNonces: true,
        },
        isAdjustmentAllowed: true,
      };

      const caveats = await createPermissionCaveats({
        permission,
        contracts,
      });

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.approvalRevocationEnforcer,
          terms: '0x3f',
          args: '0x',
        },
      ]);
    });

    it('should encode only selected revocation primitives', async () => {
      const permission: PopulatedTokenApprovalRevocationPermission = {
        type: 'token-approval-revocation',
        data: {
          justification: 'Permission to revoke Permit2 approvals',
          erc20Approve: false,
          erc721Approve: false,
          erc721SetApprovalForAll: false,
          permit2Approve: true,
          permit2Lockdown: true,
          permit2InvalidateNonces: true,
        },
        isAdjustmentAllowed: true,
      };

      const caveats = await createPermissionCaveats({
        permission,
        contracts,
      });

      expect(caveats[0]?.terms).toBe('0x38');
    });
  });
});
