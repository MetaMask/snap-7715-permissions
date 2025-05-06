import type { InputChangeEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { StateChangeHandler, TimePeriod } from '../../core/types';
import {
  AMOUNT_PER_PERIOD_ELEMENT,
  EXPIRY_ELEMENT,
  INITIAL_AMOUNT_ELEMENT,
  MAX_AMOUNT_ELEMENT,
  REMOVE_INITIAL_AMOUNT_BUTTON,
  REMOVE_MAX_AMOUNT_BUTTON,
  START_TIME_ELEMENT,
  TIME_PERIOD_ELEMENT,
} from './content';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from './types';

/**
 * Handler for updating the initial amount value in the context
 */
export const initialAmountHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.InputChangeEvent
> = {
  eventType: UserInputEventType.InputChangeEvent,
  elementName: INITIAL_AMOUNT_ELEMENT,
  contextMapper: ({
    context,
    event,
  }: {
    context: NativeTokenStreamContext;
    event: InputChangeEvent;
  }) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        initialAmount: String(event.value),
      },
    };
  },
};

/**
 * Handler for removing the initial amount value from the context
 */
export const removeInitialAmountHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.ButtonClickEvent
> = {
  eventType: UserInputEventType.ButtonClickEvent,
  elementName: REMOVE_INITIAL_AMOUNT_BUTTON,
  contextMapper: ({ context }: { context: NativeTokenStreamContext }) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        initialAmount: undefined,
      },
    };
  },
};

/**
 * Handler for updating the max amount value in the context
 */
export const maxAmountHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.InputChangeEvent
> = {
  eventType: UserInputEventType.InputChangeEvent,
  elementName: MAX_AMOUNT_ELEMENT,
  contextMapper: ({
    context,
    event,
  }: {
    context: NativeTokenStreamContext;
    event: InputChangeEvent;
  }) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        maxAmount: String(event.value),
      },
    };
  },
};

/**
 * Handler for removing the max amount value from the context
 */
export const removeMaxAmountHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.ButtonClickEvent
> = {
  eventType: UserInputEventType.ButtonClickEvent,
  elementName: REMOVE_MAX_AMOUNT_BUTTON,
  contextMapper: ({ context }: { context: NativeTokenStreamContext }) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        maxAmount: undefined,
      },
    };
  },
};

/**
 * Handler for updating the start time value in the context
 */
export const startTimeHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.InputChangeEvent
> = {
  eventType: UserInputEventType.InputChangeEvent,
  elementName: START_TIME_ELEMENT,
  contextMapper: ({
    context,
    event,
  }: {
    context: NativeTokenStreamContext;
    event: InputChangeEvent;
  }) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        startTime: String(event.value),
      },
    };
  },
};

/**
 * Handler for updating the expiry value in the context
 */
export const expiryHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.InputChangeEvent
> = {
  eventType: UserInputEventType.InputChangeEvent,
  elementName: EXPIRY_ELEMENT,
  contextMapper: ({
    context,
    event,
  }: {
    context: NativeTokenStreamContext;
    event: InputChangeEvent;
  }) => {
    return {
      ...context,
      expiry: String(event.value),
    };
  },
};

/**
 * Handler for updating the amount per period value in the context
 */
export const amountPerPeriodHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.InputChangeEvent
> = {
  eventType: UserInputEventType.InputChangeEvent,
  elementName: AMOUNT_PER_PERIOD_ELEMENT,
  contextMapper: ({
    context,
    event,
  }: {
    context: NativeTokenStreamContext;
    event: InputChangeEvent;
  }) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        amountPerPeriod: String(event.value),
      },
    };
  },
};

/**
 * Handler for updating the time period value in the context
 */
export const timePeriodHandler: StateChangeHandler<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  UserInputEventType.InputChangeEvent
> = {
  eventType: UserInputEventType.InputChangeEvent,
  elementName: TIME_PERIOD_ELEMENT,
  contextMapper: ({
    context,
    event,
  }: {
    context: NativeTokenStreamContext;
    event: InputChangeEvent;
  }) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        timePeriod: event.value as TimePeriod,
      },
    };
  },
};
