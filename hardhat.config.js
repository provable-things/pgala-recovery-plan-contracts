require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-gas-reporter')
require('@nomicfoundation/hardhat-chai-matchers')
require('./tasks')

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
      accounts: [getEnvironmentVariable('BSC_MAINNET_PRIVATE_KEY')],
      gasPrice: 5e9,
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
