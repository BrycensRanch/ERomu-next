/* eslint-disable global-require */
/* eslint-disable unicorn/prevent-abbreviations */
// i-hate-windows.js exists because of the following:
// The electron-builder.js  file conflicts with the electron-builder npm package on Windows and causes the installation of the project to fail.
// The Windows user must configure Windows to run Node.js instead of VBScript by default. If the user doesn't, they will run into issues with electron-builder.

// DId I forget to mention I hate Windows?

const divider = '=================================================================\n\n',

  ensureCompatibilityWithWindows = () => {
      if (process.platform !== 'win32') return;
      console.warn(divider);
      console.warn('WARNING: YOU MUST CONFIGURE WINDOWS TO RUN NODEJS INSTEAD OF VBSCRIPT BY DEFAULT.\n\nIF YOU DON\'T YOU\'LL RUN INTO ISSUES WITH ELECTRON-BUILDER.\n\n');
      console.warn('Look at this example https://github.com/ficonsulting/RInno/issues/44#issuecomment-992299431 for more information on how to do this.');
      console.warn(divider);
  };

ensureCompatibilityWithWindows();
