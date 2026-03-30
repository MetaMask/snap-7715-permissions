import { describe, expect, it } from '@jest/globals';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { getConfiguredChainIds } from '../../src/core/chainMetadata';
import {
  getPermissionDefinition,
  getSupportedChainsForPermissionType,
  PERMISSION_DEFINITIONS_BY_TYPE,
} from '../../src/permissions/permissionDefinitionsRegistry';

describe('permissionDefinitionsRegistry', () => {
  it('getPermissionDefinition returns a definition for each registered type', () => {
    for (const type of Object.keys(
      PERMISSION_DEFINITIONS_BY_TYPE,
    ) as (keyof typeof PERMISSION_DEFINITIONS_BY_TYPE)[]) {
      const def = getPermissionDefinition(type);
      expect(def.getSupportedChains).toBeInstanceOf(Function);
    }
  });

  it('getPermissionDefinition throws for unknown type', () => {
    expect(() => getPermissionDefinition('unknown-type')).toThrow(
      InvalidInputError,
    );
  });

  it('getSupportedChainsForPermissionType returns configured chains for stream', () => {
    expect(
      getSupportedChainsForPermissionType('native-token-stream'),
    ).toStrictEqual(getConfiguredChainIds());
  });

  it('native-token-swap chain list is smaller than full configured list', () => {
    const full = getSupportedChainsForPermissionType('native-token-stream');
    const swapOnly = getSupportedChainsForPermissionType('native-token-swap');
    expect(swapOnly.length).toBeLessThan(full.length);
    for (const id of swapOnly) {
      expect(full).toContain(id);
    }
  });
});
