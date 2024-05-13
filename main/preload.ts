import { app, contextBridge, ipcMain, ipcRenderer, IpcRendererEvent } from 'electron';
import fs from 'node:fs';
import syncFs from 'node:fs';
import path, { join } from 'node:path';
// @ts-ignore
import('wdio-electron-service/preload');
function findFileSync(filename: string, startdir = process.cwd(), maxDepth = 4) {
  let currentDepth = 0;
  while (currentDepth < maxDepth) {
    if (fs.readdirSync(startdir).includes(filename)) {
      // Found the file, return its full path
      return path.join(startdir, filename);
    }
    if (startdir === '/') {
      // Reached root directory, file not found
      return null;
    }
    startdir = path.normalize(path.join(startdir, '..'));
    currentDepth++;
  }
  // Reached max depth limit, file not found
  throw new Error(`File not found: ${filename}`);
}

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  on(channel: string, callback: (...arguments_: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...arguments_: unknown[]) => callback(...arguments_);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};
contextBridge.exposeInMainWorld('electron', {
  store: {
    get(key: string) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property: string, value: unknown) {
      ipcRenderer.send('electron-store-set', property, value);
    },
    // Other method you want to add like has(), reset(), etc.
  },
  // Any other methods you want to expose in the window object.
  // ...
});

// ipcMain.on('new-roku', (_event, ip) => {
//     console.log('Roku added to connectedRokus')
//     console.log(ip)
//     _event.sender.send('new-roku', ip)
//     ipcRenderer.send('new-roku', ip)
// })
// @ts-ignore
handler.invoke = ipcRenderer.invoke;
// @ts-ignore
handler.off = ipcRenderer.off;

console.log('I am the preload');

// Read the filesystem and look for the package.json

const filePath = findFileSync('package.json', undefined, 3);

if (!filePath) {
  throw new Error('Could not find package.json');
}

contextBridge.exposeInMainWorld('applicationVersion', JSON.parse(syncFs.readFileSync(filePath, 'utf8')).version);
contextBridge.exposeInMainWorld('TRANSPARENT_TELEMETRY', process.env.TRANSPARENT_TELEMETRY === 'true');
contextBridge.exposeInMainWorld('isProduction', process.env.NODE_ENV === 'production');
contextBridge.exposeInMainWorld('ipc', handler);
contextBridge.exposeInMainWorld('ipcRenderer', handler);

export type IpcHandler = typeof handler;
