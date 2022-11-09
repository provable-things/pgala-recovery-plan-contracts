const { ethers, upgrades } = require('hardhat')

const IPFS_MULTIHASH = 'QmShGLRoEDbghUWBux6ndGTiBkeoKBrXdR1y1HPGsdkDyv'
const TOKEN = '0x419C44C48Cd346C0b0933ba243BE02af46607c9B'

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
