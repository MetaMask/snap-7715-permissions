import { describe, expect, it } from '@jest/globals';
import { NO_ASSET_ADDRESS } from '@metamask/7715-permissions-shared/types';

import { createConfirmationContent } from '../../../src/permissions/tokenApprovalRevocation/content';
import type {
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
} from '../../../src/permissions/tokenApprovalRevocation/types';

const mockContext: TokenApprovalRevocationContext = {
  expiry: {
    timestamp: 1714521600, // 05/01/2024
  },
  approvalRevocationMechanisms: {
    erc20Approve: true,
    erc721Approve: true,
    erc721SetApprovalForAll: true,
    permit2ApproveZero: true,
    permit2Lockdown: true,
    permit2InvalidateNonces: true,
  },
  isAdjustmentAllowed: true,
  justification: 'Permission to revoke approvals',
  accountAddressCaip10: `eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
  tokenAddressCaip19: NO_ASSET_ADDRESS,
  tokenMetadata: {
    symbol: '',
    decimals: 0,
    iconDataBase64: '',
  },
};

const mockMetadata: TokenApprovalRevocationMetadata = {
  validationErrors: {},
};

describe('tokenApprovalRevocation:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with expiry rule', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
      });

      const rendered = JSON.stringify(content);

      expect(rendered).toContain('Revocation methods');
      expect(rendered).toContain('ERC-20 approve(spender, 0)');
      expect(rendered).toContain('Permit2 invalidate nonces');
      expect(rendered).toContain('token-approval-revocation-expiry');
    });
  });
});
