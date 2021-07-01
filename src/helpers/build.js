/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2020 Metrological
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const shell = require('shelljs')
const fs = require('fs')
const execa = require('execa')
const path = require('path')
const chalk = require('chalk')
const concat = require('concat')
const os = require('os')
const esbuild = require('esbuild')
const spinner = require('./spinner')
const isLocallyInstalled = require('./localinstallationcheck')
const exit = require('./exit')

const removeFolder = folder => {
  spinner.start('Removing "' + folder.split('/').pop() + '" folder')
  shell.rm('-rf', folder)
  spinner.succeed()
}

const ensureFolderExists = folder => {
  spinner.start('Ensuring "' + folder.split('/').pop() + '" folder exists')
  shell.mkdir('-p', folder)
  spinner.succeed()
}

const copySupportFiles = folder => {
  spinner.start('Copying support files to "' + folder.split('/').pop() + '"')

  if (hasNewSDK()) {
    shell.cp('-r', path.join(process.cwd(), 'node_modules/@lightningjs/sdk/support/*'), folder)
  } else {
    shell.cp('-r', path.join(process.cwd(), 'node_modules/wpe-lightning-sdk/support/*'), folder)
  }

  const command = process.argv.pop()

  // if live reload is enabled we write the client WebSocket logic
  // to index.html
  if (process.env.LNG_LIVE_RELOAD === 'true' && command === 'dev') {
    const port = process.env.LNG_LIVE_RELOAD_PORT || 8991
    const file = path.join(folder, 'index.html')
    const data = fs.readFileSync(file, { encoding: 'utf8' })
    const wsData = `
      <script>
        var socket = new WebSocket('ws://localhost:${port}');
        socket.addEventListener('open', function() {
          console.log('WebSocket connection succesfully opened - live reload enabled');
        });
        socket.addEventListener('close', function() {
          console.log('WebSocket connection closed - live reload disabled');
        });
        socket.addEventListener('message', function(event) {
          if(event.data === 'reload'){
            document.location.reload();
          }
        });
      </script>
    </body>`
    fs.writeFileSync(file, data.replace(/<\/body>/gi, wsData))
  }

  spinner.succeed()
}

const copyStaticFolder = folder => {
  spinner.start('Copying static assets to "' + folder.split('/').pop() + '"')
  shell.cp('-r', './static', folder)
  spinner.succeed()
}

const copySrcFolder = folder => {
  shell.cp('-r', './src', folder)
}

const copySettings = (settingsFile = 'settings.json', folder) => {
  const file = path.join(process.cwd(), settingsFile)
  if (fs.existsSync(file)) {
    spinner.start(`Copying ${settingsFile} to "${folder.split('/').pop()}"`)
    shell.cp(file, folder + '/settings.json')
    spinner.succeed()
  } else {
    spinner.warn(
      `Settings file not found at the ${process.cwd()}, so switching to default settings file`
    )
  }
}

const copyMetadata = folder => {
  const file = path.join(process.cwd(), 'metadata.json')
  if (fs.existsSync(file)) {
    spinner.start('Copying metadata.json to "' + folder.split('/').pop() + '"')
    shell.cp(file, folder)
    spinner.succeed()
  } else {
    spinner.warn(`Metadata file not found at the ${process.cwd()}`)
  }
}

const readMetadata = () => {
  return readJson('metadata.json')
}

const readSettings = (settingsFileName = 'settings.json') => {
  return readJson(settingsFileName)
}

const readJson = fileName => {
  return new Promise((resolve, reject) => {
    const file = path.join(process.cwd(), fileName)
    if (fs.existsSync(file)) {
      try {
        resolve(JSON.parse(fs.readFileSync(file, 'utf8')))
      } catch (e) {
        spinner.fail(`Error occurred while reading ${file} file\n\n${e}`)
        reject(e)
      }
    } else {
      spinner.fail(`File not found error occurred while reading ${file} file`)
      reject('"' + fileName + '" not found')
    }
  })
}

const bundleEs6App = (folder, metadata, options = {}) => {
  if (process.env.LNG_BUNDLER === 'esbuild') {
    return buildAppEsBuild(folder, metadata, 'es6', options)
  } else {
    return bundleAppRollup(folder, metadata, 'es6', options)
  }
}

