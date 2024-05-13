/* eslint-disable import/no-import-module-exports */
// Convert to imports
import { writeFile, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import osName from 'os-name';
import gitUtil from 'npm-git-properties';
// import packageJson from './package.json' assert { type: "json" } ;
import { createRequire } from 'node:module';
import getOS from 'getos';


const packageJson = createRequire(import.meta.url)('./package.json'),
// Use util.promisify to convert the callback-based getos function to a promise-based function
// eslint-disable-next-line no-undef
 promiseGetOS = promisify(getOS),
  divider = '================================',
  __dirname = new URL('.', import.meta.url).pathname;

// util = require('node:util');
// var {PlatformPackager} = require('electron');
// let positionInBuilder = 0;

function getUsername() {
  return (
    process.env.SUDO_USER ||
    process.env.C9_USER ||
    process.env.LOGNAME ||
    process.env.USER ||
    process.env.LNAME ||
    process.env.USERNAME
  );
}
const beforePack = async _context => {
    console.log(divider);

    // console.log(process.env, process.argv);
    // console.log('befrePack', context);
  },
  afterAllArtifactBuild = async _buildResult => {
    // console.log('afterAllArtifactBuild', buildResult)
    console.log(divider);
  },
  afterPack = async context => {
    let distroInfo;
    if (process.platform === 'linux') distroInfo = await promiseGetOS().catch(() => null);
    console.log(divider);
    // copy LICENSE.md to context.appOutDir

    writeFile(join(context.appOutDir, 'LICENSE.md'), readFileSync(join(__dirname, 'LICENSE.md'), 'utf8'), error => {
      if (error) console.error(error);
    });
    // copy package.json to context.appOutDir

    writeFile(join(context.appOutDir, 'resources', 'package.json'), JSON.stringify(packageJson, null, 2), error => {
      if (error) console.error(error);
    });
    // console.log(process.env, process.argv);
    // console.log('afterPack', context);
    // console.log(`If I had to guess, I am currently building for ${context.targets[positionInBuilder].name}`);
    const buildInfo = {
      build: {
        time: Date.now(),
        number: process.env.GITHUB_RUN_NUMBER || process.env.BUILD_NUMBER,
        url: process.env.GITHUB_SERVER_URL
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_NUMBER}`
          : process.env.JOB_URL || process.env.BUILD_URL,
        CI: process.env.CI,
        builtBy: getUsername(),
        builtFor: context.packager.platform.name,
        endUserPlatform: context.electronPlatformName,
        createdWith: `Node ${process.version}`,
        workflow: process.env.GITHUB_WORKFLOW,
        builderOS:
          process.platform === 'linux' && distroInfo
            ? `${process.arch} ${distroInfo.dist} ${distroInfo.release} (${distroInfo.codename})`
            : `${process.arch} ${osName()}`,
        repo: process.env.GITHUB_REPOSITORY,
        versions: process.versions,
        event: process.env.GITHUB_EVENT_NAME,
        workspace: process.env.GITHUB_WORKSPACE,
        runID: process.env.GITHUB_RUN_ID,
        action: process.env.GITHUB_ACTION,
        isCodeSpace: process.env.CODESPACES,
        codeSpace: process.env.CODESPACE_NAME,
        gitpod: process.env.GITPOD_WORKSPACE_CONTEXT_URL,
        gitpodID: process.env.GITPOD_WORKSPACE_ID,
        gitpodWorkspaceID: process.env.GITPOD_WORKSPACE_URL,
      },
      package: packageJson,
    };
    writeFile(
      join(context.appOutDir, 'metadata.json'),
      JSON.stringify({ ...JSON.parse(gitUtil.gitInfoAsJson()), ...buildInfo }),
      error => {
        if (error) throw error;
      },
    );
    // positionInBuilder++;
    //     attributes["Build-Number"] = System.getenv("GITHUB_RUN_NUMBER") ?: "0"
    //     attributes["Build-Url"] = System.getenv("GITHUB_SERVER_URL")?.let { serverUrl ->
    //       System.getenv("GITHUB_REPOSITORY")?.let { repo ->
    //       System.getenv("GITHUB_RUN_NUMBER")?.let { runNumber ->
    //       "$serverUrl/$repo/actions/runs/$runNumber"
    //     }
    //     }
    //     } ?: "null"
    //     attributes["Created-By"] = "Gradle ${gradle.gradleVersion}"
    //     attributes["Build-Workflow"] = System.getenv("GITHUB_WORKFLOW") ?: "null"
    //     attributes["Build-Actor"] = System.getenv("GITHUB_ACTOR") ?: "null"
    //     attributes["Build-Runner"] = System.getenv("RUNNER_NAME") ?: "null"
    //     attributes["Build-OS"] = System.getenv("RUNNER_OS") ?: "null"
    //     attributes["Build-Repository"] = System.getenv("GITHUB_REPOSITORY") ?: "null"
    //     attributes["Build-Event"] = System.getenv("GITHUB_EVENT_NAME") ?: "null"
    //     attributes["Build-Workspace"] = System.getenv("GITHUB_WORKSPACE") ?: "null"
    //     attributes["Build-Run-Id"] = System.getenv("GITHUB_RUN_ID") ?: "null"
    //     attributes["Build-Ref"] = System.getenv("GITHUB_REF") ?: "null"
    //     attributes["Build-Head-Ref"] = System.getenv("GITHUB_HEAD_REF") ?: "null"
    //     attributes["Build-Base-Ref"] = System.getenv("GITHUB_BASE_REF") ?: "null"
    //     attributes["Build-Sha"] = System.getenv("GITHUB_SHA") ?: "null"
    //     attributes["Build-PR"] = System.getenv("GITHUB_PR_NUMBER") ?: "null"
    //     attributes["Build-Tag"] = System.getenv("GITHUB_TAG") ?: "null"
    //     attributes["Build-Branch"] = System.getenv("GITHUB_BRANCH") ?: "null"
    // //    attributes["Build-Revision"] = (project.extra["gitProps"] as Map<String, String>)["git.commit.id"]!!
    //     attributes["Build-Action"] = System.getenv("GITHUB_ACTION") ?: "null"
    //     attributes["Build-Is-Codespace"] = System.getenv("CODESPACES") ?: "no"
    //     attributes["Build-Codespace-Name"] = System.getenv("CODESPACE_NAME") ?: "null"
    //     attributes["Build-Gitpod-Repository"] = System.getenv("GITPOD_WORKSPACE_CONTEXT_URL") ?: "null"
    //     attributes["Build-Gitpod-Id"] = System.getenv("GITPOD_WORKSPACE_ID") ?: "null"
    //
    //     attributes["Build-Gitpod-Url"] = System.getenv("GITPOD_WORKSPACE_URL") ?: "null"
  };
export { beforePack, afterPack, afterAllArtifactBuild };
