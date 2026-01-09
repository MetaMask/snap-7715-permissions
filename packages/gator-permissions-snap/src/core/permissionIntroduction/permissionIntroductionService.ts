import { UserInputEventType } from '@metamask/snaps-sdk';

import {
  buildIntroductionContent as buildContent,
  getPermissionIntroductionConfig,
  PERMISSION_INTRODUCTION_CONFIRM_BUTTON,
  PERMISSION_INTRODUCTION_PAGE_1_DOT,
  PERMISSION_INTRODUCTION_PAGE_2_DOT,
} from './permissionIntroductionContent';
import type { PermissionIntroductionConfig } from './types';
import type { StateManager } from '../../stateManagement';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import type { DialogInterface } from '../dialogInterface';

/**
 * Service for managing permission introduction state and dialog lifecycle.
 * Tracks which permission types have shown their introduction to the user.
 * Acts as a facade, delegating UI building to the content module.
 */
export class PermissionIntroductionService {
  readonly #stateManager: StateManager;

  readonly #userEventDispatcher: UserEventDispatcher;

  constructor({
    stateManager,
    userEventDispatcher,
  }: {
    stateManager: StateManager;
    userEventDispatcher: UserEventDispatcher;
  }) {
    this.#stateManager = stateManager;
    this.#userEventDispatcher = userEventDispatcher;
  }

  /**
   * Checks if the introduction should be shown for a given permission type.
   * @param permissionType - The permission type to check.
   * @returns True if the introduction has not been shown yet for this permission type.
   */
  async shouldShowIntroduction(permissionType: string): Promise<boolean> {
    const state = await this.#stateManager.getState();
    return !state.seenPermissionIntroductions.includes(permissionType);
  }

  /**
   * Marks the introduction as seen for a given permission type.
   * @param permissionType - The permission type to mark as seen.
   */
  async markIntroductionAsSeen(permissionType: string): Promise<void> {
    const state = await this.#stateManager.getState();
    const seenIntroductions = state.seenPermissionIntroductions;

    if (!seenIntroductions.includes(permissionType)) {
      await this.#stateManager.setState({
        ...state,
        seenPermissionIntroductions: [...seenIntroductions, permissionType],
      });
    }
  }

  /**
   * Builds the introduction content UI for display in the dialog.
   * Delegates to the content module for actual UI construction.
   * @param config - The configuration for the introduction content.
   * @param currentPage - The current page to display (1 or 2). Defaults to 1.
   * @returns The introduction UI as a JSX.Element.
   */
  buildIntroductionContent(
    config: PermissionIntroductionConfig,
    currentPage: 1 | 2 = 1,
  ): JSX.Element {
    return buildContent(config, currentPage);
  }

  /**
   * Shows the introduction content with 2-page navigation and waits for user to dismiss it.
   * Uses the provided DialogInterface to display content and manage the dialog.
   * @param options - The options object.
   * @param options.dialogInterface - The dialog interface to use for displaying content.
   * @param options.permissionType - The permission type to show introduction for.
   * @returns Object with wasCancelled flag indicating if user dismissed the intro.
   */
  async showIntroduction({
    dialogInterface,
    permissionType,
  }: {
    dialogInterface: DialogInterface;
    permissionType: string;
  }): Promise<{ wasCancelled: boolean }> {
    const config = getPermissionIntroductionConfig(permissionType);
    if (!config) {
      return { wasCancelled: false };
    }

    // Start on page 1
    let currentPage: 1 | 2 = 1;

    // Track unbind functions to clean up all handlers
    const unbindFunctions: (() => void)[] = [];

    // Helper to unbind all handlers
    const unbindAll = (): void => {
      unbindFunctions.forEach((fn) => fn());
    };

    // Wait for user to click "Got it" or dismiss the dialog
    const wasConfirmed = await new Promise<boolean>((resolve) => {
      // Show intro content - this creates interface and shows dialog on first call
      const introContent = this.buildIntroductionContent(config, currentPage);

      // Helper to setup handlers after dialog is shown
      const setupHandlers = (interfaceId: string): string => {
        // Helper to update the interface with a new page
        const updatePage = async (newPage: 1 | 2): Promise<void> => {
          if (newPage === currentPage) {
            return;
          }
          currentPage = newPage;
          const newContent = this.buildIntroductionContent(config, currentPage);
          await dialogInterface.show(newContent);
        };

        // Handler for "Got it" button
        const { unbind: unbindConfirm } = this.#userEventDispatcher.on({
          elementName: PERMISSION_INTRODUCTION_CONFIRM_BUTTON,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: async () => {
            unbindAll();
            resolve(true); // User confirmed
          },
        });
        unbindFunctions.push(unbindConfirm);

        // Handler for page 1 dot
        const { unbind: unbindPage1Dot } = this.#userEventDispatcher.on({
          elementName: PERMISSION_INTRODUCTION_PAGE_1_DOT,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: async () => {
            await updatePage(1);
          },
        });
        unbindFunctions.push(unbindPage1Dot);

        // Handler for page 2 dot
        const { unbind: unbindPage2Dot } = this.#userEventDispatcher.on({
          elementName: PERMISSION_INTRODUCTION_PAGE_2_DOT,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: async () => {
            await updatePage(2);
          },
        });
        unbindFunctions.push(unbindPage2Dot);
        return interfaceId;
      };

      // The onClose handler is registered with DialogInterface
      // When dialog is closed (X button), this handler fires
      dialogInterface
        .show(introContent, () => {
          unbindAll();
          resolve(false); // User cancelled via X button
        })
        .then(setupHandlers)
        .catch(() => {
          unbindAll();
          resolve(false); // Error = treat as cancelled
        });
    });

    return { wasCancelled: !wasConfirmed };
  }
}
