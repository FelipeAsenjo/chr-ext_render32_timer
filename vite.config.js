import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import createChromeManifest from './src/manifests/chrome.ts';
import createFirefoxManifest from './src/manifests/firefox.ts';
import createSafariManifest from './src/manifests/safari.ts';

const manifests = {
  chrome: createChromeManifest,
  firefox: createFirefoxManifest,
  safari: createSafariManifest,
};

export default defineConfig(({ mode }) => ({
  plugins: [crx({ manifest: (manifests[mode] ?? manifests.chrome)() })],
  build: {
    outDir: `dist/${mode}`,
    emptyOutDir: true,
  },
}));
