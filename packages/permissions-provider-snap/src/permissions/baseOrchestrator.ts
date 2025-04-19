import type {
  Permission,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import {
  createCaveatBuilder,
  createDelegation,
  encodeDelegation,
  type CoreCaveatBuilder,
} from '@metamask/delegation-toolkit';
import type {
  ComponentOrElement,
  UserInputEventType,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import type { Address, Hex } from 'viem';
import { fromHex, toHex } from 'viem';

import type {
  PermissionConfirmationContext,
  PermissionConfirmationRenderHandler,
  State,
} from '../confirmation';
import type {
  AccountControllerInterface,
  DialogContentEventHandlers,
  TokenPricesService,
  UserEventDispatcher,
  UserInputEventByType,
} from '../core';
import type {
  OrchestrateArgs,
  OrchestrateResult,
  OrchestratorDependencies,
  PermissionContextMeta,
  PermissionsContextBuilderMeta,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './types';

/**
 * Base class for all permission orchestrators
 */
export abstract class BaseOrchestrator<
  TPermissionType extends SupportedPermissionTypes,
> {
  readonly #accountController: AccountControllerInterface;

  readonly #tokenPricesService: TokenPricesService;

  readonly #permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #permissionRequest: PermissionRequest;

  readonly #origin: string;

  constructor(
    orchestratorDependencies: OrchestratorDependencies,
    permissionRequest: PermissionRequest,
    origin: string,
  ) {
    this.#accountController = orchestratorDependencies.accountController;
    this.#tokenPricesService = orchestratorDependencies.tokenPricesService;
    this.#permissionConfirmationRenderHandler =
      orchestratorDependencies.permissionConfirmationRenderHandler;
    this.#userEventDispatcher = orchestratorDependencies.userEventDispatcher;

    this.#permissionRequest = permissionRequest;
    this.#origin = origin;
  }

  // Abstract methods that child classes must implement *******************

  /**
   * Return the permission type.
   */
  protected abstract getPermissionType(): TPermissionType;

  /**
   * Return the CAIP-19 asset type for the given chain ID for the permission type.
   * @param requestedPermission - The requested permission.
   * @param chainId - The chain ID.
   * @returns The CAIP-19 asset type.
   */
  protected abstract getTokenCaipAssetType(
    requestedPermission: PermissionTypeMapping[TPermissionType],
    chainId: number,
  ): CaipAssetType;

  /**
   * Validates the base permission request for the permission type.
   *
   * @param basePermission - The base permission to validate.
   * @returns The parsed and validated permission.
   * @throws If the base permission request is invalid given the permission type.
   */
  protected abstract parseAndValidate(
    basePermission: Permission,
  ): Promise<PermissionTypeMapping[TPermissionType]>;

  /**
   * Appends caveats to caveats builder for the permission type.
   * @param permissionContextMeta - The permission context metadata that incudes the attenuated permission and the caveats builder.
   * @returns The an unbuilt caveat builder with caveats added for the permission type.
   */
  protected abstract appendPermissionCaveats(
    permissionContextMeta: PermissionContextMeta<TPermissionType>,
  ): Promise<CoreCaveatBuilder>;

  /**
   * Builds the permission confirmation for the permission type.
   * @param context - The permission confirmation context.
   * @returns The permission confirmation page component.
   */
  protected abstract buildPermissionConfirmation(
    context: PermissionConfirmationContext<TPermissionType>,
  ): ComponentOrElement;

  /**
   * Resolves the attenuated permission for the permission type.
   * @param requestedPermission - The requested permission.
   * @param attenuatedContext - The attenuated context.
   * @returns The attenuated permission.
   */
  protected abstract resolveAttenuatedPermission(
    requestedPermission: PermissionTypeMapping[TPermissionType],
    attenuatedContext: PermissionConfirmationContext<TPermissionType>,
  ): Promise<{
    expiry: number;
    attenuatedPermission: PermissionTypeMapping[TPermissionType];
  }>;

  /**
   * Handles the user input event for the permission type.
   * @param args - The user input event handler args.
   * @param args.event - The user input event.
   * @param args.attenuatedContext - The attenuated context.
   * @param args.interfaceId - The interface ID.
   */
  protected abstract handleUserEventHandler<
    TUserInputEventType extends UserInputEventType,
  >(args: {
    event: UserInputEventByType<TUserInputEventType>;
    attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
    interfaceId: string;
  }): void | Promise<void>;

  /**
   * Returns a set of event handlers for the confirmation dialog specific to the permission type.
   * These event handlers are used to handle user input events in the confirmation dialog.
   *
   * @param permission - The permission for the confirmation dialog.
   * @param expiry - The expiry of the permission.
   * @returns An array of event handlers for the confirmation dialog.
   */
  protected abstract getConfirmationDialogEventHandlers(
    permission: PermissionTypeMapping[TPermissionType],
    expiry: number,
  ): {
    state: State<TPermissionType>;
    dialogContentEventHandlers: DialogContentEventHandlers[];
  };

  /**
   * Register event handlers for the confirmation dialog.
   *
   * @param handlers - The event handlers to register.
   * @param interfaceId - The interface ID.
   */
  #registerEventHandlers(
    handlers: DialogContentEventHandlers[],
    interfaceId: string,
  ): void {
    handlers.forEach(({ elementName, eventType, handler }) => {
      this.#userEventDispatcher.on({
        elementName,
        eventType,
        interfaceId,
        handler,
      });
    });
  }

  /**
   * Unregister event handlers for the confirmation dialog.
   *
   * @param handlers - The event handlers to unregister.
   * @param interfaceId - The interface ID.
   */
  #unregisterEventHandlers(
    handlers: DialogContentEventHandlers[],
    interfaceId: string,
  ): void {
    handlers.forEach(({ elementName, eventType, handler }) => {
      this.#userEventDispatcher.off({
        elementName,
        eventType,
        interfaceId,
        handler,
      });
    });
  }

  /**
   * Prepare the account details for the permission picker UI.
   * @param chainId - The chain ID.
   * @returns The account address, balance.
   */
  async #prepareAccountDetails(chainId: number): Promise<[Hex, Hex]> {
    return await Promise.all([
      this.#accountController.getAccountAddress({
        chainId,
      }),
      this.#accountController.getAccountBalance({
        chainId,
      }),
    ]);
  }

  /**
   * Prepare the orchestrate arguments to fulfill the permission request.
   *
   * @param permissionRequest - The permission request.
   * @returns The orchestrate arguments.
   */
  async #prepareOrchestrateArgs(
    permissionRequest: PermissionRequest,
  ): Promise<OrchestrateArgs<SupportedPermissionTypes>> {
    const validatedPermission = await this.parseAndValidate(
      permissionRequest.permission,
    );

    const sessionAccount = permissionRequest.signer.data.address;
    const { chainId, expiry, isAdjustmentAllowed } = permissionRequest;

    return {
      validatedPermission,
      sessionAccount,
      chainId: fromHex(chainId, 'number'),
      expiry,
      isAdjustmentAllowed: isAdjustmentAllowed ?? true,
    };
  }

  /**
   * Builds the permissions context.
   * @param permissionsContextBuilderMeta - The permissions context builder meta.
   * @returns The permissions context.
   */
  async #buildPermissionsContext(
    permissionsContextBuilderMeta: PermissionsContextBuilderMeta,
  ) {
    const { address, sessionAccount, caveats, chainId } =
      permissionsContextBuilderMeta;

    const signedDelegation = await this.#accountController.signDelegation({
      chainId,
      delegation: createDelegation({
        to: sessionAccount,
        from: address,
        caveats,
      }),
    });

    return encodeDelegation([signedDelegation]);
  }

  /**
   * Builds the permission response.
   * @param validatedPermission - The validated permission.
   * @param attenuatedContext - The attenuated context.
   * @param chainId - The chain ID.
   * @param address - The address.
   * @param sessionAccount - The session account.
   * @param isAdjustmentAllowed - The is adjustment allowed.
   * @returns The permission response.
   */
  async #buildPermissionResponse(
    validatedPermission: PermissionTypeMapping[TPermissionType],
    attenuatedContext: PermissionConfirmationContext<TPermissionType>,
    chainId: number,
    address: Address,
    sessionAccount: Address,
    isAdjustmentAllowed: boolean,
  ): Promise<OrchestrateResult> {
    // User accepted the permission request, build the response
    const { attenuatedPermission, expiry: attenuatedExpiry } =
      await this.resolveAttenuatedPermission(
        validatedPermission,
        attenuatedContext,
      );

    const deleGatorEnvironment = await this.#accountController.getEnvironment({
      chainId,
    });

    const permissionContextMeta: PermissionContextMeta<TPermissionType> = {
      address,
      sessionAccount,
      chainId,
      attenuatedPermission,
      caveatBuilder: createCaveatBuilder(deleGatorEnvironment),
    };

    const [updatedCaveatBuilder, accountMeta, delegationManager] =
      await Promise.all([
        this.appendPermissionCaveats(permissionContextMeta),
        this.#accountController.getAccountMetadata({
          chainId,
        }),
        this.#accountController.getDelegationManager({
          chainId,
        }),
      ]);

    // By deferring building the caveats, we can add global caveats such as Expiry
    updatedCaveatBuilder.addCaveat(
      'timestamp',
      0, // timestampAfter
      attenuatedExpiry, // timestampBefore
    );

    const permissionContext = await this.#buildPermissionsContext({
      address,
      sessionAccount,
      caveats: updatedCaveatBuilder.build(),
      chainId,
    });

    // todo: RPC failure attempting to serialize response if accountMeta is undefined
    const accountMetaObject =
      accountMeta.factory && accountMeta.factoryData
        ? {
            accountMeta: [accountMeta],
          }
        : {};

    return {
      success: true,
      response: {
        chainId: toHex(chainId),
        address,
        expiry: attenuatedExpiry,
        isAdjustmentAllowed,
        signer: {
          type: 'account',
          data: {
            address: sessionAccount,
          },
        },
        permission: attenuatedPermission,
        context: permissionContext,
        ...accountMetaObject,
        signerMeta: {
          delegationManager,
        },
      },
    } as OrchestrateResult;
  }

  /**
   * Orchestrates the permission request.
   * @returns The orchestrate result.
   */
  public async orchestrate(): Promise<OrchestrateResult> {
    const {
      validatedPermission,
      sessionAccount,
      chainId,
      expiry,
      isAdjustmentAllowed,
    } = await this.#prepareOrchestrateArgs(this.#permissionRequest);

    // Get account details
    const [address, balance] = await this.#prepareAccountDetails(chainId);

    // Get token price
    const caipAssetType = this.getTokenCaipAssetType(
      validatedPermission,
      chainId,
    );
    const valueFormattedAsCurrency =
      await this.#tokenPricesService.getCryptoToFiatConversion(
        caipAssetType,
        balance,
      );

    // Prepare UI context
    const { state, dialogContentEventHandlers } =
      this.getConfirmationDialogEventHandlers(validatedPermission, expiry);

    const uiContext: PermissionConfirmationContext<TPermissionType> = {
      justification: validatedPermission.data.justification,
      address,
      siteOrigin: this.#origin,
      balance,
      chainId,
      expiry,
      valueFormattedAsCurrency,
      state,
      isAdjustmentAllowed,
    };

    // Create confirmation dialog
    const permissionDialog = this.buildPermissionConfirmation(uiContext);
    const { confirmationResult, interfaceId } =
      await this.#permissionConfirmationRenderHandler.createConfirmationDialog(
        uiContext,
        permissionDialog,
        this.getPermissionType(),
      );

    // Register event handlers for confirmation dialog
    if (dialogContentEventHandlers.length > 0) {
      this.#registerEventHandlers(dialogContentEventHandlers, interfaceId);
    }

    try {
      // Wait for the user to accept or reject the permission request
      const result = await confirmationResult;
      const { isConfirmationAccepted, attenuatedContext } = result;

      if (!isConfirmationAccepted) {
        return {
          success: false,
          reason: 'User rejected the permissions request',
        };
      }

      // User accepted, build response
      return await this.#buildPermissionResponse(
        validatedPermission,
        attenuatedContext,
        chainId,
        address,
        sessionAccount,
        isAdjustmentAllowed,
      );
    } finally {
      if (dialogContentEventHandlers.length > 0) {
        this.#unregisterEventHandlers(dialogContentEventHandlers, interfaceId);
      }
    }
  }

  /**
   * Updates the active interface.
   * @param interfaceId - The interface ID.
   * @param context - The permission confirmation context.
   */
  protected async updateActiveInterface(
    interfaceId: string,
    context: PermissionConfirmationContext<TPermissionType>,
  ): Promise<void> {
    const dialogContent = this.buildPermissionConfirmation(context);
    await this.#permissionConfirmationRenderHandler.updateInterface(
      interfaceId,
      context,
      dialogContent,
    );
  }
}
