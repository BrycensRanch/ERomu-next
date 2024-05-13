const gitUtil = require('npm-git-properties'),
 {writeFile, readFile} = require('node:fs/promises'),
 {join} = require('node:path');

/* eslint-disable unicorn/no-await-expression-member */
module.exports = {
  beforePack: async (context) => {
  (await import('./beforePack.mjs')).beforePack(context);
},
afterPack: async (context) => {
  await (await import('./beforePack.mjs')).afterPack(context);
     // npm-git-properties requires a commonjs environment to work
     // I am too lazy to PR the package to support ESM.
      await writeFile(
      join(context.appOutDir, 'metadata.json'),
      JSON.stringify({ ...JSON.parse(gitUtil.gitInfoAsJson()), ...JSON.parse(await readFile(join(context.appOutDir, 'metadata.json'), 'utf8')) })
    );

  
},
afterAllArtifactBuild: async (buildResult) => {
  (await import('./beforePack.mjs')).afterAllArtifactBuild(buildResult);
}

};