const { ethers } = require('hardhat')
const fs = require('fs')
const csvReadableStream = require('csv-reader')
const BigNumber = require('bignumber.js')
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
  const addresses = rows.map(([_address]) => _address).filter((_, _index) => _index > 0)
  const amounts = rows.map(([, _amount]) => _amount).filter((_, _index) => _index > 0)

  const agreement = await ethers.getContractAt('Agreement', address)

  if (addresses.length !== amounts.length) {
    throw new Error('Invalid length')
  }

  let missingClaimedAmount = BigNumber(0)
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    const expectedClaimedAmount = amounts[i]

    const claimedAmountBn = await agreement.getClaimedAmountFor(address)
    const claimedAmount = BigNumber(claimedAmountBn.toString()).dividedBy(10 ** 18)
    if (!BigNumber(claimedAmount.toFixed(2)).isEqualTo(BigNumber(expectedClaimedAmount).toFixed(2))) {
      missingClaimedAmount = missingClaimedAmount.plus(expectedClaimedAmount)
      console.log(`${address},${expectedClaimedAmount}`)
    }
  }

  console.log('Missing claimed amount', missingClaimedAmount.toFixed())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
