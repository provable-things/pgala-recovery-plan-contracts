const { use, expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { solidity } = require('ethereum-waffle')
const singletons = require('erc1820-ethers-registry')
use(solidity)

const IPFS_MULTIHASH = 'QmbpA3P8ZZRtLDnuQrKZAWUWe6xFsbfr3eESwhTtZXdCfW'

let agreement, accounts, account1, pgala

describe('Agreement', () => {
  beforeEach(async () => {
    const Agreement = await ethers.getContractFactory('Agreement')
    const PToken = await ethers.getContractFactory('PToken')

    accounts = await ethers.getSigners()
    account1 = accounts[1]
    await singletons.ERC1820Registry(accounts[0])

    pgala = await PToken.deploy('pToken GALA', 'GALA', ethers.utils.parseEther('100000000'))
    agreement = await upgrades.deployProxy(Agreement, [IPFS_MULTIHASH, pgala.address], {
      initializer: 'initialize',
    })
    await pgala.transfer(agreement.address, ethers.utils.parseEther('10000'))
  })

  it('should be able to set ipfsMultihash', async () => {
    const newTermsHash = 'QmbpA3P8ZZRtLDnuQrKZAWUWe6xFsbfr3eESwhTtZXdCfy'
    await expect(agreement.changeIpfsMultihash(newTermsHash))
      .to.emit(agreement, 'IpfsMultihashChanged')
      .withArgs(newTermsHash)
  })

  it('should not be able to set ipfsMultihash', async () => {
    const newTermsHash = 'QmbpA3P8ZZRtLDnuQrKZAWUWe6xFsbfr3eESwhTtZXdCfy'
    await expect(agreement.connect(account1).changeIpfsMultihash(newTermsHash)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should not be able to setClaimFor', async () => {
    await expect(agreement.connect(account1).setClaimFor(account1.address, '1')).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should not be able to setClaimForMany', async () => {
    await expect(agreement.connect(account1).setClaimForMany([account1.address], ['1'])).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should not acceptAndClaim when amount = 0', async () => {
    await expect(agreement.connect(account1).acceptAndClaim(IPFS_MULTIHASH)).to.be.revertedWithCustomError(
      agreement,
      'NothingToClaim'
    )
  })

  it('should not acceptAndClaim if multihash is wrong', async () => {
    const wrongIpfsHash = 'QmbpA3P8ZZRtLDnuQrKZAWUWe6xFsbfr3eESwhTtZXdCfy'
    await expect(agreement.connect(account1).acceptAndClaim(wrongIpfsHash)).to.be.revertedWithCustomError(
      agreement,
      'InvalidIpfsMultiHash'
    )
  })

  it('should notbe able to deposit pGALA', async () => {
    await pgala.transfer(account1.address, ethers.utils.parseEther('10'))
    await expect(
      pgala.connect(account1).transfer(agreement.address, ethers.utils.parseEther('10'))
    ).to.be.revertedWithCustomError(agreement, 'OnlyOwnerCanDepositToken')
  })

  it('should be able to acceptAndClaim', async () => {
    const amount = '10000'
    const balancePre = await pgala.balanceOf(account1.address)
    expect(await agreement.setClaimFor(account1.address, amount))
      .to.emit(agreement, 'ClaimForSet')
      .withArgs(account1.address, amount)
    expect(await agreement.connect(account1).acceptAndClaim(IPFS_MULTIHASH))
      .to.emit(agreement, 'AcceptedAndClaimed')
      .withArgs(account1.address, IPFS_MULTIHASH, amount)

    const balancePost = await pgala.balanceOf(account1.address)
    expect(balancePre.add(amount)).to.be.eq(balancePost)
  })

  it('should not be able to acceptAndClaim after having already claimed', async () => {
    const amount = '10000'
    expect(await agreement.setClaimFor(account1.address, amount))
      .to.emit(agreement, 'ClaimForSet')
      .withArgs(account1.address, amount)
    expect(await agreement.connect(account1).acceptAndClaim(IPFS_MULTIHASH))
      .to.emit(agreement, 'AcceptedAndClaimed')
      .withArgs(account1.address, IPFS_MULTIHASH, amount)
    await expect(agreement.connect(account1).acceptAndClaim(IPFS_MULTIHASH)).to.be.revertedWithCustomError(
      agreement,
      'NothingToClaim'
    )
  })

  it('should be able to acceptAndClaim in more steps', async () => {
    const amount1 = 10000
    expect(await agreement.setClaimFor(account1.address, amount1))
      .to.emit(agreement, 'ClaimForSet')
      .withArgs(account1.address, amount1)
    expect(await agreement.connect(account1).acceptAndClaim(IPFS_MULTIHASH))
      .to.emit(agreement, 'AcceptedAndClaimed')
      .withArgs(account1.address, IPFS_MULTIHASH, amount1)

    const amount2 = 50000
    const amountClaimable = amount2 - amount1
    expect(await agreement.setClaimFor(account1.address, amount2))
      .to.emit(agreement, 'ClaimForSet')
      .withArgs(account1.address, amount2)
    expect(await agreement.connect(account1).acceptAndClaim(IPFS_MULTIHASH))
      .to.emit(agreement, 'AcceptedAndClaimed')
      .withArgs(account1.address, IPFS_MULTIHASH, amountClaimable)
  })

  it('should be able to acceptAndClaim in more steps for many users', async () => {
    const addresses = []
    const amounts = []
    for (let i = 0; i < 5; i++) {
      addresses[i] = accounts[i + 2].address
      amounts[i] = 10000 * (i + 1)
    }

    await agreement.setClaimForMany(addresses, amounts)

    for (let i = 0; i < 5; i++) {
      expect(await agreement.connect(accounts[i + 2]).acceptAndClaim(IPFS_MULTIHASH))
        .to.emit(agreement, 'AcceptedAndClaimed')
        .withArgs(accounts[i + 2].address, IPFS_MULTIHASH, amounts[i])
    }

    for (let i = 0; i < 5; i++) {
      addresses[i] = accounts[i + 2].address
      amounts[i] = 20000 * (i + 1)
    }

    await agreement.setClaimForMany(addresses, amounts)

    for (let i = 0; i < 5; i++) {
      expect(await agreement.connect(accounts[i + 2]).acceptAndClaim(IPFS_MULTIHASH))
        .to.emit(agreement, 'AcceptedAndClaimed')
        .withArgs(accounts[i + 2].address, IPFS_MULTIHASH, amounts[i] / 2)
    }
  })

  it('should not be able to acceptAndClaim in more steps for many users after having already claimed', async () => {
    const addresses = []
    const amounts = []
    for (let i = 0; i < 5; i++) {
      addresses[i] = accounts[i + 2].address
      amounts[i] = 10000 * (i + 1)
    }

    await agreement.setClaimForMany(addresses, amounts)

    for (let i = 0; i < 5; i++) {
      expect(await agreement.connect(accounts[i + 2]).acceptAndClaim(IPFS_MULTIHASH))
        .to.emit(agreement, 'AcceptedAndClaimed')
        .withArgs(accounts[i + 2].address, IPFS_MULTIHASH, amounts[i])
    }

    for (let i = 0; i < 5; i++) {
      addresses[i] = accounts[i + 2].address
      amounts[i] = 20000 * (i + 1)
    }

    await agreement.setClaimForMany(addresses, amounts)

    for (let i = 0; i < 5; i++) {
      expect(await agreement.connect(accounts[i + 2]).acceptAndClaim(IPFS_MULTIHASH))
        .to.emit(agreement, 'AcceptedAndClaimed')
        .withArgs(accounts[i + 2].address, IPFS_MULTIHASH, amounts[i] / 2)
    }

    for (let i = 0; i < 5; i++) {
      await expect(agreement.connect(accounts[i + 2]).acceptAndClaim(IPFS_MULTIHASH)).to.be.revertedWithCustomError(
        agreement,
        'NothingToClaim'
      )
    }
  })
})