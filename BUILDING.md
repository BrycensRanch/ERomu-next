# Contributing to Rokon

Thank you for your interest in contributing to Rokon! We appreciate your help in making our Roku remote app even better.

## Prerequisites

Before you start contributing, please make sure you have the following:

- [Node.js](https://nodejs.org) installed
- [Yarn](https://yarnpkg.com) package manager installed
- [Git](https://git-scm.com) installed
- [Roku device](https://www.roku.com/products/roku-tv) (for testing, not required for building)
- [Python 3.11](https://www.python.org/downloads/release/python-3110/) installed, do NOT use any other version! If your system has a different version installed, you can use [pyenv](https://github.com/pyenv/pyenv) or [linuxbrew](https://docs.brew.sh/Homebrew-on-Linux) for Linux/MacOS.
- If on Linux, [WINE](https://winehq.org) for building the Windows installer (if you want to build for Windows)
- Patience and a willingness to learn

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-electron-app.git
```

2. Install dependencies:

```bash
cd your-electron-app
yarn install
```

3. Run the app in development mode:

```bash
yarn start
```

Note: To test the development version of the app, you will need a Roku device.

## Building the App

To build the app without testing on a Roku device, run the following command:
