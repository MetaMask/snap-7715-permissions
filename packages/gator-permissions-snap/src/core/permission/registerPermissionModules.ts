import { PermissionRegistry } from './PermissionRegistry';
import { erc20TokenAllowancePermissionModule } from '../../permissions/erc20TokenAllowance';
import { erc20TokenPeriodicPermissionModule } from '../../permissions/erc20TokenPeriodic';
import { erc20TokenStreamPermissionModule } from '../../permissions/erc20TokenStream';
import { nativeTokenAllowancePermissionModule } from '../../permissions/nativeTokenAllowance';
import { nativeTokenPeriodicPermissionModule } from '../../permissions/nativeTokenPeriodic';
import { nativeTokenStreamPermissionModule } from '../../permissions/nativeTokenStream';
import { tokenApprovalRevocationPermissionModule } from '../../permissions/tokenApprovalRevocation';

const PERMISSION_MODULES = [
  nativeTokenStreamPermissionModule,
  nativeTokenPeriodicPermissionModule,
  nativeTokenAllowancePermissionModule,
  erc20TokenStreamPermissionModule,
  erc20TokenPeriodicPermissionModule,
  erc20TokenAllowancePermissionModule,
  tokenApprovalRevocationPermissionModule,
] as const;

/**
 * Creates a {@link PermissionRegistry} with all supported permission types registered.
 * @returns A fully populated permission registry.
 */
export function createPermissionRegistry(): PermissionRegistry {
  const registry = new PermissionRegistry();

  for (const module of PERMISSION_MODULES) {
    registry.register(module);
  }

  return registry;
}
