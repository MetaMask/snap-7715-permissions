import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/utils';

import {
  formatPermissionWithTokenMetadata,
  groupPermissionsByFromAddress,
} from '../../../src/core/existingpermissions/permissionFormatter';
import { DEFAULT_MAX_AMOUNT } from '../../../src/permissions/erc20TokenStream/context';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';

const fromA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Hex;
const fromB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Hex;
const chainId = '0x1' as Hex;

const basePermission = (
  overrides: Partial<PermissionResponse>,
): PermissionResponse =>
  ({
    chainId,
    from: fromA,
    to: '0xcccccccccccccccccccccccccccccccccccccccc' as Hex,
    context: '0x',
    dependencies: [],
    delegationManager: '0xdddddddddddddddddddddddddddddddddddddddd' as Hex,
    permission: {
      type: 'erc20-token-stream',
      data: {},
      isAdjustmentAllowed: true,
    },
    rules: [],
    ...overrides,
  }) as PermissionResponse;

describe('groupPermissionsByFromAddress', () => {
  it('groups permissions by CAIP-10 from address', () => {
    const p1 = basePermission({
      permission: {
        type: 'erc20-token-stream',
        data: { justification: 'a' },
        isAdjustmentAllowed: true,
      },
    });
    const p2 = basePermission({
      from: fromB,
      permission: {
        type: 'native-token-stream',
        data: { justification: 'b' },
        isAdjustmentAllowed: true,
      },
    });
    const p3 = basePermission({
      permission: {
        type: 'erc20-token-periodic',
        data: { justification: 'c' },
        isAdjustmentAllowed: true,
      },
    });

    const grouped = groupPermissionsByFromAddress([p1, p2, p3]);

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped[fromA]).toHaveLength(2);
    expect(grouped[fromB]).toHaveLength(1);
  });

  it('skips entries without from or chainId', () => {
    const valid = basePermission({});
    const missingFrom = basePermission({ from: undefined as unknown as Hex });
    const missingChain = basePermission({
      chainId: undefined as unknown as Hex,
    });

    const grouped = groupPermissionsByFromAddress([
      valid,
      missingFrom,
      missingChain,
    ]);

    expect(Object.keys(grouped)).toStrictEqual([fromA]);
  });
});

describe('formatPermissionWithTokenMetadata', () => {
  let mockTokenMetadataService: jest.Mocked<
    Pick<TokenMetadataService, 'getTokenMetadata'>
  >;

  beforeEach(() => {
    jest.spyOn(logger, 'debug').mockImplementation(() => undefined);
    mockTokenMetadataService = {
      getTokenMetadata: jest
        .fn()
        .mockResolvedValue({ decimals: 18, symbol: 'ETH' }),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the permission unchanged when data has no token amount fields', async () => {
    const permission = basePermission({
      permission: {
        type: 'erc20-token-revocation',
        data: { justification: 'x' },
        isAdjustmentAllowed: true,
      },
    });

    const result = await formatPermissionWithTokenMetadata(
      permission,
      mockTokenMetadataService as unknown as TokenMetadataService,
    );

    expect(result).toStrictEqual(permission);
    expect(mockTokenMetadataService.getTokenMetadata).not.toHaveBeenCalled();
  });

  it('formats maxAmount using token metadata', async () => {
    const permission = basePermission({
      permission: {
        type: 'erc20-token-stream',
        data: {
          maxAmount: '0x38d7ea4c68000',
          tokenAddress: '0x0000000000000000000000000000000000000001',
          justification: 'j',
        },
        isAdjustmentAllowed: true,
      },
    });

    const result = await formatPermissionWithTokenMetadata(
      permission,
      mockTokenMetadataService as unknown as TokenMetadataService,
    );

    expect(mockTokenMetadataService.getTokenMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 1,
        account: fromA,
        assetAddress: '0x0000000000000000000000000000000000000001',
      }),
    );
    expect(result.permission.data).toMatchObject({
      maxAmount: expect.stringContaining('ETH') as unknown,
    });
  });

  it('maps DEFAULT_MAX_AMOUNT maxAmount to unlimited label', async () => {
    const permission = basePermission({
      permission: {
        type: 'erc20-token-stream',
        data: {
          maxAmount: DEFAULT_MAX_AMOUNT,
          tokenAddress: '0x0000000000000000000000000000000000000001',
          justification: 'j',
        },
        isAdjustmentAllowed: true,
      },
    });

    const result = await formatPermissionWithTokenMetadata(
      permission,
      mockTokenMetadataService as unknown as TokenMetadataService,
    );

    expect(result.permission.data).toMatchObject({
      maxAmount: expect.any(String) as unknown,
    });
    const { maxAmount } = result.permission.data as { maxAmount: string };
    expect(maxAmount.toLowerCase().startsWith('0x')).toBe(false);
  });

  it('returns original permission when metadata fetch fails', async () => {
    mockTokenMetadataService.getTokenMetadata.mockRejectedValue(
      new Error('rpc down'),
    );

    const permission = basePermission({
      permission: {
        type: 'erc20-token-stream',
        data: {
          maxAmount: '0x1',
          tokenAddress: '0x0000000000000000000000000000000000000001',
          justification: 'j',
        },
        isAdjustmentAllowed: true,
      },
    });

    const result = await formatPermissionWithTokenMetadata(
      permission,
      mockTokenMetadataService as unknown as TokenMetadataService,
    );

    expect(result).toStrictEqual(permission);
    expect(logger.debug).toHaveBeenCalled();
  });
});
