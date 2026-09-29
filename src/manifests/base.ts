export interface ExtensionManifest {
  readonly manifest_version: 3;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly action: {
    readonly default_popup: string;
    readonly default_title: string;
  };
  readonly background: {
    readonly scripts?: readonly string[];
    readonly service_worker?: string;
    readonly type?: 'module';
  };
  readonly options_page: string;
  readonly permissions: readonly string[];
  readonly host_permissions: readonly string[];
  readonly content_scripts: readonly {
    readonly matches: readonly string[];
    readonly js: readonly string[];
    readonly run_at: 'document_idle';
  }[];
  readonly icons: Readonly<Record<number, string>>;
  readonly browser_specific_settings?: {
    readonly gecko: {
      readonly id: string;
      readonly strict_min_version: string;
    };
  };
}

export function createBaseManifest(): ExtensionManifest {
  return {
    manifest_version: 3,
    name: 'Cross-Browser Extension Starter',
    version: '0.1.0',
    description: 'A small, modern starting point for cross-browser extensions.',
    action: {
      default_popup: 'src/popup/popup.html',
      default_title: 'Cross-Browser Extension Starter',
    },
    background: {
      scripts: ['src/composition/background.ts'],
      service_worker: 'src/composition/background.ts',
      type: 'module',
    },
    options_page: 'src/options/options.html',
    permissions: ['storage'],
    host_permissions: [],
    content_scripts: [
      {
        matches: ['https://example.com/*'],
        js: ['src/content/content.ts'],
        run_at: 'document_idle',
      },
    ],
    icons: {
      16: 'icons/icon-16.svg',
      48: 'icons/icon-48.svg',
      128: 'icons/icon-128.svg',
    },
  };
}
