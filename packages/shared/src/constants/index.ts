export const KERNEL_SNAP_ID =
  // eslint-disable-next-line no-restricted-globals
  process.env.SNAP_ENV === 'production'
    ? 'npm:@metamask/permissions-kernel'
    : 'local:http://localhost:8080';
