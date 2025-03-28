import { requestDetailsButtonEventHandlers } from './components';

export * from './handler';
export * from './types';

/**
 * Event handlers for shared components.
 * These event handlers are used in multiple permission confirmation dialogs.
 */
export const sharedComponentsEventHandlers = [
  ...requestDetailsButtonEventHandlers,
];
