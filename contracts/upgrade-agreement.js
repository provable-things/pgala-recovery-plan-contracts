const { ethers, upgrades } = require('hardhat')

const AGREEMENT = '0x7444125E365AEAf974cBAd104d2E6F100DbBAf10'

const main = async () => {
  const Agreement = await ethers.getContractFactory('Agreement')
  console.info('Upgrading Agreement...')
  await upgrades.upgradeProxy(AGREEMENT, Agreement)
  console.info('Agreement upgraded!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
