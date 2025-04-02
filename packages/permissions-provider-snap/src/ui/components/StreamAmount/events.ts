import { logger } from '@metamask/7715-permissions-shared/utils';
import type { ButtonClickEvent, UserInputEventType } from '@metamask/snaps-sdk';

import type { SupportedPermissionTypes } from '../../../orchestrators';
import type { UserEventHandler } from '../../../userEventDispatcher';
import type { PermissionConfirmationContext } from '../../types';
import { StreamAmountEventNames } from './StreamAmount';

/**
 * Handles the event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 */
const onStreamAmountClick: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  attenuatedContext,
}: {
  event: ButtonClickEvent;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
}) => {
  logger.debug(
    `Handling onStreamAmountClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
};

/**
 * Handles the event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 */
const onPeriodClick: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  attenuatedContext,
}: {
  event: ButtonClickEvent;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
}) => {
  logger.debug(
    `Handling onPeriodClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
};

export const streamAmountEventHandlers = {
  [StreamAmountEventNames.StreamAmount]: onStreamAmountClick,
  [StreamAmountEventNames.Period]: onPeriodClick,
};
