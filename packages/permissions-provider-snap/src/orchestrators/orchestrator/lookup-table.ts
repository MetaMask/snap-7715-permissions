import { zNativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';

import type { OrchestratorFactoryFunction } from '../types';
import { nativeTokenStreamPermissionOrchestrator } from './nativeTokenStreamOrchestrator';
import type { SupportedPermissionTypes } from './types';

/**
 * Type safe lookup table for permission orchestrator modules.
 */
const orchestratorModules: Record<
  string,
  <TPermissionType extends SupportedPermissionTypes>(
    permissionType: TPermissionType,
  ) => OrchestratorFactoryFunction<TPermissionType>
> = {
  'native-token-stream': (permissionType) =>
    nativeTokenStreamPermissionOrchestrator as unknown as OrchestratorFactoryFunction<
      typeof permissionType
    >,
};

/**
 * Maps permission types to their corresponding Zod object validators.
 */
const zodObjectMapper = {
  'native-token-stream': zNativeTokenStreamPermission,
};

export { orchestratorModules, zodObjectMapper };
