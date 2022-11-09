const { ethers } = require('hardhat')
const fs = require('fs')
const csvReadableStream = require('csv-reader')
const BigNumber = require('bignumber.js')
const inquirer = require('inquirer')

const AGREEMENT = '0xA25E11Cb5FB8a114335010a19eb0D3751C376F5a'
const CHUNK_SIZE = 1000

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
  const rows = await readFile(filename)
  const addresses = rows.map(([_address]) => _address)
  const amounts = rows.map(([, _amount]) => BigNumber(_amount).multipliedBy(10 ** 18).toFixed())

  const agreement = await ethers.getContractAt('Agreement', AGREEMENT)
  
  if (addresses.length !== amounts.length) {
    throw new Error('Invalid length')
  }

  // just for testing
  /*console.log(
    amounts.reduce((_acc, _amount) => {
      _acc = BigNumber(_acc).plus(_amount).toFixed()
      return _acc
    },0)
  )*/
    
  for (let i = 0, chunk = 0; i < addresses.length; i += CHUNK_SIZE, chunk++) {
      const addressesChunk = addresses.slice(i, i + CHUNK_SIZE);
      const amountsChunk = amounts.slice(i, i + CHUNK_SIZE);

      if (addressesChunk.length !== amountsChunk.length) {
        throw new Error('Invalid length')
      }

      console.info(`setting claims for chunk #${chunk} ...`)
      await agreement.setClaimForMany(addressesChunk, amountsChunk, {
        gasLimit: 35000000,
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