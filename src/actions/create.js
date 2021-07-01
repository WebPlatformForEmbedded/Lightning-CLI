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

const path = require('path')
const fs = require('fs-extra')
const replaceInFile = require('replace-in-file')
const execa = require('execa')
const chalk = require('chalk')

const sequence = require('../helpers/sequence')
const ask = require('../helpers/ask')
const exit = require('../helpers/exit')
const spinner = require('../helpers/spinner')
const { fail } = require('../helpers/spinner')

/******* Questions *******/

const askAppName = () =>
  sequence([
    () => ask('What is the name of your Lightning App?', 'My Awesome App'),
    appName => validateAppName(appName),
  ])

const askAppId = () =>
  sequence([
    () =>
      ask('What is the App identifier? (reverse-DNS format)', 'com.metrological.app.myawesomeapp'),
    appId => validateAppId(appId),
  ])

const askAppFolder = appId =>
  sequence([
    () =>
      ask(
        'In what (relative) folder do you want to create the new App? (leave empty to create in current working dir)',
        appId
      ),
    appFolder => validateAppFolder(appFolder),
  ])

const askESlint = () =>
  ask('Do you want to enable ESlint?', null, 'list', ['Yes', 'No']).then(
    // map yes to true and no to false
    val => val === 'Yes'
  )

const askNpmInstall = () =>
  ask('Do you want to install the NPM dependencies now?', null, 'list', ['Yes', 'No']).then(
    // map yes to true and no to false
    val => val === 'Yes'
  )

const askGitInit = () =>
  ask('Do you want to initialize an empty GIT repository?', null, 'list', ['Yes', 'No']).then(
    // map yes to true and no to false
    val => val === 'Yes'
  )

const askConfig = () => {
  const config = {}
  return sequence([
    () => askAppName().then(appName => (config.appName = appName)),
    () => askAppId().then(appId => (config.appId = appId)),
    () => askAppFolder(config.appId).then(folder => (config.appFolder = folder)),
    () => askESlint().then(eslint => (config.eslint = eslint)),
    () => askTypescript().then(ts => (config.typescript = ts)),
    () => config,
  ])
}

const askInstall = config => {
  return sequence([
    () => askNpmInstall().then(npmInstall => (config.npmInstall = npmInstall)),
    () => askGitInit().then(gitInit => (config.gitInit = gitInit)),
    () => config,
  ])
}

const askTypescript = () =>
  ask('Do you want to initialize project with TypeScript?', null, 'list', ['Yes', 'No']).then(
    // map yes to true and no to false
    val => val === 'Yes'
  )

/******* validations *******/

const validateAppId = appId => {
  if (!appId) {
    exit('Please provide an app ID')
  }
  // todo: add possible pre-processing
  // todo: validate if appId matches the requirements
  // todo: validate if appId isn't taken yet (in backoffice)
  return appId
}

const validateAppName = appName => {
  if (!appName) {
    exit('Please provide an app Name')
  }
  // todo: add possible pre-processing
  return appName
}

const validateAppFolder = folder => {
  // todo: validate if folder is correct path / doesn't exist etc.
  return folder
}

/******* Actions *******/

const copyLightningFixtures = config => {
  return new Promise(resolve => {
    const targetDir = path.join(process.cwd(), config.appFolder || '')
    if (config.appFolder && fs.pathExistsSync(targetDir)) {
      exit('The target directory ' + targetDir + ' already exists')
    }

    fs.copySync(path.join(__dirname, '../../fixtures/lightning-app'), targetDir)

    resolve(targetDir)
  })
}

const setAppData = config => {
  replaceInFile.sync({
    files: config.targetDir + '/*',
    from: /\{\$appId\}/g,
    to: config.appId,
  })

  replaceInFile.sync({
    files: config.targetDir + '/*',
    from: /\{\$appName\}/g,
    to: config.appName,
  })
}

const setSdkVersion = config => {
  return new Promise((resolve, reject) => {
    execa('npm', ['view', '@lightningjs/sdk', 'version'])
      .then(({ stdout }) => {
        replaceInFile.sync({
          files: config.targetDir + '/*',
          from: /\{\$sdkVersion\}/g,
          to: '^' + stdout,
        })
        resolve()
      })
      .catch(e => {
        spinner.fail(`Error occurred while setting sdk version\n\n${e}`)
        reject()
      })
  })
}

