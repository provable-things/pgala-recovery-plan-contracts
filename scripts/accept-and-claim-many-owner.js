const { ethers } = require('hardhat')
const fs = require('fs')
const csvReadableStream = require('csv-reader')
const inquirer = require('inquirer')

const CHUNK_SIZE = 300

const readFile = (_filename) =>
  new Promise((_resolve) => {
    const inputStream = fs.createReadStream(_filename, 'utf8')
    const rows = []
    inputStream
      .pipe(new csvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
      .on('data', (_row) => {
        rows.push(_row)
      })
      .on('end', () => {
        _resolve(rows)
      })
  })

const main = async () => {
  const { filename } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filename',
      message: 'Enter file name ...',
    },
  ])
  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: 'Enter the Agreement address ...',
    },
  ])
  const rows = await readFile(filename)
  const addresses = rows.map(([_address]) => _address)
  const agreement = await ethers.getContractAt('Agreement', address)

  for (let i = 0, chunk = 0; i < addresses.length; i += CHUNK_SIZE, chunk++) {
    const addressesChunk = addresses.slice(i, i + CHUNK_SIZE)

    console.info(`setting claims for chunk #${chunk} ...`)
    await agreement.acceptAndClaimManyOwner(addressesChunk, {
      gasLimit: 40000000,
    })
    console.info(`claims for chunk #${chunk} set!`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
