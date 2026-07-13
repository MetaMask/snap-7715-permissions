import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { Caveat } from '@metamask/delegation-core';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
} from '../../clients/trustSignalsClient';
import type { DelegationContracts } from '../chainMetadata';
import type { ExistingPermissionsState } from '../existingpermissions/existingPermissionsState';
import type { BaseContext, BaseMetadata, DeepRequired } from '../types';

/**
 * Lifecycle callbacks used by the request pipeline for a single permission request.
 * Built from a {@link PermissionModule} and {@link ConfirmationShell} at runtime.
 */
export type PermissionRequestLifecycleHandlers<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends BaseMetadata,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> = {
  parseAndValidatePermission: (request: PermissionRequest) => TRequest;
  buildContext: (request: TRequest) => Promise<TContext>;
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  createSkeletonConfirmationContent: () => Promise<SnapElement>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
    scanDappUrlResult: ScanDappUrlResult | null;
    scanAddressResult: FetchAddressScanResult | null;
    existingPermissionsStatus: ExistingPermissionsState;
    isGrantDisabled: boolean;
  }) => Promise<SnapElement>;
  applyContext: (args: {
    context: TContext;
    originalRequest: TRequest;
  }) => Promise<TRequest>;
  populatePermission: (args: {
    permission: TPermission;
  }) => Promise<TPopulatedPermission>;
  createPermissionCaveats: (args: {
    permission: TPopulatedPermission;
    contracts: DelegationContracts;
  }) => Promise<Caveat[]>;
  onConfirmationCreated?: (confirmationCreatedArgs: {
    interfaceId: string;
    initialContext: TContext;
    updateContext: (updateContextArgs: {
      updatedContext: TContext;
    }) => Promise<void>;
  }) => void;
  onConfirmationResolved?: () => void;
};