const addESlint = config => {
  fs.copyFileSync(
    path.join(__dirname, '../../fixtures/eslint/.editorconfig'),
    path.join(config.targetDir, '.editorconfig')
  )
  fs.copyFileSync(
    path.join(__dirname, '../../fixtures/eslint/.eslintignore'),
    path.join(config.targetDir, '.eslintignore')
  )
  fs.copyFileSync(
    path.join(__dirname, '../../fixtures/eslint/.eslintrc.js'),
    path.join(config.targetDir, '.eslintrc.js')
  )

  fs.copySync(path.join(__dirname, '../../fixtures/ide'), path.join(config.targetDir))

  fs.writeFileSync(
    path.join(config.targetDir, 'package.json'),
    JSON.stringify(
      {
        ...JSON.parse(fs.readFileSync(path.join(config.targetDir, 'package.json'))),
        ...JSON.parse(fs.readFileSync(path.join(__dirname, '../../fixtures/eslint/package.json'))),
      },
      null,
      2
    )
  )

  return true
}

const addTypescript = config => {
  fs.copySync(
    path.join(__dirname, '../../fixtures/typescript/src'),
    path.join(config.targetDir, 'src')
  )

  fs.removeSync(path.join(config.targetDir, 'src/App.js'))
  fs.removeSync(path.join(config.targetDir, 'src/index.js'))

  fs.writeFileSync(
    path.join(config.targetDir, 'package.json'),
    JSON.stringify(
      {
        ...JSON.parse(fs.readFileSync(path.join(config.targetDir, 'package.json'))),
        ...JSON.parse(
          fs.readFileSync(path.join(__dirname, '../../fixtures/typescript/package.json'))
        ),
      },
      null,
      2
    )
  )

  return true
}

const createApp = config => {
  spinner.start('Creating Lightning App ' + config.appName)
  return sequence([
    () => copyLightningFixtures(config).then(targetDir => (config.targetDir = targetDir)),
    () => setAppData(config),
    () => setSdkVersion(config),
    () => config.eslint && addESlint(config),
    () => config.typescript && addTypescript(config),
    () =>
      new Promise(resolve => {
        setTimeout(() => {
          spinner.succeed()
          resolve()
        }, 2000)
      }),
    () => config,
  ])
}

const npmInstall = cwd => {
  spinner.start('Installing NPM dependencies')
  return execa('npm', ['install'], { cwd })
    .then(() => spinner.succeed('NPM dependencies installed'))
    .catch(e => spinner.fail(`Error occurred while installing npm dependencies\n\n${e}`))
}

const gitInit = cwd => {
  spinner.start('Initializing empty GIT repository')
  let msg
  return execa('git', ['init'], { cwd })
    .then(({ stdout }) => (msg = stdout))
    .then(() => {
      return fs.copyFileSync(
        path.join(__dirname, '../../fixtures/git/gitignore'),
        path.join(cwd, '.gitignore')
      )
    })
    .then(() => spinner.succeed(msg))
    .catch(e => spinner.fail(`Error occurred while creating git repository\n\n${e}`))
}

const install = config => {
  return sequence([
    () => config.npmInstall && npmInstall(config.targetDir),
    () => config.gitInit && gitInit(config.targetDir),
    () => config,
  ])
}

/******* Logs *******/

const done = config => {
  const label = '⚡️  "' + config.appName + '" successfully created!   ⚡️'

  console.log(' ')
  console.log('='.repeat(label.length))
  console.log(label)
  console.log('='.repeat(label.length))
  console.log(' ')

  console.log('👉  Get started with the following commands:')
  console.log(' ')
  config.appFolder &&
    console.log('   ' + chalk.grey('$') + chalk.yellow(' cd ' + chalk.underline(config.appFolder)))
  console.log('   ' + chalk.grey('$') + chalk.yellow(' lng build'))
  console.log('   ' + chalk.grey('$') + chalk.yellow(' lng serve'))
  console.log(' ')

  return config
}

module.exports = () => {
  sequence([
    askConfig,
    config => createApp(config),
    config => askInstall(config),
    config => install(config),
    config => done(config),
  ])
}
