import type Browser from 'webextension-polyfill';
export interface MessagingPort {
  send<TResponse>(message: unknown): Promise<TResponse>;
  onMessage(handler: MessageHandler): void;
}

export type MessageHandler = (
  message: unknown,
  sender: Browser.Runtime.MessageSender,
) => Promise<unknown>;

/**
 * Adapts the callback-shaped runtime listener to the Promise-based port.
 * Returning true keeps the response channel open in browsers that require it.
 */
export function createWebExtensionMessaging(browserApi: typeof Browser): MessagingPort {
  return {
    send<TResponse>(message: unknown): Promise<TResponse> {
      return browserApi.runtime.sendMessage<unknown, TResponse>(message);
    },

    onMessage(handler: MessageHandler): void {
      browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
        void handler(message, sender)
          .then((response) => sendResponse(response))
          .catch(() => sendResponse(undefined));
        return true;
      });
    },
  };
}
