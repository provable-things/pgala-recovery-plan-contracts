const { ethers, upgrades } = require('hardhat')

const IPFS_MULTIHASH = 'todo'
const TOKEN = 'todo'

const main = async () => {
  const Agreement = await ethers.getContractFactory('Agreement')

  console.info('Deploying Agreement...')
  const agreement = await upgrades.deployProxy(Agreement, [IPFS_MULTIHASH, TOKEN], {
    initializer: 'initialize',
  })

  console.info('Agreement deployed to:', agreement.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
