# TypeScript SDK for cheqd

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/cheqd/sdk?color=green&label=stable%20release&style=flat-square)](https://github.com/cheqd/sdk/releases/latest) ![GitHub Release Date](https://img.shields.io/github/release-date/cheqd/sdk?color=green&style=flat-square) [![GitHub license](https://img.shields.io/github/license/cheqd/sdk?color=blue&style=flat-square)](https://github.com/cheqd/sdk/blob/main/LICENSE)

[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/cheqd/sdk?include_prereleases&label=dev%20release&style=flat-square)](https://github.com/cheqd/sdk/releases/) ![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/cheqd/sdk/latest?style=flat-square) [![GitHub contributors](https://img.shields.io/github/contributors/cheqd/sdk?label=contributors%20%E2%9D%A4%EF%B8%8F&style=flat-square)](https://github.com/cheqd/sdk/graphs/contributors)

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cheqd/sdk/dispatch.yml?label=workflows&style=flat-square)](https://github.com/cheqd/sdk/actions/workflows/dispatch.yml) [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cheqd/sdk/codeql.yml?label=CodeQL&style=flat-square)](https://github.com/cheqd/sdk/actions/workflows/codeql.yml) ![GitHub repo size](https://img.shields.io/github/repo-size/cheqd/sdk?style=flat-square)

## ℹ️ Overview

The purpose of this [`@cheqd/sdk` NPM package](https://www.npmjs.com/package/@cheqd/sdk) is to provide base functionality for interacting with cheqd network. It combines the [Decentralized Identifier (DID)](https://docs.cheqd.io/product/architecture/adr-list/adr-001-cheqd-did-method) and [DID-Linked Resources](https://docs.cheqd.io/product/studio/did-linked-resources) modules, putting them into a Cosmos transaction wrapper using [CosmJS](https://github.com/cosmos/cosmjs).

This package is consumed by other SDKs/libraries such as [Veramo SDK for cheqd](https://docs.cheqd.io/product/sdk/veramo) and [Credo](https://github.com/openwallet-foundation/credo-ts) to add cheqd network support.

This package includes:

* [TypeScript Protobuf definitions](https://github.com/cheqd/ts-proto) for custom cheqd Cosmos SDK modules
* [CosmJS](https://github.com/cosmos/cosmjs), for base Cosmos SDK module functions

## 🆔 Features

Our identity documentation site provides [tutorials for utilising the identity features](https://docs.cheqd.io/product) on cheqd network.

With this SDK, developers are able to:

* ✅ Create a `did:cheqd` method [DID](https://docs.cheqd.io/product/architecture/adr-list/adr-001-cheqd-did-method)
* ✅ Update a `did:cheqd` method [DID](https://docs.cheqd.io/product/architecture/adr-list/adr-001-cheqd-did-method)
* ✅ Deactivate a `did:cheqd` method [DID](https://docs.cheqd.io/product/architecture/adr-list/adr-001-cheqd-did-method)
* ✅ Create or update [a DID-Linked Resource](https://docs.cheqd.io/product/studio/did-linked-resources)

### 🧰 Tooling

* ✅ **Raw payload creator**: Enables users to generate a valid raw DID payload which is ready to be populated, depending on the use case. For example, `did-provider-cheqd` leverages this helper in the CLI application.
* ✅ **Identity key converter**: Enables users to convert specific key formats from different kinds of SDKs, by transforming the input keys into valid sign inputs for a cheqd specific DID transaction (e.g. `createDidDocTx`, `updateDidDocTx`). For example, the Veramo SDK for cheqd uses this helper to enable users to pass a key in a Veramo SDK specific format to a cheqd sign input keys interface.

## 💰 Fee Abstraction

The Cheqd SDK provides comprehensive fee abstraction functionality that allows users to pay transaction fees using IBC tokens from other chains instead of native CHEQ tokens. This feature enables cross-chain interoperability and improved user experience by allowing users to transact without holding native tokens.

### Overview

Fee abstraction on Cheqd enables:

* **Cross-chain fee payments**: Pay transaction fees using tokens from other Cosmos chains
* **Host zone management**: Add and configure supported chains for fee abstraction
* **Automatic token swaps**: Convert IBC tokens to CHEQ for fee payment behind the scenes
* **Module account funding**: Provide liquidity for fee abstraction operations

### 📁 Module Files

The fee abstraction functionality is implemented in the following files:

**CJS (CommonJS)**:

* Main module: [`cjs/src/modules/feeabstraction.ts`](./cjs/src/modules/feeabstraction.ts)
* Type definitions: [`cjs/src/types.ts`](./cjs/src/types.ts)

**ESM (ECMAScript Modules)**:

* Main module: [`esm/src/modules/feeabstraction.ts`](./esm/src/modules/feeabstraction.ts)
* Type definitions: [`esm/src/types.ts`](./esm/src/types.ts)

### 🚀 Basic Usage

#### Setting up Fee Abstraction

```typescript
import { createCheqdSDK, CheqdNetwork } from '@cheqd/sdk';

// Create wallet instance (e.g., using DirectSecp256k1HdWallet from CosmJS)
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
const wallet = await DirectSecp256k1HdWallet.fromMnemonic('your mnemonic here', { prefix: 'cheqd' }); // replace with your mnemonic, remember to keep it secure

// Set up the SDK options with fee abstraction capabilities
const sdkOptions = {
    modules: [
        FeeabstractionModule as unknown as AbstractCheqdSDKModule,
        // other modules can be added here
    ],
    // other SDK options can be configured here
    rpcUrl: 'https://rpc.cheqd.network', // or your preferred RPC endpoint
    network: CheqdNetwork.Testnet, // or CheqdNetwork.Mainnet
    wallet,
};

// Initialize SDK with fee abstraction support
const sdk = await createCheqdSDK(sdkOptions);
```

### 💳 IBC Asset Requirements

Before using fee abstraction functionality, ensure that your account has the necessary IBC assets bridged from supported chains like Osmosis:

#### Bridging Assets from Osmosis

To use fee abstraction, you'll need to have IBC tokens in your Cheqd account that were bridged from Osmosis:

```typescript
// Example IBC denominations that might be supported
const supportedIBCDenoms = [
  'ibc/1480B8FD20AD5FCAE81EA87584D269547DD4D436843C1D20F15E00EB64743EF4', // ATOM from Osmosis
  'ibc/14F9BC3E44B8A9C1BE1FB08980FAB87034C9905EF17CF2442BE1FA40E2E5F16', // OSMO from Osmosis
  // Add other supported IBC denominations
];

// Your account should have these IBC tokens available
async function checkIBCBalances(accountAddress: string) {
  const balances = await sdk.querier.bank.allBalances({ address: accountAddress });

  const ibcBalances = balances.balances.filter(balance =>
    balance.denom.startsWith('ibc/')
  );

  console.log('Available IBC tokens:', ibcBalances);
  return ibcBalances;
}
```

**Note**: To bridge assets from Osmosis to Cheqd, you can use:

* [Osmosis Frontend](https://app.osmosis.zone/) for manual transfers
* [IBC Transfer tools](https://ibc.fun/) for cross-chain transfers
* Direct IBC transfer commands via CLI

### 📊 Querying Fee Abstraction Data

#### Host Chain Configuration

```typescript
async function queryHostChainConfig() {
  const configResponse = await sdk.querier[defaultFeeabstractionExtensionKey].hostChainConfig({
    // Query parameters can be added here if needed
  });

  console.log('Host chain configuration:', configResponse);
}
```

#### Module Balances

```typescript
async function queryModuleBalances() {
  const balancesResponse = await sdk.querier[defaultFeeabstractionExtensionKey].feeabsModuleBalances({
    // Query parameters can be added here if needed
  });

  console.log('Fee abstraction module balances:', balancesResponse);
}
```

#### Osmosis TWAP Data

```typescript
async function queryOsmosisTWAP() {
  const twapResponse = await sdk.querier[defaultFeeabstractionExtensionKey].osmosisArithmeticTwap({
    poolId: '1', // Pool ID on Osmosis
    baseAsset: 'uosmo',
    quoteAsset: 'ibc/ABC123...',
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    endTime: new Date()
  });

  console.log('TWAP data:', twapResponse);
}
```

### 🏛️ Governance Operations

Fee abstraction supports governance proposals for configuration changes:

#### Adding a Host Zone

```typescript
import { MsgAddHostZone } from '@cheqd/ts-proto/feeabstraction/feeabs/v1beta1/index';

async function proposeAddHostZone() {
  const hostZoneData: MsgAddHostZone = {
    authority: 'cheqd1gov...', // Governance authority address
    hostChainId: 'osmosis-1',
    connectionId: 'connection-0',
    ibcDenom: 'ibc/ABC123...',
    nativeDenom: 'uosmo',
    transferChannelId: 'channel-0',
    minSwapAmount: '1000'
  };

  const proposalResponse = await sdk.addHostZoneProposal(
    hostZoneData,
    'Add Osmosis as Host Zone', // Proposal title
    [{ denom: 'ncheq', amount: '10000000000' }], // Deposit
    'cheqd1proposer...', // Proposer address
    {
      amount: [{ denom: 'ncheq', amount: '5000' }],
      gas: '300000'
    }
  );

  console.log('Host zone proposal submitted:', proposalResponse.transactionHash);
}
```

#### Updating Host Zone Configuration

```typescript
async function proposeUpdateHostZone() {
  const updateData = {
    authority: 'cheqd1gov...',
    hostChainId: 'osmosis-1',
    // Updated configuration parameters
    minSwapAmount: '2000' // New minimum swap amount
  };

  const updateResponse = await sdk.updateHostZoneProposal(
    updateData,
    'Update Osmosis Host Zone Configuration',
    [{ denom: 'ncheq', amount: '10000000000' }],
    'cheqd1proposer...',
    {
      amount: [{ denom: 'ncheq', amount: '5000' }],
      gas: '300000'
    }
  );

  console.log('Update proposal submitted:', updateResponse.transactionHash);
}
```

### 🔧 Advanced Configuration

#### TWAP Query for Price Data

```typescript
async function sendTWAPQuery() {
  const twapQueryResponse = await sdk.sendQueryIbcDenomTWAP(
    'cheqd1sender...',
    'ibc/ABC123...', // IBC denomination
    {
      amount: [{ denom: 'ncheq', amount: '5000' }],
      gas: '200000'
    },
    'Query TWAP for price data'
  );

  console.log('TWAP query sent:', twapQueryResponse);
}
```

#### Complete Fee Abstraction Workflow

```typescript
async function completeFeeAbstractionWorkflow() {
  try {
    // 1. Check account has IBC assets available
    const accountAddress = 'cheqd1sender...';
    const ibcBalances = await checkIBCBalances(accountAddress);
    
    if (ibcBalances.length === 0) {
      throw new Error('No IBC tokens available. Please bridge assets from Osmosis first.');
    }

    // 2. Query host chain configuration
    const hostConfig = await sdk.querier[defaultFeeabstractionExtensionKey].hostChainConfig({});
    console.log('Host chain config:', hostConfig);

    // 3. Query current module balances
    const moduleBalances = await sdk.querier[defaultFeeabstractionExtensionKey].feeabsModuleBalances({});
    console.log('Module balances:', moduleBalances);

    // 4. Use IBC tokens for transaction fees directly
    // Fee abstraction automatically handles the conversion behind the scenes
    console.log('Fee abstraction is ready for use with IBC tokens');

    console.log('Fee abstraction workflow completed successfully');
  } catch (error) {
    console.error('Fee abstraction workflow failed:', error);
  }
}
```

### 📋 Error Handling

```typescript
async function handleFeeAbstractionErrors() {
  try {
    // Example: Using fee abstraction in a DID operation
    const didCreationResponse = await sdk.createDidDocTx(
      'cheqd1sender...',
      didDocument,
      'key1',
      { amount: [{ denom: 'ibc/ABC123...', amount: '100000' }], gas: '300000' }
    );
  } catch (error) {
    if (error.message.includes('insufficient funds')) {
      console.error('Account has insufficient IBC tokens');
      console.log('Please bridge more assets from Osmosis');
    } else if (error.message.includes('invalid denom')) {
      console.error('Invalid IBC denomination provided');
      console.log('Check supported IBC denominations');
    } else if (error.message.includes('host zone not found')) {
      console.error('Host zone not configured for this IBC token');
    } else {
      console.error('Unexpected fee abstraction error:', error);
    }
  }
}
```

### 🔗 Integration with Other Modules

Fee abstraction can be used alongside other Cheqd SDK modules:

```typescript
async function useWithDIDOperations() {
  // Create a DID document using fee abstraction for payment
  const didDocument = {
    // DID document structure
  };

  // Use IBC tokens for fee payment via fee abstraction
  const didCreationResponse = await sdk.createDidDocTx(
    'cheqd1creator...',
    didDocument,
    'key1',
    {
      amount: [{ denom: 'ibc/ABC123...', amount: '100000' }], // Pay with IBC tokens
      gas: '300000'
    }
  );

  console.log('DID created with fee abstraction:', didCreationResponse.transactionHash);
}
```

### 💡 Best Practices

1. **Bridge IBC Assets First**: Ensure you have bridged the required IBC tokens from Osmosis before attempting to use fee abstraction
2. **Check Account Balances**: Verify your account has sufficient IBC token balances before transactions
3. **Handle IBC Delays**: Account for IBC token transfer delays in your application flow
4. **Validate Host Zones**: Always verify that host zones are properly configured before using IBC tokens
5. **Error Recovery**: Implement robust error handling for network and token-related issues
6. **Gas Estimation**: Use appropriate gas limits for transactions using fee abstraction
7. **Monitor Supported Denominations**: Keep track of which IBC denominations are supported for fee abstraction

For more detailed information about fee abstraction concepts and implementation, visit our [fee abstraction documentation](https://docs.cheqd.io/product).

## 🧑‍💻 Developer Guide

### Installing in ESM projects

To install this NPM package in a project that needs ESM builds, use our `latest` release channel to install the stable version:

```bash
npm install @cheqd/sdk@latest
```

To install beta releases instead, use our `-develop` releases from the `beta` channel:

```bash
npm install @cheqd/sdk@beta
```

### Installing in CommonJS projects

To install this NPM package in a project that needs CommonJS builds, use our `cjs` release channel to install the latest stable CommonJS version:

```bash
npm install @cheqd/sdk@cjs
```

## 📖 Documentation

Our [product documentation site](https://docs.cheqd.io/product) explains how `@cheqd/sdk` is [consumed in Veramo SDK for cheqd](https://docs.cheqd.io/product/sdk/veramo) (as an example of how this package can be consumed).

## 💬 Community

Our [**Discord server**](http://cheqd.link/discord-github) is the primary chat channel for our open-source community, software developers, and node operators.

Please reach out to us there for discussions, help, and feedback on the project.

## 🙋 Find us elsewhere

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge\&logo=telegram\&logoColor=white)](https://t.me/cheqd) [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge\&logo=discord\&logoColor=white)](http://cheqd.link/discord-github) [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge\&logo=twitter\&logoColor=white)](https://twitter.com/intent/follow?screen\_name=cheqd\_io) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge\&logo=linkedin\&logoColor=white)](http://cheqd.link/linkedin) [![Medium](https://img.shields.io/badge/Medium-12100E?style=for-the-badge\&logo=medium\&logoColor=white)](https://blog.cheqd.io) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge\&logo=youtube\&logoColor=white)](https://www.youtube.com/channel/UCBUGvvH6t3BAYo5u41hJPzw/)
