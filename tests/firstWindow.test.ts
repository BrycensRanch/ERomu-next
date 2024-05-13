import { _electron as electron, ElectronApplication, Page } from 'playwright';
import { test, expect } from '@playwright/test';

// Define async function to wait for a certain amount of time

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('First Window Tests', async () => {
  let electronApp: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['app/background.js', 'test'],
    });
    await wait(5000);
    // await electron.ready();
    firstWindow = await electronApp.firstWindow();
  });

  test('Check if first window opened', async () => {
    const windowState: {
      isVisible: boolean;
      isDevToolsOpened: boolean;
      isCrashed: boolean;
    } = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];

      const getState = () => ({
        isVisible: mainWindow.isVisible(),
        isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
        isCrashed: mainWindow.webContents.isCrashed(),
      });

      return new Promise(resolve => {
        if (mainWindow.isVisible()) {
          resolve(getState());
        } else {
          mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
        }
      });
    });
    console.log(windowState);
    await expect(windowState.isVisible).toBeTruthy();
    await expect(windowState.isDevToolsOpened).toBeFalsy();
    await expect(windowState.isCrashed).toBeFalsy();
  });
  test('Check title of first window', async () => {
    const fwtitle = await firstWindow.title();
    console.log(`The title of the first window is: ${fwtitle}`);
    await expect(fwtitle).toBeTruthy();
  });
  test.afterAll(async () => {
    await electronApp.close();
  });
});
