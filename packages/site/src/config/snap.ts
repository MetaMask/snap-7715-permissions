/**
 * The kernel snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 *
 * You may be tempted to change this to the URL where your production snap is hosted, but please
 * don't. Instead, create a `.env.production` file and set VITE_KERNEL_SNAP_ORIGIN there.
 * Running `yarn build` will automatically use the production environment variables.
 */
export const kernelSnapOrigin =
  import.meta.env.VITE_KERNEL_SNAP_ORIGIN ?? `local:http://localhost:8081`;

/**
 * The gator snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 *
 * You may be tempted to change this to the URL where your production snap is hosted, but please
 * don't. Instead, create a `.env.production` file and set VITE_GATOR_SNAP_ORIGIN there.
 * Running `yarn build` will automatically use the production environment variables.
 */
export const gatorSnapOrigin =
  import.meta.env.VITE_GATOR_SNAP_ORIGIN ?? `local:http://localhost:8082`;
