const fs = require('fs')

const isFile = path => {
  try {
    return fs.lstatSync(path).isFile()
  } catch (e) {
    return false
  }
}

const getAsFile = path => {
  const isDir = fs.existsSync(path) && fs.lstatSync(path).isDirectory()
  const extensions = ['js', 'mjs', 'ts']
  const file = extensions
    .reduce((acc, ext) => {
      acc.push(isDir ? `${path}/index.${ext}` : `${path}.${ext}`)
      return acc
    }, [])
    .filter(f => isFile(f))

  return file.length ? file[0] : false
}

module.exports = (entries = []) => {
  return {
    name: 'alias',
    setup(build) {
      entries.forEach(entry => {
        build.onResolve({ filter: entry.filter }, args => {
          let importPath = args.path.replace(entry.find, entry.replace)
          if (!isFile(importPath)) {
            importPath = getAsFile(importPath)
          }
          if (!importPath) {
            throw new Error(
              `Unable to import: ${args.path}
              importer: ${args.importer}`
            )
          }
          return {
            path: importPath,
          }
        })
      })
    },
  }
}
