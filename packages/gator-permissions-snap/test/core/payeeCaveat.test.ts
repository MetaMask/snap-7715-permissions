import type { Caveat, Hex } from '@metamask/delegation-core';
import {
  createAllowedCalldataTerms,
  createAllowedTargetsTerms,
  createLogicalOrWrapperTerms,
} from '@metamask/delegation-core';

import { appendPayeeCaveatIfPresent } from '../../src/core/payeeCaveat';

const MOCK_CONTRACTS = {
  delegationManager: '0x0000000000000000000000000000000000000001' as Hex,
  eip7702StatelessDeleGatorImpl:
    '0x0000000000000000000000000000000000000002' as Hex,
  limitedCallsEnforcer: '0x0000000000000000000000000000000000000003' as Hex,
  erc20StreamingEnforcer: '0x0000000000000000000000000000000000000004' as Hex,
  erc20PeriodTransferEnforcer:
    '0x0000000000000000000000000000000000000005' as Hex,
  nativeTokenStreamingEnforcer:
    '0x0000000000000000000000000000000000000006' as Hex,
  nativeTokenPeriodTransferEnforcer:
    '0x0000000000000000000000000000000000000007' as Hex,
  valueLteEnforcer: '0x0000000000000000000000000000000000000008' as Hex,
  timestampEnforcer: '0x0000000000000000000000000000000000000009' as Hex,
  exactCalldataEnforcer: '0x000000000000000000000000000000000000000a' as Hex,
  nonceEnforcer: '0x000000000000000000000000000000000000000b' as Hex,
  allowedCalldataEnforcer: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Hex,
  redeemerEnforcer: '0x000000000000000000000000000000000000000c' as Hex,
  allowedTargetsEnforcer: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Hex,
  logicalOrWrapperEnforcer: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Hex,
};

const PAYEE_ADDRESS_1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Hex;
const PAYEE_ADDRESS_2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as Hex;

/**
 * Pads an Ethereum address to 32 bytes (left-padded with zeros).
 * @param address - The address to pad.
 * @returns The 32-byte padded address.
 */
