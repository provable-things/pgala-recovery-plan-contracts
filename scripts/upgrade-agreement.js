const { ethers, upgrades } = require('hardhat')

const AGREEMENT = '0xA25E11Cb5FB8a114335010a19eb0D3751C376F5a'

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
