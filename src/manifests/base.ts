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
  readonly permissions: readonly string[];
  readonly host_permissions: readonly string[];
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
    name: 'render32_timer',
    version: '0.1.0',
    description: 'Simple countdown timer',
    action: {
      default_popup: 'src/popup/popup.html',
      default_title: 'render32_timer',
    },
    background: {
      scripts: ['src/composition/background.ts'],
      service_worker: 'src/composition/background.ts',
      type: 'module',
    },
    permissions: ['storage', 'alarms'],
    host_permissions: [],
    icons: {
      16: 'icons/icon-16.svg',
      48: 'icons/icon-48.svg',
      128: 'icons/icon-128.svg',
    },
  };
}
