import type { IpcHandler } from '../main/preload';

declare global {
  interface Window {
    ipc: IpcHandler;
    applicationVersion: string;
    isProduction: boolean;
    TRANSPARENT_TELEMETRY: boolean;
    electron: {
      store: {
        get: (key: string) => any;
        set: (key: string, val: any) => void;
        // any other methods you've defined...
      };
    };
  }
}
