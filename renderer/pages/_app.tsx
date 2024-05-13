import '../styles/satoshi.css';
import '../styles/globals.css';

import { NextUIProvider } from '@nextui-org/react';
import { browserTracingIntegration, feedbackIntegration, init, replayIntegration } from '@sentry/electron/renderer';
import { init as nextInit } from '@sentry/nextjs';
import log from 'electron-log';
import type { AppProps } from 'next/app';
import NextNProgress from 'nextjs-progressbar';
import React, { Suspense, useEffect, useState } from 'react';
import { useIdleTimer } from 'react-idle-timer';

// Make sure this code only runs in the renderer process
// Here be dragons if you don't check for the window object
// @ts-ignore
if (typeof window !== 'undefined' && window.electron.store.get('telemetry')) {
  const sentryIntegrations = [
    // only send replay session if user consents
    feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: 'system',
      showBranding: false,
    }),
    browserTracingIntegration({}),
    // https://www.natlawreview.com/article/litigation-minute-website-analytics-or-illegal-wiretapping
    // https://dataprivacy.foxrothschild.com/2022/06/articles/general-privacy-data-security-news-developments/understanding-the-9th-circuits-recent-ruling-on-session-replay-software/
    // Ask for consent before enabling session replay
  ];
  if (window.electron.store.get('sessionReplay')) {
    sentryIntegrations.push(
      // @ts-ignore
      replayIntegration({
        blockAllMedia: false,
      }),
    );
  }
  // The Sentry SDK types seem to be scuffed
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  init(
    {
      // debug: true,
      dsn: 'https://63c6c95f892988509925aaff62c839b3@o4504136997928960.ingest.us.sentry.io/4506838451945472',
      // This option is required for capturing headers and cookies.
      sendDefaultPii: true,
      integrations: sentryIntegrations,
      profilesSampleRate: 1, // Profiling sample rate is relative to tracesSampleRate
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1,
      // Session Replay
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      debug:
        process.env.TRANSPARENT_TELEMETRY === 'true' || (typeof window !== 'undefined' && window.TRANSPARENT_TELEMETRY),
      // Do not allow debug logs to be sent to Sentry (this is a security risk)
      // If the request has the string 'keypress' in it, don't send it to Sentry
      beforeSend(event) {
        if (event.level === 'debug') {
          log.info('debug event captured, not sending to Sentry');
          return null;
        }
        if (event.request?.url?.toLowerCase().includes('keypress')) {
          log.log('Keypress events should not be sent to Sentry');
          return null;
        }
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        // Don't send any breadcrumbs that contain the string 'keypress'
        if (breadcrumb.data?.url?.toLowerCase().includes('keypress')) {
          return null;
        }
        return breadcrumb;
      },
    },
    nextInit,
  );
  log.scope('telemetry').log('Sentry Browser/Renderer/Next.js SDKs loaded');
}

function MyApp({ Component, pageProps }: AppProps) {
  const [state, setState] = useState<string>('Active');
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(Date.now());
  const [activeMinutes, setActiveMinutes] = useState<number>(typeof window === 'undefined' ? 0 : window.electron.store.get('minutesActive') || 0);
  const [remaining, setRemaining] = useState<number>(0);
  const onIdle = () => {
    setState('Idle');
  };

  const onActive = () => {
    setState('Active');
    setLastActiveTimestamp(Date.now());
  };

  const onAction = () => {};
  const { getRemainingTime } = useIdleTimer({
    onIdle,
    onActive,
    onAction,
    timeout: 60_000,
    throttle: 500,
  });
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000));
      if (state === 'Active') {
        const now = Date.now();

        setActiveMinutes(prevActiveMinutes => prevActiveMinutes + (now - lastActiveTimestamp) / 1000 / 60);
        // if (typeof window !== 'undefined') window.electron.store.set('minutesActive', activeMinutes);
        setLastActiveTimestamp(now);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [getRemainingTime, lastActiveTimestamp, state]);

useEffect(() => {
  // Function to save minutesActive to disk
  const saveMinutesToDisk = () => {
    if (typeof window !== 'undefined') window.electron.store.set('minutesActive', activeMinutes);
  };

  // Save on interval and on unmount
  const timeoutId = setTimeout(saveMinutesToDisk, 30 * 1000); // Update every 30 seconds
  return () => {
    clearTimeout(timeoutId);
    saveMinutesToDisk(); // Save on unmount
  };
}, [activeMinutes]); // Update only when activeMinutes changes

  // Format remaining time for display
  const formatTime = (seconds: number) => {
    return `${seconds % 60 || 60} seconds`;
  };

  // For every minute the application is open, increment the time used. This is to help us understand how long users are using the application. However, it's important to make sure the user is actually active. If the user is not active, we should not increment the time used.
  // if (typeof window !== 'undefined' && window.electron.store.get('telemetry')) {

  //   // setInterval(() => {
  //   //   // @ts-ignore
  //   //   if (window.electron.store.get('telemetry')) {
  //   //     trackEvent('time_used', { time: 60 });
  //   //   }
  //   // }, 60 * 1000);
  // }
  return (
    <>
      <NextNProgress />
      <NextUIProvider>
        <Suspense>
          <Component {...pageProps} suppressHydrationWarning />
          <div className="fixed bottom-0 left-0 p-2 text-small text-white shadow ease-in bold" suppressHydrationWarning>
{ typeof window === 'undefined' ? 'Unknown' : !window.isProduction && <>
          <div>State: {state}</div>
          <div>Active Minutes: {activeMinutes.toFixed(2)}</div>
          <div>Remaining: {formatTime(remaining)}</div>
          </> }
            <div>Rokon Version: {typeof window === 'undefined' ? 'Unknown' : `${window.applicationVersion} ${!window.isProduction ? '(Development)' : ''}`}</div>
          </div>
        </Suspense>
      </NextUIProvider>
    </>
  );
}

export default MyApp;
