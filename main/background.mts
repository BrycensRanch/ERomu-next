/* eslint-disable no-unused-expressions */

import path, { join } from 'node:path';
import {
  app,
  BrowserWindow,
  Notification,
  shell,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  // ipcRenderer,
  // contextBridge,
  // Rectangle,
} from 'electron';
import { release } from 'node:os';
import Store from 'electron-store';

import ssdp from 'node-ssdp';
// TODO: Make a small window that allows Neovim mode to be accessed from the taskbar instead
// Will have to mimic native tray functionality

// import {discoverRokus, sendButtonPress} from './roku'
import fs from 'node:fs/promises';
import serve from 'electron-serve';
import contextMenu from 'electron-context-menu';
import * as Sentry from '@sentry/electron';
import upnp from 'node-upnp-utils';
import lodash from 'lodash';
import { initialize, trackEvent } from '@aptabase/electron/main';
import log from 'electron-log/main.js';

import machineId from 'node-machine-uid';
import ROKU from 'rokujs';
import * as os from 'node:os';
import {
  electronBreadcrumbsIntegration,
  electronMinidumpIntegration,
  electronNetIntegration,
} from '@sentry/electron/main';
import axios from 'axios';

import { XMLParser } from 'fast-xml-parser';

import * as AxiosLogger from 'axios-logger';
import { setGlobalConfig } from 'axios-logger';
import { promisify } from 'node:util';
import osName from 'os-name';
import getOS from 'getos';
import { update } from './update.js';
import { createWindow } from './helpers/index.js';
// import startWatching from './watch.mjs';
import aboutWindow from 'electron-about-window';
const openAboutWindow = aboutWindow.default;

const { Client } = ssdp;
const { camelCase } = lodash;

const promiseGetOS = promisify(getOS);

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// const __filename = path.basename(new URL(import.meta.url).pathname);

// import { Client as DiscordRPCClient } from '@xhayper/discord-rpc';

// const rpc = new DiscordRPCClient({
//   clientId: '412367442128535552',
// });

// rpc.on('ready', () => {
//   log.log('Discord RPC is ready!');
//   rpc.user?.setActivity({
//     state: 'Controlling Roku TV',
//     details: 'Using Rokon',
//     startTimestamp: Date.now(),
//     largeImageKey: 'rokon',
//     largeImageText: 'Rokon',
//     smallImageKey: 'roku',
//     smallImageText: 'Roku',
//   });

//   console.log('Logged in as'Romvnly Playz
// , rpc.application);
//   console.log('Authed for user', rpc.user);
// });

// rpc.login();

// Optional, initialize the logger for any renderer process
log.initialize();
log.log('Logger initialized');
const telemetryLogger = log.scope('telemetry');

// Check if the application is running in AppImageHub with firejail (sandboxing)
// If it is, NEVER show the disclaimer
let couldPossiblyBeAppImageHub = false;

