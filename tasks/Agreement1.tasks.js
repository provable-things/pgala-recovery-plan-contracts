const { types } = require('hardhat/config')
const fs = require('fs')
const csvReadableStream = require('csv-reader')

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

task('step1:deploy-agreement', 'Deploy the Agreement')
  .addPositionalParam('ipfsMultihash')
  .addPositionalParam('token')
  .setAction(async (_args, { upgrades }) => {
    const Agreement = await ethers.getContractFactory('Agreement')
    const agreement = await upgrades.deployProxy(Agreement, [_args.ipfsMultihash, _args.token], {
      initializer: 'initialize',
    })
    console.info('Agreement deployed to:', agreement.address)
  })

task('step1:upgrade-agreement', 'Deploy the Agreement')
  .addPositionalParam('agreementAddress')
  .setAction(async (_args, { upgrades }) => {
    const Agreement = await ethers.getContractFactory('Agreement')
    console.info('Upgrading Agreement...')
    await upgrades.upgradeProxy(_args.agreementAddress, Agreement)
    console.info('Agreement upgraded!')
  })

task('step1:set-claim-for-many', 'Initialize amounts to distribute')
  .addPositionalParam('filename')
  .addPositionalParam('agreementAddress')
  .addPositionalParam('chunkSize', types.int)
  .setAction(async (_args) => {
    const rows = await readFile(_args.filename)
    const addresses = rows.map(([_address]) => _address)
    const amounts = rows.map(([_, amount]) => amount)
    const agreement = await ethers.getContractAt('Agreement', _args.agreementAddress)

    const chunkSize = _args.chunkSize
    for (let i = 0, chunk = 0; i < addresses.length; i += chunkSize, chunk++) {
      const addressesChunk = addresses.slice(i, i + chunkSize)
      const amountsChunk = amounts.slice(i, i + chunkSize)

      if (addressesChunk.length !== amountsChunk.length) {
        throw new Error('Invalid length')
      }

      console.info(`setting claims for chunk #${chunk} ...`)
      await agreement.setClaimForMany(addressesChunk, amountsChunk, {
        gasLimit: 35000000,
      })
      console.info(`claims for chunk #${chunk} set!`)
    }
  })

task('step1:verify-claims', 'Verify claimed amounts')
  .addPositionalParam('filename')
  .addPositionalParam('agreementAddress')
  .setAction(async (_args) => {
    const rows = await readFile(_args.filename)
    const addresses = rows.map(([_address]) => _address)
    const amounts = rows.map(([_, amount]) => amount)
    const agreement = await ethers.getContractAt('Agreement', _args.agreementAddress)

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
  })

task('step1:accept-and-claim-many-owner', 'Claim for a third party')
  .addPositionalParam('filename')
  .addPositionalParam('agreementAddress')
  .addPositionalParam('chunkSize', types.int)
  .setAction(async (_args) => {
    const rows = await readFile(_args.filename)
    const addresses = rows.map(([_address]) => _address)
    const agreement = await ethers.getContractAt('Agreement', _args.agreementAddress)

    for (let i = 0, chunk = 0; i < addresses.length; i += _args.chunkSize, chunk++) {
      const addressesChunk = addresses.slice(i, i + _args.chunkSize)

      console.info(`setting claims for chunk #${chunk} ...`)
      await agreement.acceptAndClaimManyOwner(addressesChunk, {
        gasLimit: 40000000,
      })
      console.info(`claims for chunk #${chunk} set!`)
    }
  })
