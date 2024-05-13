import { Button, Switch } from '@nextui-org/react';
import anime from 'animejs';
import log from 'electron-log';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import styles from './settings.module.css';
// import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
const getRandomNumber = num => {
  return Math.floor(Math.random() * Math.floor(num));
};
const getRandomColor = () => {
  return `rgb(${getRandomNumber(255)}, ${getRandomNumber(255)}, ${getRandomNumber(255)})`;
};

export default function Settings() {
  const [notAllowed, setNotAllowed] = useState(true);
  const animateMove = (element, prop, pixels) =>
    anime({
      targets: element,
      [prop]: `${pixels}px`,
      easing: 'easeOutCirc',
    });
  const [isOnPage, setIsOnPage] = useState(true);

  useEffect(() => {
    // Function to run when component mounts
    console.log('Component mounted');

    // Function to run when component unmounts
    return () => {
      console.log('Component unmounted');
      setIsOnPage(false); // Set state to indicate user is not on the page
    };
  }, []); // Empty dependency array means this effect runs only once, similar to componentDidMount()
  const animateText = (element, text) => {
    if (!telemetryDisabled)
      anime({
        targets: element,
        textContent: text,
        translateX: 250,
        rotate: '1turn',
        scale: 4,
        duration: 300,
        easing: 'easeInOutQuad',
      });
    // Wait 5 seconds then fade out
    setTimeout(() => {
      if (!telemetryDisabled)
        anime({
          targets: element,
          opacity: 0,
          duration: 1000,
          easing: 'easeInOutQuad',
        });
    }, 5000);
    // Wait another 10 seconds to fade in with new text
    setTimeout(() => {
      if (!telemetryDisabled)
        anime({
          targets: element,
          opacity: 1,
          duration: 1000,
          color: 'red',
          bold: true,
          textContent: "You're not prepared!",
          easing: 'easeInOutQuad',
        });
    }, 10_000);
    // Wait another 10 seconds to fade in with new text
    setTimeout(() => {
      if (!telemetryDisabled)
        anime({
          targets: element,
          opacity: 1,
          duration: 1000,
          color: 'red',
          bold: true,
          textContent: "You're not leaving this page alive!",
          easing: 'easeInOutQuad',
        });
    }, 15_000);
    // wait 30 seconds then crash the page
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.electron.store.get('telemetry') && isOnPage) {
        // Game over
        window.open('https://www.youtube.com/watch?v=-ZGlaAxB7nI', '_blank');
        window.close();
      } else if (typeof window !== 'undefined') {
        log.debug(`Telemetry: ${window.electron.store.get('telemetry')}\nIs on page: ${isOnPage}`);
      }
    }, 30_000);
  };
  const animateColor = (element, color) =>
    anime({
      targets: element,
      backgroundColor: color,
      duration: 200,
      easing: 'easeInOutQuad',
    });
  // is boss music playing?
  const [bossMusic, setBossMusic] = React.useState(false);
  const [telemetryDisabled, setTelemetryDisabled] = React.useState(false);
  // play boss music by using audio element that is hidden and autoplays
  const playBossMusic = () => {
    // @ts-ignore
    const audio: HTMLAudioElement = document.querySelector('#boss-music');
    if (audio) {
      audio.volume = 0.2;
      audio.play().then(() => {
        log.log('Boss music is playing');
      });
      setBossMusic(true);
      setNotAllowed(false);
    } else {
      console.warn('No audio element found');
    }
  };
  return (
    <>
      <Head>
        <title>Next - Nextron (with-tailwindcss)</title>
      </Head>
      <div
        className={styles.container}
        id="container"
        style={{
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <Image
          className="mx-auto animate-in fade-in zoom-in"
          src="/images/logo.png"
          alt="Logo image"
          width={256}
          height={256}
        />
      </div>
      <h1
        id="boss-text"
        className="text-center text-lg"
        hidden
        style={{
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        Who do you think you are?
      </h1>
      <div className="flex flex-col gap-2">
        {typeof window === 'object' && window.electron.store.get('sessionReplay') ? (
          <h1 className="text-xl text-success">Session Replay is enabled</h1>
        ) : (
          <h1 className="text-xl text-danger">Session Replay is disabled</h1>
        )}
        <Switch
          //   isSelected={async(e) => {
          //   return window.electron.store.get('sessionReplay');
          // }}
          defaultValue={typeof window === 'object' ? window.electron.store.get('sessionReplay') : false}
          onValueChange={e => {
            log.log('Session Replay is now', e);
            window.electron.store.set('sessionReplay', e);
          }}
        >
          Session Replay
        </Switch>
        {typeof window === 'object' && window.electron.store.get('telemetry') ? (
          <h1 className="text-xl text-success">Telemetry is enabled</h1>
        ) : (
          <h1 className="text-xl text-danger">Telemetry is disabled</h1>
        )}
        <Button onClick={e => window.ipcRenderer.send('open-logs-directory', 'right now')}>Open Logs Directory</Button>
        {typeof window === 'object' && window.electron.store.get('telemetry') ? (
          <Button
            id="donotblur"
            className="btn-blue donotblur"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '1px 1px 5px black',
            }}
            type='button'
            onClick={e => {
              // Prevent the user from outright pressing the button before it can move
              if (notAllowed) {
                e.preventDefault();
                return;
              }
              setTelemetryDisabled(true);
              setBossMusic(false);
              e.currentTarget.hidden = true;
              // document.querySelector<headerElement>('#boss-text').hidden = true;
              document.querySelector('#boss-music')?.remove();
              if (document.querySelector('#container')) {
                document.querySelector('#container')!.className = '';
              }
              window.open('https://www.youtube.com/watch?v=9bZkp7q19f0', '_blank');
              const NOTIFICATION_TITLE = 'Telemetry has been disabled!';
              const NOTIFICATION_BODY =
                'I hope you are happy with yourself. You have disabled telemetry. Now I will never know what you are doing.';
              const CLICK_MESSAGE = 'Notification clicked';

              new Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY }).addEventListener('click', () =>
                log.log(CLICK_MESSAGE),
              );
              window.ipcRenderer.send('disable-telemetry', 'On the double!');
            }}
            onMouseOver={e => {
              if (typeof window !== 'undefined' && !telemetryDisabled) {
                // prepare the boss music
                if (!bossMusic) {
                  playBossMusic();
                  // document.querySelector<HTMLAudioElement>('#boss-text')!.hidden = false;
                  animateText(document.querySelector('#boss-text'), 'You should of stayed in bed today.');
                  document.querySelector('#container')!.className = 'blur';
                }
                // e.currentTarget.style.backgroundColor = getRandomColor();
                animateColor(e.currentTarget, getRandomColor()).play();

                const top = getRandomNumber(window.innerHeight - e.currentTarget.offsetHeight - Math.random() * 100);
                const left = getRandomNumber(window.innerWidth - e.currentTarget.offsetWidth - Math.random() * 100);
                animateMove(e.currentTarget, 'left', left).play();
                animateMove(e.currentTarget, 'top', top).play();
                e.preventDefault();
              }
            }}
          >
            Disable Telemetry
          </Button>
        ) : (
          <Switch
            //   isSelected={async(e) => {
            //   return window.electron.store.get('sessionReplay');
            // }}
            defaultValue={typeof window === 'object' ? window.electron.store.get('telemetry') : false}
            onValueChange={e => {
              log.log('Telemetry is now', e);
              window.electron.store.set('telemetry', e);
            }}
          >
            Telemetry
          </Switch>
        )}
      </div>
      {/* <LiteYouTubeEmbed */}
      {/*    id="L2vS_050c-M" // Default none, id of the video or playlist */}
      {/*    adNetwork={true} // Default true, to preconnect or not to doubleclick addresses called by YouTube iframe (the adnetwork from Google) */}
      {/*    poster="hqdefault" // Defines the image size to call on first render as poster image. Possible values are "default","mqdefault",  "hqdefault", "sddefault" and "maxresdefault". Default value for this prop is "hqdefault". Please be aware that "sddefault" and "maxresdefault", high resolution images are not always avaialble for every video. See: https://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api */}
      {/*    title="YouTube Embed" // a11y, always provide a title for iFrames: https://dequeuniversity.com/tips/provide-iframe-titles Help the web be accessible ;) */}
      {/*    noCookie={true} // Default false, connect to YouTube via the Privacy-Enhanced Mode using https://www.youtube-nocookie.com */}
      {/*    muted={false} // Default false, if true the video starts automatically */}
      {/* /> */}
      <audio id="boss-music" autoPlay={false} hidden loop src="/Boss Music - Dragon Slayer - Makai-symphony.mp3" />
      <div className="mt-1 flex w-full flex-wrap justify-center">
        <Link href="/home" className="btn-blue">
          Go to home page
        </Link>
      </div>
      {/* <script>
				{`document.querySelectorAll("*").forEach((elem) => {
    elem.setAttribute('draggable', false)
    elem.addEventListener('dragstart', (event) => {
        event.preventDefault()
    })
        window.addEventListener('selectstart', (event) => { event.preventDefault() });

})`}
			</script> */}
    </>
  );
}
