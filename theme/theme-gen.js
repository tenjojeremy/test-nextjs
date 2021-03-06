const fs = require('fs')
const glob = require('glob')
const emoji = require('node-emoji')

let fileString = ''

glob(`theme/**/*.string.js`, async function(err, files) {
  files.map(async (file) => {
    let fileName = file.split('/')
    fileName.shift()
    fileName = fileName.join('/')

    try {
      const mod = require(`./${fileName}`)
      fileString += mod.default
    } catch (error) {
      console.log(error)
    }
  })

  // 2. create snipet file and attach created snippets
  fs.writeFile('theme/theme.css', fileString, function(err) {
    if (err) throw err
    console.log(`${emoji.get('white_check_mark')}  Theme file created`)
  })
})
