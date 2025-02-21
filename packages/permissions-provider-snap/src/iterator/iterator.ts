import type {
  PermissionRequest,
  PermissionsRequest,
} from '@metamask/7715-permissions-shared/types';

export type PermissionRequestIteratorItem = {
  permissionRequest: PermissionRequest;
  status: 'pending' | 'settled';
};

export type PermissionsRequestIterator = {
  /**
   * Moves to the first item in the collection.
   */
  first: () => void;

  /**
   * Settles the current item and advances to the next item in the collection.
   * If already at the last item, it does nothing.
   */
  settleAndMoveNext: () => void;

  /**
   * Settles the current item and and moves to the previous item in the collection.
   * If already at the first item, it does nothing.
   */
  settleAndMovePrevious: () => void;

  /**
   * Checks if the iterator is at the first item.
   */
  isFirst: () => boolean;

  /**
   * Checks if the iterator is at the last item.
   */
  isLast: () => boolean;

  /**
   * Checks if all items in the collection are settled.
   */
  areAllSettled: () => boolean;

  /**
   * Returns the entire collection of items.
   */
  getItems: () => PermissionRequestIteratorItem[];

  /**
   * Returns the current item in the collection.
   */
  currentItem: () => PermissionRequestIteratorItem | null;

  /**
   * Returns the index of the current item in the collection.
   */
  currentIndex: () => number;

  /**
   * Updates the current item using the provided updater function.
   * If there is not a current item, it does nothing.
   */
  updateCurrentItem: (
    updater: (
      item: PermissionRequestIteratorItem,
    ) => PermissionRequestIteratorItem,
  ) => void;

  /**
   * The number of items in the collection.
   */
  length: number;
};

/**
 * Creates a new permissions request iterator. Supports bidirectional traversal of a collection of permission requests. Items default status is 'pending' on creation.
 *
 * @param permissionsRequest - The collection of permission requests to iterate over.
 * @returns A new permissions request iterator.
 * @example
 *  const permissionsRequest = [...];
 * const iterator = createPermissionsRequestIterator(permissionsRequest);
 * iterator.first();
 * while(!iterator.areAllSettled()) {
 *   iterator.updateCurrentItem((item: PermissionRequestIteratorItem) => {
 *    return { ...item, status: 'settled' };
 *   });
 *
 *  iterator.next();
 * }
 * console.log('iterator done:', iterator.getItems());
 */
export const createPermissionsRequestIterator = (
  permissionsRequest: PermissionsRequest,
): PermissionsRequestIterator => {
  let index = 0;
  const items: PermissionRequestIteratorItem[] = permissionsRequest.map(
    (permissionRequest) => ({
      permissionRequest,
      status: 'pending',
    }),
  );

  return {
    length: items.length,

    getItems(): PermissionRequestIteratorItem[] {
      return items;
    },

    currentItem(): PermissionRequestIteratorItem | null {
      const item = items[index];
      return item ?? null;
    },

    currentIndex() {
      return index;
    },

    first() {
      index = 0;
    },

    settleAndMoveNext(): void {
      if (!this.isLast()) {
        const item = items[index];
        if (item) {
          items[index] = { ...item, status: 'settled' };
        }
        index += 1;
      }
    },

    settleAndMovePrevious(): void {
      if (!this.isFirst()) {
        const item = items[index];
        if (item) {
          items[index] = { ...item, status: 'settled' };
        }
        index -= 1;
      }
    },

    isFirst(): boolean {
      return index === 0;
    },

    isLast(): boolean {
      return index === items.length - 1;
    },

    areAllSettled(): boolean {
      return items.every((request) => request.status === 'settled');
    },

    updateCurrentItem(
      updater: (
        item: PermissionRequestIteratorItem,
      ) => PermissionRequestIteratorItem,
    ) {
      const currentItem = items[index];
      if (currentItem) {
        items[index] = updater(currentItem);
      }
    },
  };
};
