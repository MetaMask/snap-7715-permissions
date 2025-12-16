import type { SnapsProvider } from '@metamask/snaps-sdk';
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

/**
 * Service for managing permission introduction state and dialog lifecycle.
 * Tracks which permission types have shown their introduction to the user.
 * Acts as a facade, delegating UI building to the content module.
 */
export class PermissionIntroductionService {
  readonly #stateManager: StateManager;

  readonly #snap: SnapsProvider;

  readonly #userEventDispatcher: UserEventDispatcher;

  constructor({
    stateManager,
    snap,
    userEventDispatcher,
  }: {
    stateManager: StateManager;
    snap: SnapsProvider;
    userEventDispatcher: UserEventDispatcher;
  }) {
    this.#stateManager = stateManager;
    this.#snap = snap;
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
   * Creates the interface and dialog, returning the interface ID for reuse.
   * @param permissionType - The permission type to show introduction for.
   * @returns Object with interfaceId (if intro was shown) and wasCancelled flag.
   */
  async showIntroduction(permissionType: string): Promise<{
    interfaceId: string | undefined;
    wasCancelled: boolean;
  }> {
    const config = getPermissionIntroductionConfig(permissionType);
    if (!config) {
      return { interfaceId: undefined, wasCancelled: false };
    }

    // Start on page 1
    let currentPage: 1 | 2 = 1;

    const introContent = this.buildIntroductionContent(config, currentPage);

    // Create interface with intro content (page 1)
    const interfaceId = await this.#snap.request({
      method: 'snap_createInterface',
      params: {
        ui: introContent,
      },
    });

    // Helper to update the interface with a new page
    const updatePage = async (newPage: 1 | 2) => {
      if (newPage === currentPage) {
        return;
      }
      currentPage = newPage;
      const newContent = this.buildIntroductionContent(config, currentPage);
      await this.#snap.request({
        method: 'snap_updateInterface',
        params: {
          id: interfaceId,
          ui: newContent,
        },
      });
    };

    // Wait for user to click "Got it" or dismiss the dialog
    // Returns true if user confirmed, false if cancelled
    const wasConfirmed = await new Promise<boolean>((resolve) => {
      // Track unbind functions to clean up all handlers
      const unbindFunctions: (() => void)[] = [];

      // Helper to unbind all handlers
      const unbindAll = () => {
        unbindFunctions.forEach((fn) => fn());
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

      // Show the dialog (don't await - we resolve via button handler)
      this.#snap
        .request({
          method: 'snap_dialog',
          params: {
            id: interfaceId,
          },
        })
        .then((result) => {
          // Dialog closed via Cancel or clicking outside
          if (result === null) {
            unbindAll();
            resolve(false); // User cancelled
          }
        })
        .catch(() => {
          unbindAll();
          resolve(false); // Error = treat as cancelled
        });
    });

    // If user cancelled, the interface is destroyed by snap_dialog
    // Return undefined interfaceId so a new one is created
    if (!wasConfirmed) {
      return { interfaceId: undefined, wasCancelled: true };
    }

    return { interfaceId, wasCancelled: false };
  }
}
