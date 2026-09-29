import { createBaseManifest, type ExtensionManifest } from './base';

export default function createChromeManifest(): ExtensionManifest {
  const manifest = createBaseManifest();
  const background = { ...manifest.background };
  delete background.scripts;

  return { ...manifest, background };
}
