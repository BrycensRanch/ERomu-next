const { nodeResolve } = require('@rollup/plugin-node-resolve'),

 { defineConfig } = require('rollup');
const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'));
const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

module.exports = defineConfig({
  input: 'main/background.mts',
  output: {
    dir: './app',
    format: 'cjs',
        sourcemap: true,
            // name: '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED',
            // inlineDynamicImports: true


  },
  external,
  plugins: [require('@rollup/plugin-typescript')(), 
  nodeResolve({
    preferBuiltins: true,
    allowExportsFolderMapping: true,
    // Only include our code, NOT the node_modules (evil)
      // resolveOnly: [/^main$/] // Include only files from the "src" directory

  }),
  // require('rollup-plugin-tla').default(),
   require('@rollup/plugin-commonjs')(
    {
    requireReturnsDefault: 'auto',
    exclude: [
      'main/background.mts'
    ]

  }
  ),
  require('@rollup/plugin-esm-shim')(),
  require('@rollup/plugin-json')(), require('@rollup/plugin-beep')(),
        require('rollup-plugin-natives')({
            // Where we want to physically put the extracted .node files
            copyTo: 'app/node_modules',

            // Path to the same folder, relative to the output bundle js
            destDir: './node_modules',

            // Use `dlopen` instead of `require`/`import`.
            // This must be set to true if using a different file extension that '.node'
            dlopen: false,

            // Modify the final filename for specific modules
            // A function that receives a full path to the original file, and returns a desired filename
            // map: (modulePath) => 'filename.node',

            // OR you can have a function that returns a desired file name and a specific destination to copy to.
            // map: (modulePath) => { name: 'filename.node', copyTo: 'C:\\Dist\\libs\\filename.node' },

            // A transformer function that allows replacing a given node module path with another.
            // This is good for either handling missing files, or dynamically resolving desired architectures etc.
            // originTransform: (path: string, exists: boolean) => (path: string|undefined),
            
            // Generate sourcemap
            sourcemap: true,
            
            // If the target is ESM, so we can't use `require` (and .node is not supported in `import` anyway), we will need to use `createRequire` instead.
            targetEsm: false,
        }),
           require('@rollup/plugin-dynamic-import-vars')()
],
});
