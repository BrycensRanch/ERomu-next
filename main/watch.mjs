/* eslint-disable unicorn/prefer-top-level-await */
import { watch } from 'chokidar';
import { join } from 'node:path';
import electron from 'electron';
import { spawn } from 'node:child_process';
import { npmRunPathEnv } from 'npm-run-path';

const { app } = electron;

let child = null;
let isRelaunching = false;
let watchingStarted = false; // Flag to track if watching has started

console.log(import.meta.url);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Use Promise for cleaner wait
const __dirname = new URL('.', import.meta.url).pathname;

const start = async () => {
  console.log(`starting... ${process.argv[0]} ${process.argv.slice(1).join(' ')}`)
  // Kill previous child process (if any)
  if (child) {
    child.kill();
  }
  child = spawn("yarn", ["electron", "."], { env: npmRunPathEnv(), stdio: 'inherit', cwd: process.cwd() });

  child.on('exit', async () => {
    child = null;
    console.log('exited, waiting 5 seconds before restarting...');
    await wait(5000);
    start();
  });
};

const startWatching = () => {
  if (watchingStarted) return; // Ensure startWatching is called only once
  watchingStarted = true;

  const watcher = watch(join(__dirname, '..', 'app', 'main'), {
    persistent: true,
    ignoreInitial: true,
    ignored: [/(^|[/\\])\../, '**/.map'], // Combined ignored patterns
  });

  watcher.on('change', async () => {
    if (isRelaunching) return; // Respect isRelaunching flag
    isRelaunching = true; // Set flag before relaunch

    console.log('Relaunching...');

    app?.quit();
    child?.kill();
    await wait(5000);
    start();
  });
};

process.on('uncaughtException', (error) => {
  console.error(error);
  child?.kill();
  console.error('bye');
  app?.quit();
});

process.on('exit', () => {
  console.log('exiting...');
  console.log('murdering child (process)');
  child?.kill();
  app?.quit();
});

export { startWatching };

// Start watching and development server when running directly
if (import.meta.url) {
  startWatching();
  start();
}
