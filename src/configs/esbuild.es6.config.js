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

const buildHelpers = require('../helpers/build')
const os = require('os')
const alias = require('../plugins/esbuild-alias')
const path = require('path')
const dotenv = require('dotenv')

module.exports = (folder, globalName) => {
  const sourcemap =
    process.env.LNG_BUILD_SOURCEMAP === 'true'
      ? true
      : process.env.LNG_BUILD_SOURCEMAP === 'inline'
      ? 'inline'
      : false

  //Load .env config every time build is triggered
  const dotEnvConfig = dotenv.config()
  const appVars = {
    NODE_ENV: process.env.NODE_ENV,
    ...buildHelpers.getEnvAppVars(dotEnvConfig.parsed)
  }
  const keys = Object.keys(appVars)
  const defined = keys.reduce((acc, key) => {
    acc[`process.env.${key}`] = `"${appVars[key]}"`
    return acc
  }, {})

  return {
    plugins: [
      alias([
        { find: '@', filter: /@\//, replace: path.resolve(process.cwd(), 'src/') },
        { find: '~', filter: /~\//, replace: path.resolve(process.cwd(), 'node_modules/') },
        {
          find: 'wpe-lightning',
          filter: /^wpe-lightning$/,
          replace: path.join(__dirname, '../alias/wpe-lightning.js'),
        },
      ]),
    ],
    entryPoints: [`${process.cwd()}/src/index.js`],
    bundle: true,
    outfile: `${folder}/appBundle.js`,
    mainFields: ['module', 'main', 'browser'],
    minifyWhitespace: true,
    sourcemap,
    format: 'iife',
    define: defined,
    target: process.env.LNG_BUNDLER_TARGET || '',
    globalName,
    banner: [
      '/*',
      ` App version: ${buildHelpers.getAppVersion()}`,
      ` SDK version: ${buildHelpers.getSdkVersion()}`,
      ` CLI version: ${buildHelpers.getCliVersion()}`,
      '',
      ` gmtDate: ${new Date().toGMTString()}`,
      '*/',
    ].join(os.EOL),
  }
}