const bundleEs5App = (folder, metadata, options = {}) => {
  if (process.env.LNG_BUNDLER === 'esbuild') {
    return buildAppEsBuild(folder, metadata, 'es5', options)
  } else {
    return bundleAppRollup(folder, metadata, 'es5', options)
  }
}

const buildAppEsBuild = async (folder, metadata, type) => {
  spinner.start(
    `Building ${type.toUpperCase()} appBundle using [esbuild] and saving to ${folder
      .split('/')
      .pop()}`
  )
  try {
    const getConfig = require(`../configs/esbuild.${type}.config`)
    await esbuild.build(getConfig(folder, makeSafeAppId(metadata)))
    spinner.succeed()
    return metadata
  } catch (e) {
    spinner.fail(`Error while creating ${type.toUpperCase()} bundle using [esbuild] (see log)`)
    console.log(e.stderr)
    throw Error(e)
  }
}

const bundleAppRollup = (folder, metadata, type, options) => {
  spinner.start(`Building ${type.toUpperCase()} appBundle and saving to ${folder.split('/').pop()}`)

  const enterFile = fs.existsSync(path.join(process.cwd(), 'src/index.ts'))
    ? 'src/index.ts'
    : 'src/index.js'

  const args = [
    '-c',
    path.join(__dirname, `../configs/rollup.${type}.config.js`),
    '--input',
    path.join(process.cwd(), enterFile),
    '--file',
    path.join(folder, type === 'es6' ? 'appBundle.js' : 'appBundle.es5.js'),
    '--name',
    makeSafeAppId(metadata),
  ]

  if (options.sourcemaps === false) args.push('--no-sourcemap')

  const levelsDown = isLocallyInstalled() ? '../../../../..' : '../..'
  return execa(path.join(__dirname, levelsDown, 'node_modules/.bin/rollup'), args)
    .then(() => {
      spinner.succeed()
      return metadata
    })
    .catch(e => {
      spinner.fail(`Error while creating ${type.toUpperCase()} bundle (see log)`)
      console.log(e.stderr)
      throw Error(e)
    })
}

const getEnvAppVars = (parsed = {}) =>
  Object.keys(parsed)
    .filter(key => key.startsWith('APP_'))
    .reduce((env, key) => {
      env[key] = parsed[key]
      return env
    }, {})

const bundlePolyfills = folder => {
  spinner.start('Bundling ES5 polyfills and saving to "' + folder.split('/').pop() + '"')

  const nodeModulesPath = hasNewSDK()
    ? path.join(process.cwd(), 'node_modules/@lightningjs/sdk')
    : path.join(process.cwd(), 'node_modules/wpe-lightning-sdk/')

  const pathToPolyfills = path.join(nodeModulesPath, 'support/polyfills')

  const polyfills = fs.readdirSync(pathToPolyfills).map(file => path.join(pathToPolyfills, file))

  return concat(polyfills, path.join(folder, 'polyfills.js')).then(() => {
    spinner.succeed()
  })
}

const ensureCorrectGitIgnore = () => {
  return new Promise(resolve => {
    const filename = path.join(process.cwd(), '.gitignore')
    try {
      const gitIgnoreEntries = fs.readFileSync(filename, 'utf8').split(os.EOL)
      const missingEntries = [
        process.env.LNG_BUILD_FOLDER || 'dist',
        'releases',
        '.tmp',
        process.env.LNG_BUILD_FOLDER || 'build',
      ].filter(entry => gitIgnoreEntries.indexOf(entry) === -1)

      if (missingEntries.length) {
        fs.appendFileSync(filename, os.EOL + missingEntries.join(os.EOL) + os.EOL)
      }

      resolve()
    } catch (e) {
      // no .gitignore file, so let's just move on
      resolve()
    }
  })
}

