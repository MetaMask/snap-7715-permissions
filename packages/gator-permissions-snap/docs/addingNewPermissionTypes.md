# Adding new permission types

Follow the following steps to add new permission types to the `permissions-provider-snap`:

1. Create a new directory structure for your permission type in `./packages/permissions-provider-snap/src/permissions/<new-permission-type>/`:
   - `handler.ts` - The main handler implementation
   - `types.ts` - Type definitions specific to this permission
   - `validation.ts` - Validation functions
   - `context.ts` - Context transformations
   - `content.tsx` - UI content for the confirmation dialog
   - `caveats.ts` - Logic for applying caveats

2. Define your permission type and related interfaces in `types.ts`:

```ts
import type { BaseContext, PermissionRequest } from '../../core/types';
import type { JsonObject } from '@metamask/snaps-sdk';

export interface NewPermissionTypePermission {
  // Permission properties
  type: 'new-permission-type';
  data: {
    // Permission data properties
  };
}

export interface NewPermissionTypePermissionRequest extends PermissionRequest {
  permission: NewPermissionTypePermission;
}

export interface NewPermissionTypeContext extends BaseContext {
  // Context properties
}

export interface NewPermissionTypeMetadata {
  // Metadata properties
}

export interface PopulatedNewPermissionTypePermission extends NewPermissionTypePermission {
  // Fully populated version of the permission
}
```

3. Implement the core transformation functions in `context.ts`:

```ts
// Parse and transform request to context
export function permissionRequestToContext({
  permissionRequest,
  accountController,
  // other dependencies as needed
}: {
  permissionRequest: NewPermissionTypePermissionRequest;
  accountController: AccountController;
  // other parameters
}): NewPermissionTypeContext {
  // Transform permission request to context
}

// Transform context back to permission request
export function contextToPermissionRequest({
  context,
  originalRequest,
}: {
  context: NewPermissionTypeContext;
  originalRequest: NewPermissionTypePermissionRequest;
}): NewPermissionTypePermissionRequest {
  // Transform context back to permission request
}

// Derive metadata from context
export function createContextMetadata({
  context,
}: {
  context: NewPermissionTypeContext;
}): NewPermissionTypeMetadata {
  // Derive metadata from context
}

// Populate permission with default values
export function populatePermission({
  permission,
}: {
  permission: NewPermissionTypePermission;
}): PopulatedNewPermissionTypePermission {
  // Populate permission with default values
}
```

4. Implement the validation function in `validation.ts`:

```ts
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): NewPermissionTypePermissionRequest {
  // Validate permission request
  // Throw error if invalid
  // Return typed permission request
}
```

5. Create the UI content in `content.tsx`:

```tsx
export function createConfirmationContent({
  context,
  metadata,
  origin,
  chainId,
  // other parameters
}: {
  context: NewPermissionTypeContext;
  metadata: NewPermissionTypeMetadata;
  origin: string;
  chainId: number;
  // other parameters
}): ReactNode {
  // Create UI for confirmation dialog
}
```

6. Implement the caveats logic in `caveats.ts`:

```ts
export function appendCaveats({
  permission,
  caveatBuilder,
}: {
  permission: PopulatedNewPermissionTypePermission;
  caveatBuilder: CaveatBuilder;
}): CaveatBuilder {
  // Append permission-specific caveats
  return caveatBuilder;
}
```

7. Implement the handler in `handler.ts`:

```ts
import type { PermissionHandler } from '../types';
import type { LifecycleOrchestrationHandlers, PermissionRequestResult } from '../../core/types';
import type { PermissionRequestLifecycleOrchestrator } from '../../core/permissionRequestLifecycleOrchestrator';
import { parseAndValidatePermission } from './validation';
import { permissionRequestToContext, contextToPermissionRequest, createContextMetadata, populatePermission } from './context';
import { createConfirmationContent } from './content';
import { appendCaveats } from './caveats';
import type { 
  NewPermissionTypePermissionRequest, 
  NewPermissionTypeContext,
  NewPermissionTypeMetadata,
  NewPermissionTypePermission,
  PopulatedNewPermissionTypePermission
} from './types';

export type NewPermissionTypeDependencies = {
  validateRequest: typeof parseAndValidatePermission;
  buildContext: typeof permissionRequestToContext;
  deriveMetadata: typeof createContextMetadata;
  createConfirmationContent: typeof createConfirmationContent;
  applyContext: typeof contextToPermissionRequest;
  populatePermission: typeof populatePermission;
  appendCaveats: typeof appendCaveats;
};

const defaultDependencies: NewPermissionTypeDependencies = {
  validateRequest: parseAndValidatePermission,
  buildContext: permissionRequestToContext,
  deriveMetadata: createContextMetadata,
  createConfirmationContent,
  applyContext: contextToPermissionRequest,
  populatePermission,
  appendCaveats,
};

export class NewPermissionTypeHandler implements PermissionHandler {
  readonly #accountController: AccountController;
  readonly #userEventDispatcher: UserEventDispatcher;
  readonly #orchestrator: PermissionRequestLifecycleOrchestrator;
  readonly #permissionRequest: NewPermissionTypePermissionRequest;
  readonly #dependencies: NewPermissionTypeDependencies;
  
  // Additional state and handlers
  
  constructor({
    accountController,
    userEventDispatcher,
    orchestrator,
    permissionRequest,
    // Additional dependencies
  }: {
    accountController: AccountController;
    userEventDispatcher: UserEventDispatcher;
    orchestrator: PermissionRequestLifecycleOrchestrator;
    permissionRequest: NewPermissionTypePermissionRequest;
    // Additional parameters
  }, 
  dependencies: NewPermissionTypeDependencies = defaultDependencies) {
    this.#accountController = accountController;
    this.#userEventDispatcher = userEventDispatcher;
    this.#orchestrator = orchestrator;
    this.#permissionRequest = permissionRequest;
    this.#dependencies = dependencies;
  }
  
  async handlePermissionRequest(origin: string): Promise<PermissionRequestResult> {
    // The handler delegates to the orchestrator to manage the permission lifecycle
    return this.#orchestrator.orchestrate(
      origin,
      this.#permissionRequest,
      this.#getLifecycleHandlers(),
    );
  }
  
  // This method provides permission-specific implementations for the orchestrator's lifecycle hooks
  #getLifecycleHandlers(): LifecycleOrchestrationHandlers<
    NewPermissionTypePermissionRequest,
    NewPermissionTypeContext,
    NewPermissionTypeMetadata,
    NewPermissionTypePermission,
    PopulatedNewPermissionTypePermission
  > {
    // Return the lifecycle handlers
    return {
      validateRequest: this.#dependencies.validateRequest,
      applyContext: this.#dependencies.applyContext,
      populatePermission: this.#dependencies.populatePermission,
      appendCaveats: this.#dependencies.appendCaveats,
      deriveMetadata: this.#dependencies.deriveMetadata,
      
      // You may need to customize these handlers to include permission-specific logic
      buildContext: async (request) => {
        return this.#dependencies.buildContext({
          permissionRequest: request,
          accountController: this.#accountController,
          // Additional dependencies
        });
      },
      
      createConfirmationContent: async (args) => {
        return this.#dependencies.createConfirmationContent(args);
      },
      
      // Optional lifecycle hooks for UI interaction
      onConfirmationCreated: ({ interfaceId, initialContext, updateContext }) => {
        // Set up UI event handlers
      },
      
      onConfirmationResolved: () => {
        // Clean up UI event handlers
      }
    };
  }
}
```