const camelizeKeys = (object: unknown) => {
  if (Array.isArray(object)) {
    return object.map(v => camelizeKeys(v));
  }
  if (object !== undefined && object !== null && object.constructor === Object && typeof object === 'object') {
    return Object.fromEntries(Object.keys(object).map(key => [camelCase(key), camelizeKeys(object[key])]));
  }
  return object;
};
if (process.env.NODE_ENV === 'test' || process.argv.includes('--test')) {
  import('wdio-electron-service/main');
}
// if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
//   startWatching();
// }
export type GeneralSettings = {
  gpuAcceleration: boolean;
  sessionReplay: boolean;
  telemetry: boolean;
  knownRokus: {
    address: string;
    headers: Record<string, string>;
    description?: Record<string, string>;
  }[];
  machineId: string;
  numberOfRuns: number;
  minutesActive: number;
  hasBeenShownDisclaimer: boolean;
  previousVersionMetadata: Record<never, never>[];
  hasAcknowledgedUpdate: boolean;
};
const store = new Store<GeneralSettings>({
  name: `general-settings`,
  defaults: {
    gpuAcceleration: true,
    sessionReplay: false,
    // Everyone loves telemetry, right?
    telemetry: true,
    knownRokus: [],
    machineId: await machineId(),
    // Function down the line will increment this
    numberOfRuns: 0,
    minutesActive: 0,
    hasBeenShownDisclaimer: false,
    previousVersionMetadata: [],
    hasAcknowledgedUpdate: false,
  },
});
log.info(`Machine ID: ${store.get('machineId')}`);
switch (process.platform) {
  case 'linux': {
    log.log(
      `Running on Linux ${os.release()} ${os.arch()} with ${process.env.XDG_CURRENT_DESKTOP} ${process.env.DESKTOP_SESSION} ${process.env.XDG_CURRENT_DESKTOP.toLowerCase() === 'kde' ? process.env.KDE_SESSION_VERSION : ''} and ${process.env.XDG_SESSION_TYPE}`,
    );
    trackEvent('linux_run', {
      release: os.release(),
      arch: os.arch(),
      desktop: process.env.XDG_CURRENT_DESKTOP || 'unknown',
      sessionType: process.env.XDG_SESSION_TYPE || 'unknown',
    });
    // The order of the checks are very important
    if (process.env.container?.toLowerCase() === 'flatpak') {
      log.log('Running from a Flatpak');
      trackEvent('flatpak_run', {
        flatpak: process.env.container,
        flatpakVersion: app.getVersion(),
      });
    } else if (process.env.SNAP) {
      log.log('Running from a Snap');
      trackEvent('snap_run', {
        snap: process.env.SNAP,
        snapVersion: app.getVersion(),
      });
    } else if (process.env.APPIMAGE || process.env.APPDIR?.startsWith('/tmp/.mount_')) {
      log.log('Running from an AppImage');
      if (
        process.env.APPIMAGE?.toLowerCase().includes('/run/firejail') ||
        process.env.APPDIR.startsWith('/run/firejail')
      ) {
        log.log('Running from an AppImage with firejail');
        couldPossiblyBeAppImageHub = true;
        // With both of these disabled, the application should be fine for AppImageHub
        // Telemetry is disabled because I don't want AppImageHub to delude our telemetry data.
        // Of course, AppImageHub users are still apart of the telemetry by default unless they run the application with Firejail, which triggers this condition
        store.set('hasBeenShownDisclaimer', true);
        store.set('telemetry', false);
      }
      trackEvent('appimage_run', {
        appimage: process.env.APPIMAGE || process.env.APPDIR,
        appimageVersion: app.getVersion(),
        firejail: couldPossiblyBeAppImageHub,
        desktopIntegration: process.env.DESKTOPINTEGRATION,
      });
    } else if (app.isPackaged) {
      log.log('Running from a native package');
      trackEvent('native_run', {
        nativeVersion: app.getVersion(),
        path: process.argv[0],
      });
    }
    break;
  }
  case 'win32': {
    log.log(`Running on Windows ${os.release()} ${os.arch()} with ${process.env.WINDOWS_TRACING_FLAGS}`);
    if (process.env.PORTABLE_EXECUTABLE_FILE) log.log('Running from a portable executable');
    if (process.windowsStore) log.log('Running from the Microsoft Store');
    trackEvent('windows_run', {
      release: os.release(),
      arch: os.arch(),
      tracingFlags: process.env.WINDOWS_TRACING_FLAGS,
      version: app.getVersion(),
      portableExecutable: process.env.PORTABLE_EXECUTABLE_FILE,
      store: process.windowsStore,
    });
    break;
  }
  case 'darwin': {
    log.log(`Running on macOS ${os.release()} ${os.arch()} with ${process.env.XPC_FLAGS}`);
    if (process.mas) log.log('Running from the Mac App Store');
    trackEvent('macos_run', {
      release: os.release(),
      arch: os.arch(),
      mas: process.mas,
      version: app.getVersion(),
      path: process.argv[0],
    });
    break;
  }
  default: {
    log.warn(
      `Unsupported telemetry platform: ${process.platform} ${os.release()} ${os.arch()} However, the application will continue.`,
    );
    trackEvent('unsupported_platform', {
      platform: process.platform,
      release: os.release(),
      arch: os.arch(),
      version: app.getVersion(),
      path: process.argv[0],
    });
    break;
  }
}
if (store.get('telemetry')) {
  Sentry.init({
    dsn: 'https://63c6c95f892988509925aaff62c839b3@o4504136997928960.ingest.us.sentry.io/4506838451945472',
    integrations: [
      // Add profiling integration to list of integrations
      electronBreadcrumbsIntegration(),
      // helps with crash reporting with 'native' applications
      electronMinidumpIntegration(),
      electronNetIntegration(),
    ],
    // Don't even bother sentry debug messages are bad in the electron main process
    // debug: true,
    enableRendererProfiling: true,
    tracesSampleRate: 1,
    profilesSampleRate: 1, // Profiling sample rate is relative to tracesSampleRate
    enableTracing: true,
    debug: !!process.env.TRANSPARENT_TELEMETRY,
    // Do not allow debug logs to be sent to Sentry (this is a security risk)
    // If the request has the string 'keypress' in it, don't send it to Sentry
    beforeSend(event) {
      if (event.level === 'debug') {
        return null;
      }
      if (event.request?.url?.toLowerCase().includes('keypress')) {
        return null;
      }
      return event;
    },
  });
  telemetryLogger.log(`Sentry Electron SDK Loaded!`);
}
if (process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland') {
  // @see https://github.com/electron/electron/issues/32760
  // sorry little penguin, you're gonna have to deal with it
  app.commandLine.appendSwitch('ignore-gpu-blacklist');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.disableHardwareAcceleration();
  if (store.get('gpuAcceleration') === true) {
    log.warn('GPU Acceleration on Linux is broken and will be disabled (regardless of the setting)');
    store.set('gpuAcceleration', false);
  }
}

