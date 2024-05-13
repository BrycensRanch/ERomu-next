/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');


const isDev = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  // Helps to identify unsafe lifecycles, legacy API usage, and a number of other features.
  reactStrictMode: true,
  trailingSlash: true,
  // swcMinify: true,
  // experimental: {
  //   swcPlugins: [
  //     require('stailwc/install')({
  //       engine: 'emotion', // or "styled-components"
  //     }),
  //   ],
  // },
  // compiler: {
  //   removeConsole: {
  //     exclude: ['error'],
  //   },
  //   emotion: true,
  //   // or
  //   styledComponents: true,
  // },
  // prepare for next 14
  output: 'export',

  // Optional: Change the output directory `out` -> `dist`
  distDir: process.env.NODE_ENV === 'production' ? 'app' : undefined,
  images: {
    unoptimized: true,
  },
  browserslist: ['last 1 chrome version'],
  productionBrowserSourceMaps: true,
  sentry: {
    // Use `hidden-source-map` rather than `source-map` as the Webpack `devtool`
    // for client-side builds. (This will be the default starting in
    // `@sentry/nextjs` version 8.0.0.) See
    // https://webpack.js.org/configuration/devtool/ and
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#use-hidden-source-map
    // for more information.
    hideSourceMaps: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    // You should always fix all ESLint errors, but this option can be useful in a pinch.
    // Of course, this will fail in CI.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  webpack: config => {
    //   // Put the Sentry Webpack plugin after all other plugins
    //   // Sentry's webpack slows down the development server, so we only use it in production
    //   // To be clear, this doesn't inject the sentry sdk into the app, it just uploads the source maps to sentry and what not
    if (!isDev && !process.env.DO_NOT_TELEMETRY)
      config.plugins.push(
        sentryWebpackPlugin({
          org: 'github-student-developer',
          project: 'eromu',
          hideSourceMaps: false,
          silent: false,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
      );
    return config;
  },

  // config.externals.push(
  //   {
  //     'electron-store' : 'require("electron-store")'
  //   },
  //   'conf'
  // )
  // if (isDev) config.plugins.push(
  //   new WebpackPluginIstanbul({
  //     include: ["pages/**/*", 'components/**/*'],
  //     extension: [".js", ".jsx", ".ts", ".tsx"],
  //     cwd: process.cwd(),
  //   }),
  // )
  //   return config;
};
