export const KERNEL_SNAP_ID =
  // eslint-disable-next-line no-restricted-globals
  process.env.SNAP_ENV === 'production'
    ? 'npm:@metamask/permissions-kernel-snap'
    : 'local:http://localhost:8081';

export const MESSAGE_SIGNING_SNAP_ID =
  // eslint-disable-next-line no-restricted-globals
  process.env.SNAP_ENV === 'production'
    ? 'npm:@metamask/message-signing-snap'
    : 'local:http://localhost:8080';

export const GATOR_PERMISSIONS_PROVIDER_SNAP_ID =
  // eslint-disable-next-line no-restricted-globals
  process.env.SNAP_ENV === 'production'
    ? 'npm:@metamask/gator-permissions-snap'
    : 'local:http://localhost:8082';