function getActiveNetworkInterfaceType() {
  const networkInterfaces = os.networkInterfaces();
  let primaryInterface = '';

  // Ensure we're only iterating over own properties of networkInterfaces
  for (const interfaceName in networkInterfaces) {
    if (Object.prototype.hasOwnProperty.call(networkInterfaces, interfaceName)) {
      const interfaceDetails = networkInterfaces[interfaceName];

      // Use a modern for...of loop to iterate over interfaceDetails
      for (const interfaceInfo of interfaceDetails) {
        // Check if the interface is up and not internal
        if (!interfaceInfo.internal && interfaceInfo.mac !== '00:00:00:00:00:00') {
          // Check if the interface is WiFi or Ethernet based on the interface's family
          if (interfaceInfo.family === 'IPv4' && (interfaceName.startsWith('wl') || interfaceName.startsWith('en'))) {
            return interfaceName.startsWith('wl') ? 'WiFi' : 'Ethernet';
          }
          // If it's the first non-internal interface found, mark it as primary
          if (!primaryInterface) {
            primaryInterface = interfaceName;
          }
        }
      }
    }
  }

  return `Unknown (${primaryInterface})`;
}
// HOLY CRAP AM I COMMITTING THIS TO GITHUB?!
if (store.get('telemetry')) {
  // eslint-disable-next-line no-one-time-vars/no-one-time-vars
  initialize('A-US-0332858461', {
    // debug: app.isPackaged,
  });
  telemetryLogger.log('Aptabase is ready!');
  telemetryLogger.log(`Network Type: ${getActiveNetworkInterfaceType()}`);
}
// // import ssdp from 'node-ssdp'//
const parser = new XMLParser();
const parse = (xml: string) => parser.parse(xml);

// const client = new ssdp.Client();

const connectedRokus: ROKU<string>[] = [];
const instance = axios.create();
// eslint-disable-next-line unicorn/no-await-expression-member

// instance.defaults.raxConfig = {
//   instance,
// };
// @ts-expect-error borked types
instance.interceptors.request.use(AxiosLogger.requestLogger);
// @ts-expect-error borked types
instance.interceptors.response.use(AxiosLogger.responseLogger);
// (await import('retry-axios')).default.attach(instance);
setGlobalConfig({
  status: true,
  headers: true,
  // STOP LOGGING PII
  data: false,
  logger: log.scope('roku-remote').debug,
});

if (store.get('telemetry')) Sentry.setUser({ id: store.get('machineId') });

log.log(process.execPath);
log.log(process.cwd());
log.log(process.argv);
  // Check if the application is running from a folder
  const isProduction = app.isPackaged;