8. Add your handler to the `PermissionHandlerFactory` in `./packages/permissions-provider-snap/src/core/permissionHandlerFactory.ts`:

```ts
import { NewPermissionTypeHandler } from '../permissions/new-permission-type/handler';
import type { NewPermissionTypePermissionRequest } from '../permissions/new-permission-type/types';

// In the createPermissionHandler method
switch (type) {
  case 'native-token-stream':
    return new NativeTokenStreamHandler({
      ...baseDependencies,
      tokenPricesService: this.#tokenPricesService,
    });
  case 'new-permission-type':
    return new NewPermissionTypeHandler({
      ...baseDependencies,
      // Add any additional dependencies
    });
  default:
    throw new Error(`Unsupported permission type: ${type}`);
}
```

9. Add your permission type to the permission registry 

Update the `DEFAULT_OFFERS` array to include your new permission type:

```
export const DEFAULT_OFFERS: GatorPermission[] = [
  {
    type: 'native-token-stream',
    proposedName: 'Native Token Stream',
  },
+  {
+    type: 'new-permission-type',
+    proposedName: 'New Permission Type',
+  },
];
```

note: in the future this step will not be necessary, as the gator-permissions-snap will automatically register supported permissions.

## Understanding the Handler-Orchestrator Relationship

The relationship between `NewPermissionTypeHandler` and `PermissionRequestLifecycleOrchestrator` is a key architectural pattern in the permission system:

### Separation of Concerns

- **Handler**: Encapsulates permission-specific logic, validation, UI rendering, and user interaction
- **Orchestrator**: Manages the standardized permission request lifecycle across all permission types

### How They Work Together

1. **Delegation Pattern**: The handler delegates the permission request workflow to the orchestrator, but provides permission-specific implementations for each step through lifecycle handlers.

2. **Lifecycle Handlers**: The handler creates and provides a set of functions to the orchestrator through `#getLifecycleHandlers()` that implement each step of the permission workflow:
   - `validateRequest`: Validates the permission request format
   - `buildContext`: Transforms the request into a context object for UI rendering
   - `deriveMetadata`: Derives metadata from the context, such as validation messages
   - `createConfirmationContent`: Builds the UI content
   - `applyContext`: Applies user modifications back to the request
   - `populatePermission`: Fills in optional fields with defaults
   - `appendCaveats`: Adds permission-specific caveats to the CaveatBuilder
   - `onConfirmationCreated`: Can be used to setup UI event handlers
   - `onConfirmationResolved`: Can be used to cleanup UI event handlers

3. **Workflow Orchestration**: The orchestrator uses these handlers to execute a standardized workflow:
   1. Validate the permission request
   2. Build a context object
   3. Create a confirmation dialog
   4. Allow user interaction and context modification
   5. Process the user's decision
   6. Create and sign a delegation if approved
   7. Return the result

4. **Event Management**: The handler sets up and manages UI event handlers through the UserEventDispatcher to handle permission-specific user interactions like button clicks or form submissions.

This architecture ensures that:
- Common lifecycle logic is consistently implemented across all permission types
- Permission-specific logic is isolated within the handler
- The system remains extensible for new permission types
- Each permission type can customize the user experience as needed
- Testing can be performed on smaller, more focused components

By implementing the `PermissionHandler` interface and providing lifecycle handlers to the orchestrator, you create a clean integration between permission-specific logic and the standardized permission workflow.

You are now all set to implement your permission handler.
