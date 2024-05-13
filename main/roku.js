// const Roku = require('rokujs');

import axios from 'axios';
import ROKU from 'rokujs';
import { promisify } from 'node:util';
// const discovery = promisify(ROKU.discover)
import { XMLParser } from 'fast-xml-parser';
import ssdp from 'node-ssdp';
import { ipcMain, ipcRenderer } from 'electron';

const parser = new XMLParser(),
  parse = xml => parser.parse(xml),
  client = new ssdp.Client();

// import fs from 'fs'

// __dirname is not defined in ES6 modules
// So we need to use the following line to get the current directory
// const __dirname = new URL('.', import.meta.url).pathname;
/**
 * Sends a button press command to the Roku device.
 *
 * @param {RokuInstance('d')} roku An instance of the ROKU class representing the Roku device.
 * @param {string} button The name of the button to press (e.g., "Home", "Up", "Select").
 *
 * @example
 * sendButtonPress(myRoku, "Home");
 */
export const sendButtonPress = async (roku, button) => {
  return roku.press(button);
};
export const discoverRokus = async () => {
  const deviceIPs = [];
  client.search('roku:ecp');

  client.on('response', function (headers, statusCode, rinfo) {
    console.log('Got an response from a Roku TV');
    const device = new URL(headers.LOCATION).hostname;
    console.log(headers);
    ipcRenderer.send('roku-discovered', device);
    return device;
    // const deviceInfo = await got.get(`${headers.LOCATION}query/device-info`)
    // console.log(parse(deviceInfo.body))
    // const channels = await got.get(`${headers.LOCATION}query/tv-channels`)
    // console.log(parse(channels.body))
    // const activeChannelInfo = await got.get(`${headers.LOCATION}query/tv-active-channel`)
    // console.log(parse(activeChannelInfo.body))
  });
  // roku.press('PowerOff')
  // roku.type('Jellyfin')
  // roku.press('home');
  // roku.delay(1000);
  //
  // roku.press(ROKU.keys[6]); // right
  // roku.delay(1000);
  //
  // roku.press('volumeup');
  // roku.apps(function (err, apps) {
  // console.log(apps);
  // for (const app of apps) {
  //     const ws = fs.createWriteStream(__dirname + '/' + app.id + '.png');
  //     const rs = roku.iconStream(app.id);
  //
  //     rs.pipe(ws);
  // }

  /* example response
        [ { id: 12, name: 'Netflix', version: '4.1.218' },
        { id: 13, name: 'Amazon Video', version: '5.17.10' },
        { id: 2213, name: 'Roku Media Player', version: '4.1.1524' },
        { id: 46041, name: 'Sling TV ', version: '5.0.13' },
        { id: 2285, name: 'Hulu', version: '4.7.1' },
        { id: 52838, name: 'Nick', version: '1.0.0' },
        { id: 45706, name: 'Roku TV Intro', version: '1.0.11' },
        { id: 837, name: 'YouTube', version: '2.0.70100049' },
        { id: 61322, name: 'HBO NOW', version: '1.7.2016101400' },
        { id: 50539, name: 'Twitch', version: '1.0.14' },
        { id: 47389, name: 'FX NOW', version: '1.3.8' },
        { id: 2946, name: 'Fox News Channel', version: '2.1.4' },
        { id: 26950, name: 'QVC', version: '1.0.21' } ]
        */
  // });
  // roku.apps({ active: true }, function (err, app) {
  //     console.log(app);
  // });
  // roku.launch({ id: 291097 }, function (err) {
  //     if (err) {
  //         console.log(err);
  //     }
  // });
  // roku.launch({ name: 'Jellyfin'}, function (err) {
  //     if (err) {
  //         console.log(err);
  //     }
  // })
  // roku.tvChannels(function (channels) {
  //     console.log(channels);
  // });
  /* example response
        [ { server: 'Roku UPnP/1.0 MiniUPnPd/1.4',
          address: '192.168.2.45',
          location: 'http://192.168.2.45:8060/',
          usn: 'uuid:roku:ecp:2N005M893730' } ]
        */
};

// // search for a service type
// Or get a list of all services on the network

// client.search('ssdp:all');
//     import ssdp from '@achingbrain/ssdp'
//     const bus = await ssdp().catch(console.error)
//     if (!bus) throw new Error("Bus failed to initialize")
// // print error messages to the console
// //     bus.on('error', console.error)
//     const usn = "roku:ecp"
//     for await (const service of bus.discover(usn)) {
//         // search for instances of a specific service
//         console.log(service);
//         continue
//     }
//
//     bus.on('service:discover', service => {
//             console.log('service:discover')
//     })
//
//     bus.on('service:update', service => {
//         console.log('service:update')
//         // receive a notification when that service is updated - nb. this will only happen
//         // after the service max-age is reached and if the service's device description
//         // document has changed
//     })
