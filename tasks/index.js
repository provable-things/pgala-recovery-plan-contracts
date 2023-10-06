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

task('step2:deploy-agreement', 'Deploy the Agreement2')
  .addPositionalParam('ipfsMultihash')
  .setAction(async (_args, { upgrades }) => {
    const Agreement = await ethers.getContractFactory('Agreement2')
    const agreement = await upgrades.deployProxy(Agreement, [_args.ipfsMultihash], {
      initializer: 'initialize',
    })
    console.info('Agreement deployed to:', agreement.address)
  })

task('step2:set-claim-for-many', 'Initialize BNB amount to distribute')
  .addPositionalParam('filename')
  .addPositionalParam('agreementAddress')
  .addPositionalParam('chunkSize')
  .setAction(async (_args) => {
    const rows = await readFile(_args.filename)
    const addresses = rows.map(([_address]) => _address)
    const amounts = rows.map(([_, amount]) => amount)
    const agreement = await ethers.getContractAt('Agreement2', _args.agreementAddress)

    const chunkSize = _args.chunkSize
    for (let i = 0, chunk = 0; i < addresses.length; i += chunkSize, chunk++) {
      const addressesChunk = addresses.slice(i, i + chunkSize)
      const amountsChunk = amounts.slice(i, i + chunkSize)

      if (addressesChunk.length !== amountsChunk.length) {
        throw new Error('Invalid length')
      }

      console.info(`setting claims for chunk #${chunk} ...`)
      /*await agreement.setClaimForMany(addressesChunk, amountsChunk, {
        gasLimit: 35000000,
      })*/
      console.info(`claims for chunk #${chunk} set!`)
    }
  })
