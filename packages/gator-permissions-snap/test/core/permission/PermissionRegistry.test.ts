import { describe, expect, it } from '@jest/globals';
import { InternalError, InvalidInputError } from '@metamask/snaps-sdk';

import type { PermissionModule } from '../../../src/core/permission/PermissionModule';
import { PermissionRegistry } from '../../../src/core/permission/PermissionRegistry';
import { createPermissionRegistry } from '../../../src/core/permission/registerPermissionModules';
import { nativeTokenStreamPermissionModule } from '../../../src/permissions/nativeTokenStream';

const createMinimalModule = (type: string): PermissionModule => ({
  ...nativeTokenStreamPermissionModule,
  type,
  rules: [],
});

describe('PermissionRegistry', () => {
  describe('register', () => {
    it('throws InternalError when registering a duplicate type', () => {
      const registry = new PermissionRegistry();
      const module = createMinimalModule('native-token-stream');

      registry.register(module);

      expect(() => registry.register(module)).toThrow(InternalError);
      expect(() => registry.register(module)).toThrow(
        'Duplicate permission type: native-token-stream',
      );
    });
  });

  describe('get', () => {
    it('throws InvalidInputError for an unknown type', () => {
      const registry = new PermissionRegistry();

      expect(() => registry.get('unsupported-permission')).toThrow(
        InvalidInputError,
      );
      expect(() => registry.get('unsupported-permission')).toThrow(
        'Unsupported permission type: unsupported-permission',
      );
    });

    it('returns the registered module for a known type', () => {
      const registry = new PermissionRegistry();
      const module = createMinimalModule('native-token-stream');

      registry.register(module);

      expect(registry.get('native-token-stream')).toBe(module);
    });
  });

  describe('getSupportedTypes', () => {
    it('returns all registered type strings', () => {
      const registry = new PermissionRegistry();
      registry.register(createMinimalModule('native-token-stream'));
      registry.register(createMinimalModule('erc20-token-stream'));

      expect(registry.getSupportedTypes()).toStrictEqual([
        'native-token-stream',
        'erc20-token-stream',
      ]);
    });
  });

  describe('createPermissionRegistry', () => {
    it('registers all seven supported permission types', () => {
      const registry = createPermissionRegistry();

      expect(registry.getSupportedTypes()).toStrictEqual([
        'native-token-stream',
        'native-token-periodic',
        'native-token-allowance',
        'erc20-token-stream',
        'erc20-token-periodic',
        'erc20-token-allowance',
        'token-approval-revocation',
      ]);
    });

    it('allows lookup of each registered type', () => {
      const registry = createPermissionRegistry();

      for (const type of registry.getSupportedTypes()) {
        expect(registry.get(type).type).toBe(type);
      }
    });

    it('exposes flat module methods for token-approval-revocation', () => {
      const registry = createPermissionRegistry();
      const module = registry.get('token-approval-revocation');

      expect(module.renderBody).toStrictEqual(expect.any(Function));
      expect(module.parseAndValidate).toStrictEqual(expect.any(Function));
      expect(module.showTokenBalance).toBe(false);
    });
  });
});
