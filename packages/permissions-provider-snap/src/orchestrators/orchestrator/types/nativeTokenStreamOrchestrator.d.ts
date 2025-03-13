import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';

declare module './types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface PermissionTypeMapping {
    'native-token-stream': JsonObject & NativeTokenStreamPermission; // JsonObject & NativeTokenStreamPermission to be compatible with the Snap JSON object type
  }
}
