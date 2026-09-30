import type { OffscreenPort } from '../../core/ports/timer-runtime-port';
import type { BrowserApi } from '../browser/webextension-api';

const OFFSCREEN_PATH = 'src/offscreen/offscreen.html';

interface ChromeOffscreenApi {
  createDocument(parameters: {
    readonly url: string;
    readonly reasons: readonly ['WORKERS'];
    readonly justification: string;
  }): Promise<void>;
  closeDocument(): Promise<void>;
}

interface ChromeRuntimeApi {
  getContexts(filter: {
    readonly contextTypes: readonly ['OFFSCREEN_DOCUMENT'];
    readonly documentUrls: readonly string[];
  }): Promise<readonly unknown[]>;
  sendMessage(message: unknown): Promise<unknown>;
}

interface ChromeNamespace {
  readonly offscreen: ChromeOffscreenApi;
  readonly runtime: ChromeRuntimeApi;
}

let creatingDocument: Promise<void> | undefined;

function getChromeNamespace(): ChromeNamespace {
  return (globalThis as unknown as { readonly chrome: ChromeNamespace }).chrome;
}

export function createChromeOffscreen(browserApi: BrowserApi): OffscreenPort {
  const chromeApi = getChromeNamespace();

  async function getExistingContexts(): Promise<readonly unknown[]> {
    return chromeApi.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [browserApi.runtime.getURL(OFFSCREEN_PATH)],
    });
  }

  async function ensureDocument(): Promise<void> {
    if ((await getExistingContexts()).length > 0) {
      return;
    }

    if (!creatingDocument) {
      creatingDocument = chromeApi.offscreen
        .createDocument({
          url: OFFSCREEN_PATH,
          reasons: ['WORKERS'],
          justification: 'Maintain exact once-per-second badge updates while the popup is closed.',
        })
        .finally(() => {
          creatingDocument = undefined;
        });
    }

    await creatingDocument;
  }

  return {
    async start(endAtMs): Promise<void> {
      await ensureDocument();
      await chromeApi.runtime.sendMessage({ type: 'START_BADGE_UPDATES', endAtMs });
    },

    async stop(): Promise<void> {
      if ((await getExistingContexts()).length === 0) {
        return;
      }

      await chromeApi.runtime.sendMessage({ type: 'STOP_BADGE_UPDATES' });
      await chromeApi.offscreen.closeDocument();
    },
  };
}
