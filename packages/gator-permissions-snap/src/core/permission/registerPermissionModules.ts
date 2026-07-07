import { toPermissionModule } from './PermissionModule';
import { PermissionRegistry, permissionModuleMap } from './PermissionRegistry';
import { erc20TokenAllowancePermissionDefinition } from '../../permissions/erc20TokenAllowance';
import { erc20TokenPeriodicPermissionDefinition } from '../../permissions/erc20TokenPeriodic';
import { erc20TokenStreamPermissionDefinition } from '../../permissions/erc20TokenStream';
import { nativeTokenAllowancePermissionDefinition } from '../../permissions/nativeTokenAllowance';
import { nativeTokenPeriodicPermissionDefinition } from '../../permissions/nativeTokenPeriodic';
import { nativeTokenStreamPermissionDefinition } from '../../permissions/nativeTokenStream';
import { tokenApprovalRevocationPermissionDefinition } from '../../permissions/tokenApprovalRevocation';

const PERMISSION_MODULES = permissionModuleMap({
  'native-token-stream': nativeTokenStreamPermissionDefinition,
  'native-token-periodic': nativeTokenPeriodicPermissionDefinition,
  'native-token-allowance': nativeTokenAllowancePermissionDefinition,
  'erc20-token-stream': erc20TokenStreamPermissionDefinition,
  'erc20-token-periodic': erc20TokenPeriodicPermissionDefinition,
  'erc20-token-allowance': erc20TokenAllowancePermissionDefinition,
  'token-approval-revocation': tokenApprovalRevocationPermissionDefinition,
});

/**
 * Creates a {@link PermissionRegistry} with all supported permission types registered.
 * @returns A fully populated permission registry.
 */
export function createPermissionRegistry(): PermissionRegistry {
  const registry = new PermissionRegistry();

  for (const [type, definition] of Object.entries(PERMISSION_MODULES)) {
    registry.register(toPermissionModule(type, definition));
  }

  return registry;
}
