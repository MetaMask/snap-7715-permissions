/**
 * The kernel snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 *
 * You may be tempted to change this to the URL where your production snap is hosted, but please
 * don't. Instead, rename `.env.production.dist` to `.env.production` and set the production URL
 * there. Running `yarn build` will automatically use the production environment variables.
 */
export const kernelSnapOrigin =
  // eslint-disable-next-line no-restricted-globals
  process.env.GATSBY_KERNEL_SNAP_ORIGIN ?? `local:http://localhost:8080`;

/**
 * The gator snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 *
 * You may be tempted to change this to the URL where your production snap is hosted, but please
 * don't. Instead, rename `.env.production.dist` to `.env.production` and set the production URL
 * there. Running `yarn build` will automatically use the production environment variables.
 */
export const gatorSnapOrigin =
  // eslint-disable-next-line no-restricted-globals
  process.env.GATSBY_GATOR_SNAP_ORIGIN ?? `local:http://localhost:8081`;
