import { numberToHex } from 'viem';
import { createPermissionsRequestIterator } from '../src/iterator';
import type { PermissionRequest } from '../src/types';

describe('createPermissionsRequestIterator', () => {
  const mockPermissionsRequest: PermissionRequest[] = [
    {
      chainId: numberToHex(11155111),
      expiry: 1,
      signer: {
        type: 'account',
        data: {
          address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        },
      },
      permission: {
        type: 'native-token-transfer',
        data: {
          justification: 'shh',
          allowance: numberToHex(1),
        },
      },
    },
    {
      chainId: numberToHex(11155111),
      expiry: 1,
      signer: {
        type: 'account',
        data: {
          address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        },
      },
      permission: {
        type: 'erc20-token-transfer',
        data: {
          justification: 'shh',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          allowance: numberToHex(10000),
        },
      },
    },
    {
      chainId: numberToHex(11155111),
      expiry: 1,
      signer: {
        type: 'account',
        data: {
          address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        },
      },
      permission: {
        type: 'erc20-token-transfer',
        data: {
          justification: 'shh',
          address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
          allowance: numberToHex(100),
        },
      },
    },
  ];
  it('should create an iterator with all items defaulted to "pending" status', () => {
    const iterator = createPermissionsRequestIterator(mockPermissionsRequest);

    const items = iterator.getItems();
    expect(items).toHaveLength(3);
    items.forEach((item) => {
      expect(item.status).toBe('pending');
    });
  });

  it('should have correct length and initial pointer', () => {
    const iterator = createPermissionsRequestIterator(mockPermissionsRequest);

    expect(iterator).toHaveLength(3);
    expect(iterator.isFirst()).toBe(true);
    expect(iterator.isLast()).toBe(false);
  });

  it('should move to next and previous items correctly', () => {
    const iterator = createPermissionsRequestIterator(mockPermissionsRequest);

    expect(iterator.isFirst()).toBe(true);

    iterator.settleAndMoveNext();

    // Now at index 1
    expect(iterator.isFirst()).toBe(false);
    expect(iterator.isLast()).toBe(false);

    iterator.settleAndMoveNext();
    // Now at index 2 (last item)
    expect(iterator.isLast()).toBe(true);

    // Move to next once more should do nothing
    iterator.settleAndMoveNext();
    expect(iterator.isLast()).toBe(true);

    // Move to previous
    iterator.settleAndMovePrevious();
    // Now at index 1
    expect(iterator.isFirst()).toBe(false);
    expect(iterator.isLast()).toBe(false);

    // Move to previous again
    iterator.settleAndMovePrevious();
    // Now at index 0 (first item)
    expect(iterator.isFirst()).toBe(true);

    // Move to previous once more should do nothing
    iterator.settleAndMovePrevious();
    expect(iterator.isFirst()).toBe(true);
  });

  it('should update the current item', () => {
    const iterator = createPermissionsRequestIterator(mockPermissionsRequest);

    let items = iterator.getItems();
    for (const i of items) {
      expect(i.status).toBe('pending');
    }

    // Update the first item
    iterator.updateCurrentItem((currentItem) => ({
      ...currentItem,
      status: 'settled',
    }));

    items = iterator.getItems();
    expect(items[0]?.status).toBe('settled');
    expect(items[1]?.status).toBe('pending');
    expect(items[2]?.status).toBe('pending');
  });

  it('should do nothing if updateCurrentItem is called when there is no current item', () => {
    const iterator = createPermissionsRequestIterator([]);

    expect(iterator).toHaveLength(0);

    iterator.updateCurrentItem((currentItem) => ({
      ...currentItem,
      status: 'settled',
    }));

    expect(iterator.getItems()).toHaveLength(0);
  });

  it('should detect when all items are settled (areAllSettled)', () => {
    const iterator = createPermissionsRequestIterator(mockPermissionsRequest);
    expect(iterator.areAllSettled()).toBe(false);

    while (!iterator.areAllSettled()) {
      iterator.updateCurrentItem((item) => ({
        ...item,
        status: 'settled',
      }));
      iterator.settleAndMoveNext();
    }

    expect(iterator.areAllSettled()).toBe(true);
  });

  it('should reset to the first item when first() is called', () => {
    const iterator = createPermissionsRequestIterator(mockPermissionsRequest);

    iterator.settleAndMoveNext();
    iterator.settleAndMoveNext();
    expect(iterator.isLast()).toBe(true);

    iterator.first();
    expect(iterator.isFirst()).toBe(true);
  });
});
