import type { AccountController } from '../../accountController';
import { PermissionHandler } from '../../core/permissionHandler';
import type { PermissionRequestLifecycleOrchestrator } from '../../core/permissionRequestLifecycleOrchestrator';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import { appendCaveats } from './caveats';
import { createConfirmationContent } from './content';
import {
  applyContext,
  buildContext,
  deriveMetadata,
  populatePermission,
} from './context';
import { allRules } from './rules';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
  NativeTokenStreamPermissionRequest,
  PopulatedNativeTokenStreamPermission,
} from './types';
import { parseAndValidatePermission } from './validation';

export const createNativeTokenStreamHandler = ({
  permissionRequest,
  accountController,
  userEventDispatcher,
  orchestrator,
  tokenPricesService,
}: {
  permissionRequest: NativeTokenStreamPermissionRequest;
  accountController: AccountController;
  userEventDispatcher: UserEventDispatcher;
  orchestrator: PermissionRequestLifecycleOrchestrator;
  tokenPricesService: TokenPricesService;
}) => {
  return new PermissionHandler<
    NativeTokenStreamPermissionRequest,
    NativeTokenStreamContext,
    NativeTokenStreamMetadata,
    NativeTokenStreamPermission,
    PopulatedNativeTokenStreamPermission
  >({
    accountController,
    userEventDispatcher,
    orchestrator,
    permissionRequest,
    tokenPricesService,
    rules: allRules,
    title: 'Native token stream',
    dependencies: {
      validateRequest: parseAndValidatePermission,
      buildContext,
      deriveMetadata,
      createConfirmationContent,
      applyContext,
      populatePermission,
      appendCaveats,
    },
  });
};
