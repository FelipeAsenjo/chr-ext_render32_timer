/** Messages accepted by the background application boundary. */
export const MESSAGE_TYPES = {
  ping: 'PING',
} as const;

export type ExtensionMessage = {
  readonly type: typeof MESSAGE_TYPES.ping;
};

export type ExtensionResponse = { readonly ok: true } | undefined;
