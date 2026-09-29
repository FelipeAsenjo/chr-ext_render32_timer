/** Messages accepted by the background application boundary. */
export const MESSAGE_TYPES = {
  getStatus: 'GET_STATUS',
  setStatus: 'SET_STATUS',
  ping: 'PING',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export type ExtensionMessage =
  | { readonly type: typeof MESSAGE_TYPES.getStatus }
  | { readonly type: typeof MESSAGE_TYPES.setStatus; readonly enabled: boolean }
  | { readonly type: typeof MESSAGE_TYPES.ping };

export type ExtensionResponse = { readonly enabled: boolean } | { readonly ok: true } | undefined;