if (isProduction && store.get('telemetry'))
  trackEvent('session_replay_status', { sessionReplay: store.get('sessionReplay') });
const runAsync = async () => {
  // Disable GPU Acceleration for Windows 7
  if (release().startsWith('6.1') && process.platform === 'win32') {
    app.disableHardwareAcceleration();
    log.warn('NAG: Disabling hardware acceleration for Windows 7');
    log.warn(`NAG: WINDOWS 7 ISNT EVEN SUPPORTED ANYMORE`);
    log.warn(`NAG: UPGRADE YOUR WINDOWS. DETECTED VERSION: ${release()}`);
  }

  Store.initRenderer();
  if (store.get(`gpuAcceleration`) === false) app.disableHardwareAcceleration();

  // Set application name for Windows 10+ notifications
  if (process.platform === 'win32') app.setAppUserModelId(app.getName());
  // !! WARN !!
  // This is useful for detecting a certain environment but if it's outputted to your log files, it could be a security risk
  // Wipe your logs after use.
  log.debug(process.env)

  if (!app.requestSingleInstanceLock()) {
    app.quit();
    throw new Error('Failed single instance lock condition. Is Rokon already running?');
  }
  if (isProduction || process.env.FORCE_SERVE) {
    serve({ directory: 'app' });
  }
  store.set('numberOfRuns', store.get('numberOfRuns') + 1); //
  log.debug(`This is run number ${store.get('numberOfRuns')}`);
    let distroInfo: { dist: string; release: string; codename: string };
    if (process.platform === 'linux') distroInfo = await promiseGetOS().catch(() => null);

    trackEvent('userSurvey', {
      // Get the name of the processor running
      processor: `${os.cpus()[0].model} (${os.cpus().length})`,
      // Get the amount of memory in the system don't forget to round
      memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
      // Get the operating system platform
      platform: os.platform(),
      os:
        process.platform === 'linux' && distroInfo
          ? `${distroInfo.dist} ${distroInfo.release} (${distroInfo.codename})`
          : `${osName()} (${os.release()}, ${os.version()})`,
      // Get the operating system architecture
      arch: os.arch(),
      // Whether or not the current active network interface is WiFi or Ethernet
      networkInterface: getActiveNetworkInterfaceType(),
      numberOfRuns: store.get('numberOfRuns'),
      applicationVersion: app.getVersion(),
      applicationArgv: process.argv.join(', '),
      // This is used to differentiate between users. It's not a perfect solution but it's better than nothing
      // To be clear though, your actual machineId has long been hashed with SHA-256 (in the upstream module)
      machineId: store.get('machineId'),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isError = (possibleError: any) => {
    return (
      possibleError &&
      possibleError.stack &&
      possibleError.message &&
      typeof possibleError.stack === 'string' &&
      typeof possibleError.message === 'string'
    );
  };
  contextMenu({
    showSaveImageAs: false,
    showSearchWithGoogle: false,
    prepend: (_defaultActions, parameters, _browserWindow) => [
      // {
      //   label: 'Rainbow',
      //   // Only show it when right-clicking images
      //   visible: parameters.mediaType === 'image'
      // },
      {
        label: 'Search Google for “{selection}”',
        // Only show it when right-clicking text
        visible: parameters.selectionText.trim().length > 0,
        click: () => {
          shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
        },
      },
    ],
  });

  await app.whenReady();
  if (app.isPackaged) {
    log.log(`App is ready, isProduction: ${isProduction}`);
    log.log(`You are running ${app.getName()} version ${app.getVersion()}`);
    let metadata;
    const metadataFilePath = join(__dirname, '..', '..', '..', 'metadata.json');
    try {
      // Do not requrie it instead read it from the fs
      metadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf8'));
    } catch (error) {
      log.error(error);
    }
    if (metadata) {
      // Add to previousVersionMetadata but make sure not to add the same version twice by replacing versions that have the same version number, that way, there are no duplicates yet versions are allowed to overwrite same versions.
      // For example, if the application is updated from 1.0.0 to 1.0.0, the previous version metadata will be overwritten with the new metadata
      // However if the application is updated from 1.0.0 to 1.0.1, the previous version metadata will be added to the array ins
      store.set('previousVersionMetadata', [
        ...store
          .get('previousVersionMetadata')
          .filter((version: Record<string, Record<string, string>>) => version.package.version !== app.getVersion()),
        metadata,
      ]);
      log.log(
        `Built at ${new Date(metadata.build.time)} by ${metadata.build.builtBy} (${metadata.git.build.host}) using ${metadata.build.createdWith} on ${metadata.build.builderOS}`,
      );
      log.log(
        `Git branch ${metadata.git.branch} with commit ${metadata.git.commit.id.abbrev} and tag ${metadata.git.closest.tag.name}`,
      );
      log.log(`Git commit message: ${metadata.git.commit.message.short}`);
      log.log(`Git commit date: ${metadata.git.commit.date}`);
      log.log(`Git commit author: ${metadata.git.commit.user.name} <${metadata.git.commit.user.email}>`);
      log.log(`Git dirty: ${metadata.git.dirty}`);
      log.log(`Git remote: ${metadata.git.remote.origin.url}`);
    } else {
      log.error(`Could not load metadata.json from ${metadataFilePath} , not outputting metadata`);
      // output a tree of the application directory to the logs

      log.error(
        require('tree-node-cli')(join(metadataFilePath, '..'), {
          exclude: [
            // RegExp to exclude node_modules
            /node_modules/,
            /locales/,
          ],
        }),
      );
    }
  }

  // if (!isProduction && !process.argv.join('\n').includes('node_modules/electron/dist/electron')) {
  //   const devtools = await import('electron-devtools-installer');
  //   const { default: installExtension, REACT_DEVELOPER_TOOLS } = devtools;
  //   // @ts-expect-error borked types
    
  //   const extension: string | Error = await installExtension(REACT_DEVELOPER_TOOLS).catch(error => error);
  //   if (isError(extension)) log.error(extension);
  //   else log.log(`Added Extension: ${extension}`);
  // }
  const shouldRunDiscovery = store.get('knownRokus').length === 0;
  // Get and show the discovered devices (services)
  if (process.platform !== 'win32' && !process.env.USE_FALLBACK && shouldRunDiscovery) {
    // The upnp module does not work well on Windows
    // Start the discovery process
    await upnp.startDiscovery({
      mx: 1,
      st: 'roku:ecp',
    });
    // Wait for 1 seconds
    // The connection is local it shouldn't take longer than that unless its poor
    await upnp.wait(1000);
    // Stop the discovery process
    await upnp.stopDiscovery();
  }
  if (!shouldRunDiscovery) {
    log.log('Not running discovery, knownRokus is not empty');
    log.log(store.get('knownRokus').map(knownRoku => knownRoku.address));
  }
  const deviceList =
    process.platform === 'win32' || process.env.USE_FALLBACK || !shouldRunDiscovery
      ? store.get('knownRokus')
      : [...upnp.getActiveDeviceList(), ...store.get('knownRokus')];
  if (process.env.USE_FALLBACK) {
    log.warn('USE_FALLBACK environment variable is active');
  }
  if (process.platform === 'win32' && shouldRunDiscovery) {
    log.log('Microsoft Windows does not work well with the upnp module, using fallback node-ssdp module');
  }
  if (deviceList.length === 0 && shouldRunDiscovery) {
    log.warn('No devices discovered using the typical discovery method, trying fallback node-ssdp module');
    const client = new Client({
      customLogger: log.debug,
    });
    client.on('response', async function (headers, statusCode, rinfo) {
      const device = rinfo.address;
      const roku = new ROKU(device);
      // ruining the types one step at a time baby
      roku.ip = device;
      connectedRokus.push(roku);
      const rokuDetails = {
        address: device,
        headers,
        device: {
          address: device,
        },
        description: undefined,
      };
      // This is so we don't overwrite the knownRokus array when we rewrite this code
      store.set('knownRokus', [...store.get('knownRokus'), rokuDetails]);

      // add the device to the device list
      deviceList.push(rokuDetails);
      // trackEvent('roku_discovered', {
      //   manufacturer: null,
      //   modelName: null,
      //   address: device,
      //   server: (rokuDetails.headers.SERVER as unknown as string) || (rokuDetails.headers.server as unknown as string),
      // });
    });
    await client.search('roku:ecp');
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    await wait(3400);
    client.stop();
  }

  if (deviceList.length === 0) {
    log.error('No Rokus discovered!');
    new Notification({
      title: 'No Rokus Discovered',
      body: `No Rokus were discovered on the network`,
      urgency: 'critical',
    }).show();
  }
  for (const device of deviceList) {
    const ip = device.address || new URL(device.headers.LOCATION).hostname;
    const roku = new ROKU(ip);
    // ruining the types one step at a time baby
    roku.ip = ip;
    // Don't add to the connectedRokus array if the device is already there
    if (connectedRokus.map(connectedRoku => connectedRoku.ip).includes(ip)) {
      log.debug(`Roku ${ip} has already been added to the connectedRokus array`);
      continue;
    } else {
      connectedRokus.push(roku);
      log.debug(`Roku ${ip} has been added to the connectedRokus array`);
    }
    if (
      store
        .get('knownRokus')
        .map(knownRoku => knownRoku.address)
        .includes(roku.ip)
    ) {
      // log.debug(`Roku ${ip} has already been added to the knownRokus settings`);
      // Do nothing
    } else {
      store.set('knownRokus', [...store.get('knownRokus'), device]);
      log.debug(`Roku ${ip} has been added to the knownRokus settings`);
    }

    log.log('------------------------------------');
    log.log(` * ${device.address}`);
    if (device.description) {
      log.log(` * ${device.description.device.manufacturer}`);
      log.log(` * ${device.description.device.modelName}`);
    }
    // log.log(' * ' + device['headers']['LOCATION']);
    // log.log(' * ' + device['headers']['USN']);

    // eslint-disable-next-line no-await-in-loop
    const response = await instance.get(connectedRokus[0].url).catch(log.error);
    if (!response) throw new Error("Didn't get a valid response from the connected Roku.");

    // Do NOT log the deviceInfo, it contains a lot of sensitive information (PII)
    const rokuOverviewCamel = camelizeKeys(parse(response?.data));

    // Download thre device image
    // eslint-disable-next-line no-await-in-loop
    const deviceImage = await instance
      .get(`${connectedRokus[0].url}device-image.png`, {
        responseType: 'arraybuffer',
      })
      .catch(log.error);
    if (shouldRunDiscovery) {
      trackEvent('roku_discovered', {
        manufacturer: device.description?.device.manufacturer || rokuOverviewCamel.root.device.manufacturer,
        modelName: device.description?.device.modelName || rokuOverviewCamel.root.device.modelName,
        address: device.address || device.headers.LOCATION,
        server: device.headers.SERVER || device.headers.server,
      });
    }

    new Notification({
      title: 'Connected To Roku',
      body: `${rokuOverviewCamel.root.device.friendlyName} (${response?.request.socket.remoteAddress || device.address}, ${rokuOverviewCamel.root.device.manufacturer})`,
      urgency: 'low',
      icon: deviceImage ? nativeImage.createFromBuffer(Buffer.from(deviceImage.data)) : undefined,
    }).show();
  }

  // await client.search('roku:ecp')
  //
  // client.on('response', function (headers, statusCode, rinfo) {
  //   log.log(`Got an response from a Roku TV`)
  //   const device = new URL(headers.LOCATION).hostname
  //     log.log(headers)
  //   const roku = new ROKU(device)
  //   // ruining the types one step at a time baby
  //   roku.ip = device
  //     connectedRokus.push(roku)
  //     // can't send shit at this stage of the game
  //     // ipcRenderer.send('new-roku', device)
  //     // mainWindow.webContents.send('new-roku', device)
  //   return device
  //   // const deviceInfo = await got.get(`${headers.LOCATION}query/device-info`)
  //   // log.log(parse(deviceInfo.body))
  //   // const channels = await got.get(`${headers.LOCATION}query/tv-channels`)
  //   // log.log(parse(channels.body))
  //   // const activeChannelInfo = await got.get(`${headers.LOCATION}query/tv-active-channel`)
  //   // log.log(parse(activeChannelInfo.body))
  // });
  const mainWindow = createWindow('Rokon', {
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Sandboxing is also disabled whenever Node.js integration is enabled in the renderer. This can be done through the BrowserWindow constructor with the nodeIntegration: true flag.

      nodeIntegration: true,

      // nodeIntegrationInWorker: true, // must be set to true when contextBridge is enabled

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      contextIsolation: true,
    },
  });
  const QUALIFIER = process.env.SNAP
    ? ' (Snap)'
    : process.env.FLATPAK
      ? ' (Flatpak)'
      : process.env.APPIMAGE
        ? ' (AppImage)'
        : '';
  const menu = Menu.buildFromTemplate([
    {
      label: 'Example',
      submenu: [
        {
          label: 'About This App',
          click: () =>
            {
              openAboutWindow({
              // resources/icon.png
              icon_path: isProduction ? join(__dirname, 'images', 'logo.png') : join(__dirname, '..', '..', 'resources', 'logo.png'),
              package_json_dir: isProduction ? join(__dirname, '..', '..') : join(__dirname, '..', '..'),
              product_name: `Rokon on ${process.platform}${QUALIFIER}`,
              open_devtools: false,
              // use_inner_html: true,
              // ipcMain,
              // app,
              // BrowserWindow: mainWindow
            })},
        },
        {
          label: 'Check For Updates',
          click: () => {
            mainWindow.webContents.send('check-update');
          },
        },
        {
          role: 'quit',
        },
      ],
    },
  ]);
  const menuTemplate = Menu.buildFromTemplate([
    // { label: 'Item1', type: 'radio' },
    // { label: 'Item2', type: 'radio', checked: true },
    {
      label: 'Check for Updates',
      click: () => {
        log.log('Check for updates triggered by user via the tray');
        mainWindow.webContents.send('check-update');
      },
    },
    {
      label: 'Discord Server',
      click: () => {
        shell.openExternal('https://discord.gg');
      },
    },
    {
      label: 'Donate',
      click: () => {
        shell.openExternal('https://ko-fi');
      },
    },
    { label: 'Quit', role: 'quit' },
  ]);
  // tray.setToolTip('Control your Roku at a glance');
  new Tray(nativeImage.createFromPath(path.join(__dirname, 'images', 'logo.png'))).setContextMenu(menuTemplate);
  app.applicationMenu = menu;
  // await (isProduction || process.argv[2] === 'test'
  //   ? mainWindow.loadURL('app://./home')
  //   : mainWindow.loadURL(`http://localhost:${process.argv[2]}/home`));
    if (process.argv.includes('--no-window')) {
    log.log(`Look mom, I'm Incognito!`);
  } else {
  // await mainWindow.loadURL(
  //   isProduction || process.argv[2] === 'test' ? `app://./home` : `http://localhost:8888/home`,
  // );
  log.log('Loading URL')
  await mainWindow.loadURL(`http://localhost:8888/home/`);
  }
  log.log('I am verifying the code under this line has a opportunity to run')
    await mainWindow.loadURL(`http://127.0.0.1:8888/home/`);

  // Test actively push message to the Electron-Renderer
  mainWindow.webContents.on('did-finish-load', () => {
    log.log('did-finish-load');
    mainWindow?.webContents.send('main-process-message', new Date().toLocaleString());
  });
  // Make all links open with the browser, not with the application
  // mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  //   if (url.startsWith('https:')) shell.openExternal(url);
  //   return { action: 'deny' };
  // });
  ipcMain.on('type', async (event, l) => {
    log.debug('type event');
    if (!connectedRokus[0]) {
      new Notification({
        title: 'Cannot Complete Action',
        body: 'No connected roku at the moment',
        urgency: 'critical',
        // icon: new nativeImage({}),
      }).show();
      return log.error('There is no connected Roku to control at the moment.');
    }
    if (l.length > 1) {
      await instance.post(`${connectedRokus[0].url}keypress/${l}`);
      return;
    }
    connectedRokus[0].type(l);
  });
  ipcMain.on('checkRokuIsOn', async (event, argument) => {
    log.log('checkRokuIsOn argument', argument);
    // if (connectedRokus[0]?.description) {
    log.log(connectedRokus[0].description);

    const response = await instance.get(`${connectedRokus[0].url}query/device-info`).catch(log.error);
    if (!response) {
      return;
    }

    // Do NOT log the deviceInfo, it contains a lot of sensitive information (PII)

    const powerState = camelizeKeys(parse(response?.data as unknown as string)).deviceInfo.powerMode === 'PowerOn';
    log.log(`Roku is ${powerState ? 'on' : 'off'}`);
    mainWindow.webContents.send('checkRokuIsOn', { powerState });
    event.returnValue = { powerState };

    event.reply('rokuIsOn', { powerState });
    // } else {
    //   event.returnValue = false;
    // }
  });
  ipcMain.on('open-logs-directory', async (event, _argument) => {
    log.log('Opening log directory');
    shell.openPath(app.getPath('logs'));
  });
  ipcMain.on('update-error', async (event, argument) => {
    // send the user a notification
    log.error(argument);
    const notification = new Notification({
      title: 'Update Error',
      body: argument.message,
      urgency: 'critical',
      sound: 'Basso',
    });
    notification.show();
    mainWindow.show();
  });
  ipcMain.on('open-settings', async (event, argument) => {
    log.log('Opening settings');
    store.openInEditor();
  });
  ipcMain.on('disable-telemetry', async (event, argument) => {
    store.set('sessionReplay', false);
    store.set('telemetry', false);
    telemetryLogger.log('Telemetry disabled by user');
    log.log('Application needs to be restarted to apply changes');
    // if (process.env.NODE_ENV === 'production') {
    //   app.relaunch();
    //   app.quit();
    // } else {
    //   app.quit();
    //   process.exit(0);
    // }
    if (app.isPackaged) {
      app.relaunch();
      app.quit();
    }
  });
  ipcMain.on('launch', async (event, argument: string) => {
    if (!connectedRokus[0]) {
      log.error('No connected Rokus');
      return;
    }
    if (!argument) {
      log.info('No argument provided to launch');
      return;
    }
    // connectedRokus[0].launch({id: argument});
    await (argument.startsWith('button:')
      ? instance.post(`${connectedRokus[0].url}keypress/${argument.split(':')[1]}`).catch(log.error)
      : instance.post(`${connectedRokus[0].url}launch/${argument}`).catch(log.error));
  });
  // ipcMain.on('new-roku', async (event, argument) => {
  //   // the argument provided is useless. we as nodejs need to discover the rokus
  //   // connectedRokus.push(new ROKU(ip))
  //   event.reply('new-roku', connectedRokus[0].ip);
  //   mainWindow.webContents.send('new-roku', connectedRokus[0].ip);
  //   // give the user a notification
  //   new Notification({
  //     title: 'New Roku Discovered',
  //     body: `A new Roku has been discovered at ${connectedRokus[0].ip}`,
  //   }).show();
  // });
  // Apply electron-updater
  update(mainWindow);
  app.on('second-instance', () => {
    if (mainWindow) {
      // Focus on the main window if the user tried to open another
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length > 0) {
      allWindows[0].focus();
    } else {
      console.error("You'll regret this.");
      app.exit(0);
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
runAsync();
ipcMain.on('message', async (event, argument) => {
  event.reply('message', `${argument} World!`);
});
ipcMain.on('buttonClicked', async (event, argument) => {
  // log.log('Button clicked');
  // log.log(argument);
  if (!connectedRokus[0]) {
    log.error('No connected Rokus');
    return;
  }
  event.reply('buttonClicked', argument);
  await instance.post(`${connectedRokus[0].url}keypress/${argument}`).catch(log.error);
});
ipcMain.on('electron-store-get', async (event, value) => {
  event.returnValue = store.get(value);
});
ipcMain.on('electron-store-set', async (event, key, value) => {
  store.set(key, value);
});
// ipcRenderer.on('buttonClicked', async (event, arg) => {
//   log.log('Button clicked')
//     log.log(arg)
// })
// ipcRenderer.on('roku-discovered', async (event, ip) => {
//   log.log('Roku added to connectedRokus')
//   connectedRokus.push(new ROKU(ip))
//     ipcRenderer.send('roku-discovered', ip)
// })
