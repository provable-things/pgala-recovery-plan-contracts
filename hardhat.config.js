require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-gas-reporter')
require('@nomicfoundation/hardhat-chai-matchers')

const getEnvironmentVariable = (_envVar) => process.env[_envVar]

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      hardfork: 'petersburg',
    },
    bsc: {
      url: getEnvironmentVariable('BSC_MAINNET_NODE'),
      //accounts: [getEnvironmentVariable('BSC_MAINNET_PRIVATE_KEY')],
      gas: 700000,
      gasPrice: 7e9,
      timeout: 20 * 60 * 1000,
    },
  },
  etherscan: {
    apiKey: getEnvironmentVariable('BSCSCAN_API_KEY'),
  },
  gasReporter: {
    enabled: true,
  },
  mocha: {
    timeout: 200000,
  },
}
