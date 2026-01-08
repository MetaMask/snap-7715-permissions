import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-styled-components'],
      },
    }),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Template Snap',
        /* eslint-disable @typescript-eslint/naming-convention */
        theme_color: '#6F4CFF',
        background_color: '#FFFFFF',
        /* eslint-enable @typescript-eslint/naming-convention */
        display: 'standalone',
        icons: [
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  envPrefix: 'VITE_',
  publicDir: 'static',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 8000,
  },
});
