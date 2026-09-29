import { createBaseManifest, type ExtensionManifest } from './base';

export default function createSafariManifest(): ExtensionManifest {
  const manifest = createBaseManifest();
  const background = { ...manifest.background };
  delete background.service_worker;
  delete background.type;

  return { ...manifest, background };
}
