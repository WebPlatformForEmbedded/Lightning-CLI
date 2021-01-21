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

const spinner = require('./spinner')

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

const copySettings = folder => {
  const file = path.join(process.cwd(), 'settings.json')
  if (fs.existsSync(file)) {
    spinner.start('Copying settings.json to "' + folder.split('/').pop() + '"')
    shell.cp(file, folder)
    spinner.succeed()
  } else {
    spinner.fail()
  }
}

const copyMetadata = folder => {
  const file = path.join(process.cwd(), 'metadata.json')
  if (fs.existsSync(file)) {
    spinner.start('Copying metadata.json to "' + folder.split('/').pop() + '"')
    shell.cp(file, folder)
    spinner.succeed()
  } else {
    spinner.fail()
  }
}

const readMetadata = () => {
  return readJson('metadata.json')
}

const readSettings = () => {
  return readJson('settings.json')
}

const readJson = fileName => {
  return new Promise((resolve, reject) => {
    const file = path.join(process.cwd(), fileName)
    if (fs.existsSync(file)) {
      try {
        resolve(JSON.parse(fs.readFileSync(file, 'utf8')))
      } catch (e) {
        reject(e)
      }
    } else {
      reject('"' + fileName + '" not found')
    }
  })
}

const bundleEs6App = (folder, metadata, options = {}) => {
  spinner.start('Building ES6 appBundle and saving to "' + folder.split('/').pop() + '"')

  const args = [
    '-c',
    path.join(__dirname, '../configs/rollup.es6.config.js'),
    '--input',
    path.join(process.cwd(), 'src/index.js'),
    '--file',
    path.join(folder, 'appBundle.js'),
    '--name',
    makeSafeAppId(metadata),
  ]

  if (options.sourcemaps === false) args.push('--no-sourcemap')

  return execa(path.join(__dirname, '../..', 'node_modules/.bin/rollup'), args)
    .then(() => {
      spinner.succeed()
      return metadata
    })
    .catch(e => {
      spinner.fail('Error while creating ES6 bundle (see log)')
      console.log(e.stderr)
      throw Error(e)
    })
}

const bundleEs5App = (folder, metadata, options = {}) => {
  spinner.start('Building ES5 appBundle and saving to "' + folder.split('/').pop() + '"')

  const args = [
    '-c',
    path.join(__dirname, '../configs/rollup.es5.config.js'),
    '--input',
    path.join(process.cwd(), 'src/index.js'),
    '--file',
    path.join(folder, 'appBundle.es5.js'),
    '--name',
    makeSafeAppId(metadata),
  ]

  if (options.sourcemaps === false) args.push('--no-sourcemap')

  return execa(path.join(__dirname, '../..', 'node_modules/.bin/rollup'), args)
    .then(() => {
      spinner.succeed()
      return metadata
    })
    .catch(e => {
      spinner.fail('Error while creating ES5 bundle (see log)')
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
  if (!fs.existsSync(packageJsonPath)) return true
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
}