const ensureCorrectSdkDependency = () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = require(packageJsonPath)
  // check if package.json has old WebPlatformForEmbedded sdk dependency
  if (
    packageJson &&
    packageJson.dependencies &&
    Object.keys(packageJson.dependencies).indexOf('wpe-lightning-sdk') > -1 &&
    packageJson.dependencies['wpe-lightning-sdk']
      .toLowerCase()
      .indexOf('webplatformforembedded/lightning-sdk') > -1
  ) {
    let lockedDependency
    // if already has a hash, use that one (e.g. from a specific branch)
    if (packageJson.dependencies['wpe-lightning-sdk'].indexOf('#') > -1) {
      lockedDependency = packageJson.dependencies['wpe-lightning-sdk']
    }
    // otherwise attempt to get the locked dependency from package-lock
    else {
      const packageLockJsonPath = path.join(process.cwd(), 'package-lock.json')
      if (!fs.existsSync(packageLockJsonPath)) return true
      const packageLockJson = require(packageLockJsonPath)
      // get the locked version from package-lock
      if (
        packageLockJson &&
        packageLockJson.dependencies &&
        Object.keys(packageLockJson.dependencies).indexOf('wpe-lightning-sdk') > -1
      ) {
        lockedDependency = packageLockJson.dependencies['wpe-lightning-sdk'].version
      }
    }

    if (lockedDependency) {
      // replace WebPlatformForEmbedded organization with rdkcentral organization (and keep locked hash)
      lockedDependency = lockedDependency.replace(/WebPlatformForEmbedded/gi, 'rdkcentral')
      if (lockedDependency) {
        spinner.start(
          'Moving SDK dependency from WebPlatformForEmbedded organization to RDKcentral organization'
        )
        // install the new dependency
        return execa('npm', ['install', lockedDependency])
          .then(() => {
            spinner.succeed()
          })
          .catch(e => {
            spinner.fail()
            console.log(chalk.red('Unable to automatically move the SDK dependency'))
            console.log(
              'Please run ' +
                chalk.yellow('npm install ' + lockedDependency) +
                ' manually to continue'
            )
            console.log(' ')
            throw Error(e)
          })
      }
    }
  }
}

const getAppVersion = () => {
  return require(path.join(process.cwd(), 'metadata.json')).version
}

const getSdkVersion = () => {
  const packagePath = hasNewSDK()
    ? 'node_modules/@lightningjs/sdk'
    : 'node_modules/wpe-lightning-sdk'
  return require(path.join(process.cwd(), packagePath, 'package.json')).version
}

const getCliVersion = () => {
  return require(path.join(__dirname, '../../package.json')).version
}
const makeSafeAppId = metadata =>
  ['APP', metadata.identifier && metadata.identifier.replace(/\./g, '_').replace(/-/g, '_')]
    .filter(val => val)
    .join('_')

const hasNewSDK = () => {
  const dependencies = Object.keys(require(path.join(process.cwd(), 'package.json')).dependencies)
  return dependencies.indexOf('@lightningjs/sdk') > -1
}
const ensureLightningApp = () => {
  return new Promise(resolve => {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      exit(`Package.json is not available at ${process.cwd()}. Build process cannot be proceeded`)
    }
    const packageJson = require(packageJsonPath)
    if (
      packageJson.dependencies &&
      (Object.keys(packageJson.dependencies).indexOf('wpe-lightning-sdk') > -1 ||
        Object.keys(packageJson.dependencies).indexOf('@lightningjs/sdk') > -1)
    ) {
      resolve()
    } else {
      exit('Please make sure you are running the command in the Application directory')
    }
  })
}

const getSettingsFileName = () => {
  let settingsFileName = 'settings.json'
  if (process.env.LNG_SETTINGS_ENV) {
    const envSettingsFileName = `settings.${process.env.LNG_SETTINGS_ENV}.json`
    if (fs.existsSync(path.join(process.cwd(), envSettingsFileName))) {
      settingsFileName = envSettingsFileName
    } else {
      spinner.fail(
        chalk.red(
          `Settings file ${envSettingsFileName} not available in project home, hence switching to default settings`
        )
      )
    }
  }
  return settingsFileName
}

module.exports = {
  removeFolder,
  ensureFolderExists,
  copySupportFiles,
  copyStaticFolder,
  copySrcFolder,
  copySettings,
  copyMetadata,
  readMetadata,
  readSettings,
  bundleEs6App,
  bundleEs5App,
  getEnvAppVars,
  ensureCorrectGitIgnore,
  ensureCorrectSdkDependency,
  getAppVersion,
  getSdkVersion,
  getCliVersion,
  bundlePolyfills,
  makeSafeAppId,
  hasNewSDK,
  ensureLightningApp,
  getSettingsFileName,
}
