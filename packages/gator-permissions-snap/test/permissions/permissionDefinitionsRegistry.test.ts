import { describe, expect, it } from '@jest/globals';
import { InvalidInputError } from '@metamask/snaps-sdk';

import {
  getPermissionDefinition,
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
});
