import type Browser from 'webextension-polyfill';
import type { ExtensionMessage, ExtensionResponse } from '../../core/ports/message-port';

export interface MessagingPort {
  send(message: ExtensionMessage): Promise<ExtensionResponse>;
  onMessage(handler: MessageHandler): void;
}

export type MessageHandler = (
  message: ExtensionMessage,
  sender: Browser.Runtime.MessageSender,
) => Promise<ExtensionResponse>;

/**
 * Adapts the callback-shaped runtime listener to the Promise-based port.
 * Returning true keeps the response channel open in browsers that require it.
 */
export function createWebExtensionMessaging(browserApi: typeof Browser): MessagingPort {
  return {
    send(message: ExtensionMessage): Promise<ExtensionResponse> {
      return browserApi.runtime.sendMessage<ExtensionMessage, ExtensionResponse>(message);
    },

    onMessage(handler: MessageHandler): void {
      browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
        void handler(message as ExtensionMessage, sender)
          .then((response) => sendResponse(response))
          .catch(() => sendResponse(undefined));
        return true;
      });
    },
  };
}
