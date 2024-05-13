import { app, ipcMain } from 'electron';
import { createRequire } from 'node:module';
import type { ProgressInfo, UpdateDownloadedEvent, UpdateInfo } from 'electron-updater';
import log from 'electron-log/main';

import { autoUpdater } from 'electron-updater';

// const { autoUpdater } = createRequire(import.meta.url)('electron-updater');

export function update(win: Electron.BrowserWindow) {
  autoUpdater.logger = log.scope('autoUpdater');
  // When set to false, the update download will be triggered through the API
  // For auto updating to be optimal and good, it must not be a SNAP as they auto update themselves
  // MacOS requires our app to be signed and notarized for auto updating to work
  // Which isn't happening anytime soon
  autoUpdater.autoDownload = !process.env.SNAP && process.env.container !== 'flatpak' && process.platform !== 'darwin';
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = true;

  // start check
  autoUpdater.on('checking-for-update', function () {
    autoUpdater.logger.info('Checking for update...');
  });
  // update available
  autoUpdater.on('update-available', (argument: UpdateInfo) => {
    win.webContents.send('update-can-available', {
      update: true,
      version: app.getVersion(),
      newVersion: argument?.version,
    });
  });
  // update not available
  autoUpdater.on('update-not-available', (argument: UpdateInfo) => {
    win.webContents.send('update-can-available', {
      update: false,
      version: app.getVersion(),
      newVersion: argument?.version,
    });
  });

  // Checking for updates
  ipcMain.handle('check-update', async () => {
    if (!app.isPackaged) {
      const error = new Error('The update feature is only available after the package.');
      return { message: error.message, error };
    }

    try {
      return await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      return { message: 'Network error', error };
    }
  });

  // Start downloading and feedback on progress
  ipcMain.handle('start-download', (event: Electron.IpcMainInvokeEvent) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          event.sender.send('update-error', { message: error.message, error });
        } else {
          // feedback update progress message
          event.sender.send('download-progress', progressInfo);
        }
      },
      () => {
        // feedback update downloaded message
        event.sender.send('update-downloaded');
      },
    );
  });

  // Install now
  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  autoUpdater.on('download-progress', (info: ProgressInfo) => callback(null, info));
  autoUpdater.on('error', (error: Error) => callback(error, null));
  autoUpdater.on('update-downloaded', complete);
  autoUpdater.downloadUpdate();
}
