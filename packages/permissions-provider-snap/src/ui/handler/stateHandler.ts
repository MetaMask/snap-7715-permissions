import type {
  SupportedPermissionTypes,
  PermissionConfirmationStateMapping,
} from '../../orchestrators';
import type { PermissionConfirmationContext, State } from '../types';

/**
 * Selector function type that takes the state and returns a specific value from the state.
 */
export type StateSelectorFn<TPermissionType extends SupportedPermissionTypes> =
  (
    state: State<TPermissionType>,
  ) => PermissionConfirmationStateMapping[TPermissionType][string] | undefined;

/**
 * Receives a context object, and returns a new context object updated with the value identified
 * by the specified `key` within the context object, replaced with the value returned from the specified `selector`.
 *
 * @param key - The key in the state to update.
 * @param selector - The selector function that takes the current state and returns the new value for the key.
 * @returns A function that takes the current state and returns a new state with the updated value for the specified key.
 */
export const updateContextStateHandler = <
  TPermissionType extends SupportedPermissionTypes,
>(
  key: string,
  selector: StateSelectorFn<TPermissionType>,
) => {
  return (context: PermissionConfirmationContext<TPermissionType>) => {
    if (!context.state[key]) {
      return context;
    }

    const updatedContext: PermissionConfirmationContext<TPermissionType> = {
      ...context,
      state: {
        ...context.state,
        [key]: selector(context.state),
      },
    };

    return updatedContext;
  };
};
