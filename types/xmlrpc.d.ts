declare module 'xmlrpc' {
  interface ClientOptions {
    host: string;
    port?: number | string;
    path?: string;
  }
  type Callback<T = any> = (err: any, value: T) => void;
  interface Client {
    methodCall<T = any>(method: string, params: any[], cb: Callback<T>): void;
  }
  export function createClient(opts: ClientOptions): Client;
  export function createSecureClient(opts: ClientOptions): Client;
  const _default: {
    createClient: typeof createClient;
    createSecureClient: typeof createSecureClient;
  };
  export default _default;
}
