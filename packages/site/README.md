# TypeScript Example Snap Front-end

This project uses [Vite](https://vitejs.dev/) with React and TypeScript.

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:8000](http://localhost:8000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `yarn preview`

Locally preview the production build.

## Environment variables

Vite has built-in support for loading environment variables. Environment variables must be prefixed with `VITE_` to be exposed to the client.

In development, Vite will load environment variables from a file named `.env.development`. For builds, it will load from `.env.production`. You can also use `.env` for variables shared across all modes.

By default you can use the `VITE_KERNEL_SNAP_ORIGIN` and `VITE_GATOR_SNAP_ORIGIN` variables (used in `src/config/snap.ts`) to define a production origin for your snap (eg. `npm:MyPackageName`). If not defined it will default to `local:http://localhost:8081` and `local:http://localhost:8082`.

To learn more visit [Vite documentation on environment variables](https://vitejs.dev/guide/env-and-mode.html)

## Learn More

You can learn more in the [Vite documentation](https://vitejs.dev/).

To learn React, check out the [React documentation](https://reactjs.org/).
