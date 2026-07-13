import { InvalidInputError, InternalError } from '@metamask/snaps-sdk';

import type { PermissionModule } from './PermissionModule';

/**
 * Registry mapping permission type strings to their modules.
 */
export class PermissionRegistry {
  readonly #modules = new Map<string, PermissionModule>();

  register(module: PermissionModule): void {
    if (this.#modules.has(module.type)) {
      throw new InternalError(`Duplicate permission type: ${module.type}`);
    }
    this.#modules.set(module.type, module);
  }

  /**
   * Returns the registered module for a permission type.
   * @param type - The permission type string (descriptor name).
   * @returns The registered permission module.
   * @throws If the type is not registered.
   */
  get(type: string): PermissionModule {
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
