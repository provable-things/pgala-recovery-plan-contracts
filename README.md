# pgala-recovery-plan-contracts

pGALA recovery plan contracts

&nbsp;

***

&nbsp;

## :guardsman: Smart Contract Tests

```
❍ npm install
```

```
❍ npm run test
```


&nbsp;

***

&nbsp;

## :white_check_mark: How to publish & verify

Create an __.env__ file with the following fields:

```
MAINNET_PRIVATE_KEY=
ROPSTEN_PRIVATE_KEY=
ROSPTENT_NODE=
ETH_MAINNET_NODE=
BSC_MAINNET_NODE=
ETHERSCAN_API_KEY=
BSCSCAN_API_KEY=
BSC_MAINNET_PRIVATE_KEY=
```


### publish


```
❍ npx hardhat run --network mainnet scripts/deploy-script.js
```

### verify

```
❍ npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```
