import type {
  CaveatStruct,
  DelegationStruct,
} from '@metamask-private/delegator-core-viem';
import { getAddress } from 'viem';

import type { AccountControllerInterface } from '../src/accountController';
import { createPermissionsContextBuilder } from '../src/orchestrators/permissionsContextBuilder';

describe('Permissions Context Builder', () => {
  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const sessionAccount = getAddress(
    '0x016562aA41A8697720ce0943F003141f5dEAe006',
  );
  const mockAccountController = {
    getAccountAddress: jest.fn(),
    signDelegation: jest.fn(),
    getAccountMetadata: jest.fn(),
    getAccountBalance: jest.fn(),
    getDelegationManager: jest.fn(),
    getCaveatBuilder: jest.fn(),
  } as jest.Mocked<AccountControllerInterface>;
  describe('buildPermissionsContext', () => {
    it('should build a 7715 permissions context', async () => {
      const permissionsContextBuilder = createPermissionsContextBuilder(
        mockAccountController,
      );
      const mockCaveats: CaveatStruct[] = [
        {
          args: '0x',
          enforcer: '0xcfD1BD7922D123Caa194597BF7A0073899a284Df',
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
      ];

      mockAccountController.signDelegation.mockImplementation(
        async (options) => {
          expect(options.delegation.caveats).toStrictEqual(mockCaveats);
          return Promise.resolve({
            ...options.delegation,
            caveats: mockCaveats,
            signature: '0x_signature',
          } as DelegationStruct);
        },
      );

      const permissionsContext =
        await permissionsContextBuilder.buildPermissionsContext({
          address,
          sessionAccount,
          caveats: mockCaveats,
          chainId: 11155111,
        });

      expect(permissionsContext).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000016562aa41a8697720ce0943f003141f5deae006000000000000000000000000016562aa41a8697720ce0943f003141f5deae008ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000cfd1bd7922d123caa194597bf7a0073899a284df000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005_signature000000000000000000000000000000000000000000000000000000',
      );
    });
  });
});
