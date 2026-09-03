import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { Caveat } from '@metamask/delegation-core';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type { PermissionRequestLifecycleHandlers } from './PermissionRequestLifecycleHandlers';
import type { MessageKey } from '../../utils/i18n';
import type { DelegationContracts } from '../chainMetadata';
import { ConfirmationShell } from '../confirmation/ConfirmationShell';
import type { TokenMetadataCoordinator } from '../coordinators/TokenMetadataCoordinator';
import { resolveModuleTokenCaip19s } from '../token/tokenSelectors';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  RuleDefinition,
  TokenCaip19Selector,
} from '../types';

/**
 * Services injected when building permission context.
 */
export type PermissionBuildServices = {
  tokenMetadataCoordinator: TokenMetadataCoordinator;
};

/**
 * Unified contract for a registered permission type.
 */
export type PermissionModule<
  TRequest extends PermissionRequest = PermissionRequest,
  TContext extends BaseContext = BaseContext,
  TMetadata extends BaseMetadata = BaseMetadata,
  TPermission extends TRequest['permission'] = TRequest['permission'],
  TPopulatedPermission extends
    DeepRequired<TPermission> = DeepRequired<TPermission>,
> = {
  type: string;
  name: string;
  title: MessageKey;
  subtitle: MessageKey;
  rules: RuleDefinition<TContext, TMetadata>[];
  /** All tokens whose metadata is fetched and shown as TokenField rows. */
  tokenCaip19s: TokenCaip19Selector<TContext>[];
  /**
   * Token for account-section balance display. Must resolve to one of
   * `tokenCaip19s`. Undefined = no balance shown.
   */
  balanceTokenCaip19?: TokenCaip19Selector<TContext> | undefined;

  parseAndValidate(request: PermissionRequest): TRequest;
  buildContext(
    request: TRequest,
    services: PermissionBuildServices,
  ): Promise<TContext>;
  deriveMetadata(args: {
    context: TContext;
    tokenMetadata: TokenMetadataCoordinator;
  }): Promise<TMetadata>;
  renderBody(args: {
    context: TContext;
    metadata: TMetadata;
    tokenMetadata: TokenMetadataCoordinator;
  }): Promise<SnapElement>;
  applyContext(args: {
    context: TContext;
    originalRequest: TRequest;
    tokenMetadata: TokenMetadataCoordinator;
  }): Promise<TRequest>;
  populatePermission(args: {
    permission: TPermission;
  }): Promise<TPopulatedPermission>;
  createPermissionCaveats(args: {
    permission: TPopulatedPermission;
    contracts: DelegationContracts;
  }): Caveat[];
};

/**
 * Builds pipeline lifecycle handlers from a module and its confirmation shell.
 * @param args - Module, shell instance, and coordinator for the request.
 * @param args.module - Registered permission module for the request type.
 * @param args.confirmationShell - Per-request confirmation shell instance.
 * @param args.tokenMetadataCoordinator - Coordinator for token metadata and balances.
 * @returns Lifecycle handlers consumed by {@link PermissionRequestPipeline}.
 */
export function buildRequestLifecycleHandlers<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends BaseMetadata,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
>(args: {
  module: PermissionModule<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >;
  confirmationShell: ConfirmationShell<TContext, TMetadata>;
  tokenMetadataCoordinator: TokenMetadataCoordinator;
}): PermissionRequestLifecycleHandlers<
  TRequest,
  TContext,
  TMetadata,
  TPermission,
  TPopulatedPermission
> {
  const { module, confirmationShell, tokenMetadataCoordinator } = args;

  const syncCoordinator = (context: TContext): void => {
    const { tokenCaip19s, balanceCaip19 } = resolveModuleTokenCaip19s({
      context,
      tokenCaip19s: module.tokenCaip19s,
      balanceTokenCaip19: module.balanceTokenCaip19,
    });

    tokenMetadataCoordinator.sync({
      accountCaip10: context.accountAddressCaip10,
      tokenCaip19s,
      balanceCaip19,
    });
  };

  return {
    parseAndValidatePermission: (request): TRequest =>
      module.parseAndValidate(request),
    buildContext: async (request): Promise<TContext> => {
      const context = await module.buildContext(request, {
        tokenMetadataCoordinator,
      });
      syncCoordinator(context);
      return context;
    },
    deriveMetadata: async (deriveArgs) =>
      module.deriveMetadata({
        context: deriveArgs.context,
        tokenMetadata: tokenMetadataCoordinator,
      }),
    applyContext: async (applyArgs) =>
      module.applyContext({
        ...applyArgs,
        tokenMetadata: tokenMetadataCoordinator,
      }),
    populatePermission: async (populateArgs) =>
      module.populatePermission(populateArgs),
    createPermissionCaveats: (caveatArgs) =>
      module.createPermissionCaveats(caveatArgs),
    createConfirmationContent: async (renderArgs) =>
      confirmationShell.createConfirmationContent(renderArgs),
    createSkeletonConfirmationContent: async () =>
      Promise.resolve(confirmationShell.createSkeletonContent()),
    onConfirmationCreated: (sessionArgs): void => {
      syncCoordinator(sessionArgs.initialContext);
      confirmationShell.bindSessionEvents({
        interfaceId: sessionArgs.interfaceId,
        initialContext: sessionArgs.initialContext,
        rules: module.rules,
        defaultTokenCaip19: module.balanceTokenCaip19,
        tokenMetadataCoordinator,
        updateContext: sessionArgs.updateContext,
        onExistingPermissionsViewChange:
          sessionArgs.onExistingPermissionsViewChange,
        syncCoordinator,
      });
    },
    onConfirmationResolved: (): void => {
      confirmationShell.resolveSession();
    },
    tokenMetadataCoordinator,
  };
}
