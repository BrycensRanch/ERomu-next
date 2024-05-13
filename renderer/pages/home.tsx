import Head from 'next/head';
import React, { Suspense } from 'react';

import Disclaimer from '../components/disclaimer';
import Remote from '../components/remote';
import UpdateElectron from '../components/update';

// UNDOCUMENTED COMMANDS
// rokuip:8060/launch/837?contentId=youtubevideoid
// rokuip:8060/launch/837?contentId=ytvideoid

// https://web.archive.org/web/20170528205206/https://sdkdocs.roku.com/display/sdkdoc/External+Control+API
// Installing a channel with ECP
// just like deep linking you can install a channel with an HTTP post.   In this case, the format is

// http://<IP or Roku>:8060/install/<channel ID>

// The following command will launch the dev app on the box. The simplevideoplayer app that comes with the SDK will process the "url" and "streamformat" parameters and launch the roVideoScreen to play the passed in video. We assume simplevideoplayer is installed as the side-loaded developer application.

// $ curl -d '' 'http://192.168.1.134:8060/launch/dev?streamformat=mp4&url=http%3A%2F%2Fvideo.ted.com%2Ftalks%2Fpodcast%2FVilayanurRamachandran_2007_480.mp4'
// The following command will launch the dev app on the box. The launchparams app that comes with the SDK will process the "contentID" and "options" parameters and display them on a SpringBoard page. We assume launchparams is installed as the side-loaded developer application. This technique is a useful way to create "clickable" ads that launch a springboard page for a particular title in your channel. Roku now supports clickable ads on the home screen as well.

// $ curl -d '' 'http://192.168.1.134:8060/launch/dev?contentID=my_content_id&options=my_options'

// The Channel Store app (channel ID 11) can be passed a "contentID" parameter with the channel ID of a target application.
// The following command will launch the channel store app (11) on the box with a contentID equal to 14 (the MLB app).
// You can get the plugin ID for your app using the /query/apps example above, which returns the installed apps on a Roku player.
// (You should test that the channel is installed before using the launch command, and use the install command for uninstalled channels).
// This technique would be useful in creating clickable ads in a free "Lite" version of a paid app.
// When a user clicks on the ad, the channel store page to purchase the full version could be launched.

// $ curl -d '' 'http://192.168.1.134:8060/launch/11?contentID=14'

// launch parameters for the Roku TV Tuner app (channel ID tvinput.dtv)
// The TV Tuner app can be launched and can optionally be passed a "ch" parameter with the channel number to tune to.
// The following command will launch the TV tuner UI and display channel 1.1 (assuming that channel is available).

// $ curl -d '' 'http://192.168.1.134:8060/launch/tvinput.dtv?ch=1.1'
export default function HomePage() {
  return (
    <>
      <Head>
        <title>Rokon</title>
      </Head>
      <div className="grid-col-1 w-100 grid text-center animate-in fade-in zoom-in">
        <Suspense>
          <Disclaimer />
          <UpdateElectron />
          <Remote />
        </Suspense>
      </div>
    </>
  );
}
