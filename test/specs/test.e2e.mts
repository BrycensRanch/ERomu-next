/* eslint-disable unicorn/no-await-expression-member */
/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable no-promise-executor-return */
import { browser } from '@wdio/globals';
import fs from 'node:fs';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// We need to wait 5 seconds for the application to start up
describe('Electron Testing', () => {
  before(async () => {
    await wait(10_000);
  });
  it('should print application title', async () => {
    expect((await browser.getTitle()).toLowerCase()).toContain('rokon');
    // take a screenshot
    const screenshot = await browser.takeScreenshot();
    // save the screenshot as a file
    fs.writeFileSync('test.png', screenshot, 'base64');
  });
  it('should print application metadata', async () => {
    expect(await browser.electron.execute(electron => electron.app.getName())).toBe('rokon');
    expect(await browser.electron.execute(electron => electron.app.getVersion())).toBe('1.0.0');
  });
});
