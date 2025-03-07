import type {
  OrchestratorFactoryFunction,
  SupportedPermissionTypes,
} from '../types';
import { nativeTokenStreamPermissionOrchestrator } from './nativeTokenStreamOrchestrator';

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
