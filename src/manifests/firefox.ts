import { createBaseManifest, type ExtensionManifest } from './base';

export default function createFirefoxManifest(): ExtensionManifest {
  const manifest = createBaseManifest();
  const background = { ...manifest.background };
  delete background.service_worker;
  delete background.type;

  return {
    ...manifest,
    background,
    browser_specific_settings: {
      gecko: {
        id: 'extension@example.com',
        strict_min_version: '121.0',
      },
    },
  };
}
