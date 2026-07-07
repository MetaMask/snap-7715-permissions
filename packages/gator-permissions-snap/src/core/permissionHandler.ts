import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { InvalidRequestError } from '@metamask/snaps-sdk';

import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';
import type {
  BaseContext,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
  RuleDefinition,
  PermissionHandlerType,
  PermissionHandlerDependencies,
  PermissionHandlerParams,
} from './types';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import { ConfirmationShell } from './confirmation/ConfirmationShell';

/**
 * Handler for permission requests.
 * Coordinates the permission-specific validation, UI, and caveat logic.
 */
export class PermissionHandler<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> implements PermissionHandlerType
{
  readonly #orchestrator: PermissionRequestLifecycleOrchestrator;

  readonly #permissionRequest: PermissionRequest;

  readonly #dependencies: PermissionHandlerDependencies<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #confirmationShell: ConfirmationShell<TContext, TMetadata>;

  readonly #rules: RuleDefinition<TContext, TMetadata>[];

  #hasHandledPermissionRequest = false;

  constructor({
    accountController,
    userEventDispatcher,
    orchestrator,
    permissionRequest,
    dependencies,
    tokenPricesService,
    tokenMetadataService,
    rules,
    title,
    subtitle,
  }: PermissionHandlerParams<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >) {
    this.#orchestrator = orchestrator;
    this.#permissionRequest = permissionRequest;
    this.#dependencies = dependencies;
    this.#tokenMetadataService = tokenMetadataService;
    this.#rules = rules;

    this.#confirmationShell = new ConfirmationShell({
      userEventDispatcher,
      accountController,
      tokenMetadataService,
      tokenPricesService,
      title,
      subtitle,
      permissionRequest,
      renderBody: dependencies.createConfirmationContent,
    });
  }

  /**
   * Orchestrates the token stream permission request.
   * @param origin - The request origin.
   * @returns The permission response.
   */
  async handlePermissionRequest(
    origin: string,
  ): Promise<PermissionRequestResult> {
    if (this.#hasHandledPermissionRequest) {
      throw new InvalidRequestError('Permission request already handled');
    }

    this.#hasHandledPermissionRequest = true;

    const result = await this.#orchestrator.orchestrate(
      origin,
      this.#permissionRequest,
      this.#getLifecycleHandlers(),
    );

    return result;
  }

  /**
   * Returns the lifecycle handlers for the orchestrator.
   * @returns The lifecycle handlers.
   */
  #getLifecycleHandlers(): LifecycleOrchestrationHandlers<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  > {
    const buildContextHandler = async (
      request: TRequest,
    ): Promise<TContext> => {
      return await this.#dependencies.buildContext({
        permissionRequest: request,
        tokenMetadataService: this.#tokenMetadataService,
      });
    };

    const {
      parseAndValidatePermission,
      applyContext,
      populatePermission,
      createPermissionCaveats,
      deriveMetadata,
    } = this.#dependencies;

    return {
      parseAndValidatePermission,
      applyContext,
      populatePermission,
      createPermissionCaveats,
      deriveMetadata,
      buildContext: buildContextHandler,
      createConfirmationContent: async (args) =>
        this.#confirmationShell.createConfirmationContent(args),
      createSkeletonConfirmationContent: async () =>
        Promise.resolve(this.#confirmationShell.createSkeletonContent()),
      onConfirmationCreated: (args): void => {
        this.#confirmationShell.bindSessionEvents({
          interfaceId: args.interfaceId,
          initialContext: args.initialContext,
          rules: this.#rules,
          updateContext: args.updateContext,
        });
      },
      onConfirmationResolved: (): void => {
        this.#confirmationShell.resolveSession();
      },
    };
  }
}
