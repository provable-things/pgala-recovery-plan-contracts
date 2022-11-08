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
BSC_MAINNET_NODE=
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