function padTo32Bytes(address: Hex): Hex {
  return `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;
}

describe('appendPayeeCaveatIfPresent', () => {
  it('does nothing when no payee rule exists', () => {
    const caveats: Caveat[] = [];
    appendPayeeCaveatIfPresent({
      rules: [{ type: 'expiry', data: { timestamp: 999 } }],
      contracts: MOCK_CONTRACTS,
      caveats,
      permissionType: 'erc20-token-stream',
    });

    expect(caveats).toHaveLength(0);
  });

  it('does nothing when rules is undefined', () => {
    const caveats: Caveat[] = [];
    appendPayeeCaveatIfPresent({
      rules: undefined as any,
      contracts: MOCK_CONTRACTS,
      caveats,
      permissionType: 'erc20-token-stream',
    });

    expect(caveats).toHaveLength(0);
  });

  it('does nothing when payee addresses array is empty', () => {
    const caveats: Caveat[] = [];
    appendPayeeCaveatIfPresent({
      rules: [{ type: 'payee', data: { addresses: [] } }],
      contracts: MOCK_CONTRACTS,
      caveats,
      permissionType: 'erc20-token-stream',
    });

    expect(caveats).toHaveLength(0);
  });

  it('does nothing for unsupported permission type', () => {
    const caveats: Caveat[] = [];
    appendPayeeCaveatIfPresent({
      rules: [{ type: 'payee', data: { addresses: [PAYEE_ADDRESS_1] } }],
      contracts: MOCK_CONTRACTS,
      caveats,
      permissionType: 'erc20-token-revocation',
    });

    expect(caveats).toHaveLength(0);
  });

  describe('ERC-20 permissions', () => {
    it.each(['erc20-token-stream', 'erc20-token-periodic'])(
      'appends a single allowedCalldataEnforcer caveat for one payee (%s)',
      (permissionType) => {
        const caveats: Caveat[] = [];
        appendPayeeCaveatIfPresent({
          rules: [{ type: 'payee', data: { addresses: [PAYEE_ADDRESS_1] } }],
          contracts: MOCK_CONTRACTS,
          caveats,
          permissionType,
        });

        expect(caveats).toHaveLength(1);
        expect(caveats[0].enforcer).toBe(
          MOCK_CONTRACTS.allowedCalldataEnforcer,
        );
        expect(caveats[0].terms).toStrictEqual(
          createAllowedCalldataTerms({
            startIndex: 4,
            value: padTo32Bytes(PAYEE_ADDRESS_1),
          }),
        );
        expect(caveats[0].args).toBe('0x00');
      },
    );

    it('wraps multiple payees in logicalOrWrapperEnforcer for ERC-20', () => {
      const caveats: Caveat[] = [];
      appendPayeeCaveatIfPresent({
        rules: [
          {
            type: 'payee',
            data: { addresses: [PAYEE_ADDRESS_1, PAYEE_ADDRESS_2] },
          },
        ],
        contracts: MOCK_CONTRACTS,
        caveats,
        permissionType: 'erc20-token-stream',
      });

      expect(caveats).toHaveLength(1);
      expect(caveats[0].enforcer).toBe(MOCK_CONTRACTS.logicalOrWrapperEnforcer);
      expect(caveats[0].terms).toStrictEqual(
        createLogicalOrWrapperTerms({
          caveatGroups: [
            [
              {
                enforcer: MOCK_CONTRACTS.allowedCalldataEnforcer,
                terms: createAllowedCalldataTerms({
                  startIndex: 4,
                  value: padTo32Bytes(PAYEE_ADDRESS_1),
                }),
                args: '0x00',
              },
            ],
            [
              {
                enforcer: MOCK_CONTRACTS.allowedCalldataEnforcer,
                terms: createAllowedCalldataTerms({
                  startIndex: 4,
                  value: padTo32Bytes(PAYEE_ADDRESS_2),
                }),
                args: '0x00',
              },
            ],
          ],
        }),
      );
      expect(caveats[0].args).toBe('0x');
    });
  });

  describe('native token permissions', () => {
    it.each(['native-token-stream', 'native-token-periodic'])(
      'appends a single allowedTargetsEnforcer caveat for one payee (%s)',
      (permissionType) => {
        const caveats: Caveat[] = [];
        appendPayeeCaveatIfPresent({
          rules: [{ type: 'payee', data: { addresses: [PAYEE_ADDRESS_1] } }],
          contracts: MOCK_CONTRACTS,
          caveats,
          permissionType,
        });

        expect(caveats).toHaveLength(1);
        expect(caveats[0].enforcer).toBe(MOCK_CONTRACTS.allowedTargetsEnforcer);
        expect(caveats[0].terms).toStrictEqual(
          createAllowedTargetsTerms({ targets: [PAYEE_ADDRESS_1] }),
        );
        expect(caveats[0].args).toBe('0x00');
      },
    );

    it('wraps multiple payees in logicalOrWrapperEnforcer for native tokens', () => {
      const caveats: Caveat[] = [];
      appendPayeeCaveatIfPresent({
        rules: [
          {
            type: 'payee',
            data: { addresses: [PAYEE_ADDRESS_1, PAYEE_ADDRESS_2] },
          },
        ],
        contracts: MOCK_CONTRACTS,
        caveats,
        permissionType: 'native-token-stream',
      });

      expect(caveats).toHaveLength(1);
      expect(caveats[0].enforcer).toBe(MOCK_CONTRACTS.logicalOrWrapperEnforcer);
      expect(caveats[0].terms).toStrictEqual(
        createLogicalOrWrapperTerms({
          caveatGroups: [
            [
              {
                enforcer: MOCK_CONTRACTS.allowedTargetsEnforcer,
                terms: createAllowedTargetsTerms({
                  targets: [PAYEE_ADDRESS_1],
                }),
                args: '0x00',
              },
            ],
            [
              {
                enforcer: MOCK_CONTRACTS.allowedTargetsEnforcer,
                terms: createAllowedTargetsTerms({
                  targets: [PAYEE_ADDRESS_2],
                }),
                args: '0x00',
              },
            ],
          ],
        }),
      );
      expect(caveats[0].args).toBe('0x');
    });
  });
});
