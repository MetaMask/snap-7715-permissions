import type {
  Permission,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import { InvalidInputError, InternalError } from '@metamask/snaps-sdk';

import type { MessageKey } from '../../utils/i18n';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  PermissionDefinition,
  PermissionHandlerDependencies,
  RuleDefinition,
} from '../types';

/**
 * Erased permission definition stored in the registry.
 * Heterogeneous permission modules are widened at registration time because
 * the registry must hold every type behind one lookup key.
 */
export type RegisteredPermissionDefinition = {
  type: string;
  rules: RuleDefinition<BaseContext, BaseMetadata>[];
  title: MessageKey;
  subtitle: MessageKey;
  dependencies: PermissionHandlerDependencies<
    PermissionRequest,
    BaseContext,
    BaseMetadata,
    Permission,
    DeepRequired<Permission>
  >;
};

/** Map of permission type strings to their definitions before registry erasure. */
export type PermissionModuleMap = Record<string, PermissionDefinition>;

/**
 * Builds a permission module map from heterogeneous permission definitions.
 * @param modules - Permission definitions keyed by type string.
 * @returns The same map widened for registry registration.
 */
export function permissionModuleMap(modules: unknown): PermissionModuleMap {
  return modules as PermissionModuleMap;
}

/**
 * Registers a typed permission definition in the registry's erased shape.
 * @param type - The permission type string (descriptor name).
 * @param definition - A permission-specific definition without its type string.
 * @returns The definition widened for registry storage.
 */
export function toRegisteredPermissionDefinition<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends BaseMetadata,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
>(
  type: string,
  definition: PermissionDefinition<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >,
): RegisteredPermissionDefinition {
  return { type, ...definition } as unknown as RegisteredPermissionDefinition;
}

/**
 * Registry mapping permission type strings to their definitions.
 */
export class PermissionRegistry {
  readonly #modules = new Map<string, RegisteredPermissionDefinition>();

  /**
   * Registers a permission definition. Each type may only be registered once.
   * @param definition - The permission definition including its type string.
   * @throws If the type is already registered.
   */
  register(definition: RegisteredPermissionDefinition): void {
    if (this.#modules.has(definition.type)) {
      throw new InternalError(`Duplicate permission type: ${definition.type}`);
    }
    this.#modules.set(definition.type, definition);
  }

  /**
   * Returns the registered definition for a permission type.
   * @param type - The permission type string (descriptor name).
   * @returns The registered permission definition.
   * @throws If the type is not registered.
   */
  get(type: string): RegisteredPermissionDefinition {
    const module = this.#modules.get(type);
    if (!module) {
      throw new InvalidInputError(`Unsupported permission type: ${type}`);
    }
    return module;
  }

  /**
   * Returns all registered permission type strings.
   * @returns Array of supported permission type names.
   */
  getSupportedTypes(): string[] {
    return [...this.#modules.keys()];
  }
}
