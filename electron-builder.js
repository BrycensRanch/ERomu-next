/* eslint-disable global-require */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-template-curly-in-string */
/**
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'io.github.brycensranch.rokon',
  productName: 'Rokon',
  asar: true,
  directories: {
    output: 'release/${version}',
    buildResources: 'resources',
  },
  files: [
    {
      from: '.',
      filter: ['package.json', 'app'],
    },
  ],
  mac: {
    artifactName: '${productName}-${version}-MacOS-${arch}.${ext}',
    target: [
      {
        target: 'dmg',
        arch: process.env.CI ? ['x64', 'arm64'] : process.arch,
      },
      {
        target: 'pkg',
        arch: process.env.CI ? ['x64', 'arm64'] : process.arch,
      },
      // I honestly don't think mac users know anything besides zip
      {
        target: 'zip',
        arch: process.env.CI ? ['x64', 'arm64'] : process.arch,
      },
    ],
  },
  win: {
    signingHashAlgorithms: ['sha256'],
    target: process.env.CI
      ? [
          {
            target: 'nsis',
            arch: ['x64', 'arm64'],
          },
          {
            target: '7z',
            arch: ['x64', 'arm64'],
          },
          // makes snap look good at decompressing files at runtime
          // at least snap caches the decompressed files
          // "portable",
          // {
          //   target: 'portable',
          //   arch: ['x64', 'arm64'],
          // },
          {
            target: 'msi',
            arch: ['x64', 'arm64'],
          },
          {
            target: 'msi-wrapped',
            arch: ['x64', 'arm64'],
          },
          // We're not ready yet! Also the CI only runs on MacOS at the moment so we can't build for AppX even if we wanted to without making the CI run on Windows (slowing down the CI)
          // {
          //   target: 'appx',
          //   arch: ['x64', 'arm64'],
          // }
          // "squirrel"
        ]
      : // For development purposes, only build for the current architecture
        // Note, you can't run the AppX unless on Windows, nor can you build it unless on Windows
        [
          {
            target: 'nsis',
            arch: process.arch,
          },
          {
            target: 'zip',
            arch: process.arch,
          },
        ],
    artifactName: '${productName}-${version}-Windows-${arch}.${ext}',
  },
  flatpak: {
    runtimeVersion: '23.08',
    baseVersion: '23.08',
  },
  snap: {
    base: 'core22',
    summary: require('./package.json').description,
    grade: process.env.NODE_ENV === 'production' && process.env.CI ? 'stable' : 'devel',
    confinement: 'strict',
    compression: 'xz',
    allowNativeWayland: true,
  },
  beforePack: './beforePack.cjs',
  afterPack: './beforePack.cjs',
  afterAllArtifactBuild: './beforePack.cjs',
  linux: {
    category: 'Utility',
    maintainer: require('./package.json').author.email,
    artifactName: '${productName}-${version}-${arch}.${ext}',
    vendor: require('./package.json').author.name,
    synopsis: require('./package.json').description,
    // Building all these targets take a very very long time
    // target: process.env.CI
    //   ? ['AppImage', 'deb', 'rpm', 'flatpak', 'snap', 'pacman', 'apk', 'freebsd', 'tar.gz']
    //   : ['AppImage'],
    target: process.env.CI
      ? [
          {
            target: 'AppImage',
            arch: ['x64', 'arm64'],
          },
          {
            target: 'deb',
            arch: ['x64', 'arm64'],
          },
          {
            target: 'rpm',
            arch: ['x64', 'arm64'],
          },
          {
            target: 'flatpak',
            arch: ['x64', 'arm64'],
          },
          {
            target: 'snap',
            arch: ['x64', 'arm64'],
          },
          // Only will add these when people request them
          // {
          //   target: 'pacman',
          //   arch: ['x64', 'arm64'],
          // },
          // {
          //   target: 'apk',
          //   arch: ['x64', 'arm64'],
          // },
          // {
          //   target: 'freebsd',
          //   arch: ['x64', 'arm64'],
          // },
          {
            target: 'tar.xz',
            arch: ['x64', 'arm64'],
          },
        ]
      : [
          {
            target: 'AppImage',
            // For development purposes, only build for the current architecture
            // For anyone who wants to build for all architectures &  major platforms, they can just set the CI environment variable
            // Also you don't need run the AppImage to test it your build.
            // Look in the release folder for the unpacked builld for your architecture
            // The great compromise
            arch: process.arch,
          },
        ],
  },
  nsis: {
    oneClick: true,
    perMachine: true,
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: false,
  },
  publish: {
    provider: 'generic',
    channel: 'latest',
    url: 'https://github.com/BrycensRanch/Rokon/releases',
  },
  includePdb: true,
};
