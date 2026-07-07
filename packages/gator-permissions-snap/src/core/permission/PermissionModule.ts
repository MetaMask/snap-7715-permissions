import type {
  Permission,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import type { Caveat } from '@metamask/delegation-core';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type { PermissionGrantLifecycleHandlers } from './PermissionGrantLifecycleHandlers';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { MessageKey } from '../../utils/i18n';
import type { DelegationContracts } from '../chainMetadata';
import { ConfirmationShell } from '../confirmation/ConfirmationShell';
import { DEFAULT_CONFIRMATION_SHELL_CONFIG } from '../confirmation/ConfirmationShellConfig';
import type { ConfirmationShellConfig } from '../confirmation/ConfirmationShellConfig';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  PermissionDefinition,
  RuleDefinition,
} from '../types';

/**
 * Services injected when building permission context.
 */
export type PermissionBuildServices = {
  tokenMetadataService: TokenMetadataService;
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
  title: MessageKey;
  subtitle: MessageKey;
  rules: RuleDefinition<TContext, TMetadata>[];
  confirmationShell: ConfirmationShellConfig;

  parseAndValidate(request: PermissionRequest): TRequest;
  buildContext(
    request: TRequest,
    services: PermissionBuildServices,
  ): Promise<TContext>;
  deriveMetadata(args: { context: TContext }): Promise<TMetadata>;
  renderBody(args: {
    context: TContext;
    metadata: TMetadata;
  }): Promise<SnapElement>;
  applyContext(args: {
    context: TContext;
    originalRequest: TRequest;
  }): Promise<TRequest>;
  populatePermission(args: {
    permission: TPermission;
  }): Promise<TPopulatedPermission>;
  createPermissionCaveats(args: {
    permission: TPopulatedPermission;
    contracts: DelegationContracts;
  }): Promise<Caveat[]>;
};

/** Erased module stored in the registry. */
export type RegisteredPermissionModule = PermissionModule<
  PermissionRequest,
  BaseContext,
  BaseMetadata,
  Permission,
  DeepRequired<Permission>
>;

/**
 * Converts a permission folder definition into a {@link PermissionModule}.
 * @param type - Permission type string (descriptor name).
 * @param definition - Permission-specific definition from a permission folder.
 * @returns A module ready for registry registration.
 */
export function toPermissionModule<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends BaseMetadata,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
>(
  type: string,
  definition: PermissionDefinition<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >,
): PermissionModule<
  TRequest,
  TContext,
  TMetadata,
  TPermission,
  TPopulatedPermission
> {
  const { dependencies, confirmationShell, ...rest } = definition;

  return {
    type,
    ...rest,
    confirmationShell: confirmationShell ?? DEFAULT_CONFIRMATION_SHELL_CONFIG,
    parseAndValidate: dependencies.parseAndValidatePermission,
    buildContext: async (request, services) =>
      dependencies.buildContext({
        permissionRequest: request,
        tokenMetadataService: services.tokenMetadataService,
      }),
    deriveMetadata: dependencies.deriveMetadata,
    renderBody: dependencies.createConfirmationContent,
    applyContext: dependencies.applyContext,
    populatePermission: dependencies.populatePermission,
    createPermissionCaveats: dependencies.createPermissionCaveats,
  };
}

/**
 * Builds pipeline lifecycle handlers from a module and its confirmation shell.
 * @param args - Module, shell instance, and services for context building.
 * @param args.module - Registered permission module for the request type.
 * @param args.confirmationShell - Per-request confirmation shell instance.
 * @param args.tokenMetadataService - Service injected into module context building.
 * @returns Lifecycle handlers consumed by {@link PermissionGrantPipeline}.
 */
export function buildGrantLifecycleHandlers<
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
  tokenMetadataService: TokenMetadataService;
}): PermissionGrantLifecycleHandlers<
  TRequest,
  TContext,
  TMetadata,
  TPermission,
  TPopulatedPermission
> {
  const { module, confirmationShell, tokenMetadataService } = args;

  return {
    parseAndValidatePermission: (request) => module.parseAndValidate(request),
    buildContext: async (request) =>
      module.buildContext(request, { tokenMetadataService }),
    deriveMetadata: async (deriveArgs) => module.deriveMetadata(deriveArgs),
    applyContext: async (applyArgs) => module.applyContext(applyArgs),
    populatePermission: async (populateArgs) =>
      module.populatePermission(populateArgs),
    createPermissionCaveats: async (caveatArgs) =>
      module.createPermissionCaveats(caveatArgs),
    createConfirmationContent: async (renderArgs) =>
      confirmationShell.createConfirmationContent(renderArgs),
    createSkeletonConfirmationContent: async () =>
      Promise.resolve(confirmationShell.createSkeletonContent()),
    onConfirmationCreated: (sessionArgs): void => {
      confirmationShell.bindSessionEvents({
        interfaceId: sessionArgs.interfaceId,
        initialContext: sessionArgs.initialContext,
        rules: module.rules,
        updateContext: sessionArgs.updateContext,
      });
    },
    onConfirmationResolved: (): void => {
      confirmationShell.resolveSession();
    },
  };
}
