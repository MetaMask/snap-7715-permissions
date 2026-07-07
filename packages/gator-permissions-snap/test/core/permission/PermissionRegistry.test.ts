import { describe, expect, it, jest } from '@jest/globals';
import { InternalError, InvalidInputError } from '@metamask/snaps-sdk';

import { PermissionRegistry } from '../../../src/core/permission/PermissionRegistry';
import type { RegisteredPermissionDefinition } from '../../../src/core/permission/PermissionRegistry';
import { createPermissionRegistry } from '../../../src/core/permission/registerPermissionModules';

const createMinimalDefinition = (
  type: string,
): RegisteredPermissionDefinition =>
  ({
    type,
    rules: [],
    title: 'permissionRequestTitle',
    subtitle: 'permissionRequestSubtitle',
    dependencies: {
      parseAndValidatePermission: jest.fn(),
      buildContext: jest.fn(),
      deriveMetadata: jest.fn(),
      createConfirmationContent: jest.fn(),
      applyContext: jest.fn(),
      populatePermission: jest.fn(),
      createPermissionCaveats: jest.fn(),
    },
  }) as RegisteredPermissionDefinition;

describe('PermissionRegistry', () => {
  describe('register', () => {
    it('throws InternalError when registering a duplicate type', () => {
      const registry = new PermissionRegistry();
      const definition = createMinimalDefinition('native-token-stream');

      registry.register(definition);

      expect(() => registry.register(definition)).toThrow(InternalError);
      expect(() => registry.register(definition)).toThrow(
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

    it('returns the registered definition for a known type', () => {
      const registry = new PermissionRegistry();
      const definition = createMinimalDefinition('native-token-stream');

      registry.register(definition);

      expect(registry.get('native-token-stream')).toBe(definition);
    });
  });

  describe('getSupportedTypes', () => {
    it('returns all registered type strings', () => {
      const registry = new PermissionRegistry();
      registry.register(createMinimalDefinition('native-token-stream'));
      registry.register(createMinimalDefinition('erc20-token-stream'));

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
  });
});
