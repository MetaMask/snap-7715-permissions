import type { OrchestratorFactoryFunction } from '../types';
import { nativeTokenStreamPermissionOrchestrator } from './nativeTokenStreamOrchestrator';
import type { SupportedPermissionTypes } from './types/types';

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

export { orchestratorModules };
