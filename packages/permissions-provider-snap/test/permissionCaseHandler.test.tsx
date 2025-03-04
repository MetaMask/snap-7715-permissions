import type {
  NativeTokenStreamPermission,
  NativeTokenTransferPermission,
} from '@metamask/7715-permissions-shared/types';

import type {
  PermissionCaseHandler,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import { handlePermissionCase } from '../src/utils';

describe('Generic dispatcher for permission cases', () => {
  describe('handlePermissionCase - boolean return type', () => {
    const caseHandlers: PermissionCaseHandler<
      SupportedPermissionTypes,
      boolean
    > = {
      'native-token-stream': (_per) => {
        return true;
      },
      'native-token-transfer': (_per) => {
        return false;
      },
    };

    const nativeTokenStreamPermission: NativeTokenStreamPermission = {
      type: 'native-token-stream',
      data: {
        justification: 'shh...permission 2',
      },
    };
    const nativeTokenTrasnferPermission: NativeTokenTransferPermission = {
      type: 'native-token-transfer',
      data: {
        justification: 'shh...permission 2',
        allowance: '0x0',
      },
    };

    it('should execute the correct handler based on the permission type', async () => {
      const res1 = handlePermissionCase(
        nativeTokenStreamPermission,
        caseHandlers,
        'Permission not supported',
      );

      const res2 = handlePermissionCase(
        nativeTokenTrasnferPermission,
        caseHandlers,
        'Permission not supported',
      );

      expect(res1).toStrictEqual(true);
      expect(res2).toStrictEqual(false);
    });

    it('should throw error when no handler is found for a permission type', () => {
      const nonSupportedPermission = {
        ...nativeTokenStreamPermission,
        type: 'non-supported-permission',
      };
      expect(() =>
        handlePermissionCase(
          nonSupportedPermission as any,
          caseHandlers,
          'Permission not supported',
        ),
      ).toThrow('Permission not supported');
    });
  });
});
