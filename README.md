# cheqd SDK (Typescript)

## ℹ️ Overview

This package is used to consume the ledger functionality within an application. The purpose of this package is to enable users to easily perform identity transactions on the cheqd Ledger.

This package also provides useful tools for SDK interoperability, e.g. Veramo, and contains the necessary modules to do so, including:

* [DID Module](https://github.com/cheqd/sdk/blob/main/src/modules/did.ts)
* [@cosmjs](https://github.com/cosmos/cosmjs)

> If you are using the Versmo SDK for cheqd, this is installed as a dependency within `did-provider-cheqd` and therefore this package does not need to be installed additionally.

## 🆔 Features

With this SDK, users are able to:

* ✅ Create a `did:cheqd` method DID
* ✅ Update a `did:cheqd` method DID
* 🚧 Create Resource within a `did:cheqd` method DID

## 🧰 Tooling

* ✅ Raw payload creator helper
  * Enables users to generate a valid raw DID payload which is ready to be populated, depending on the use case.
  * For example, `did-provider-cheqd` leverages this helper in a CLI application.
* ✅ DID key converter helper
  * Enables users to convert specific key formats from different kinds of SDKs, by transforming the input keys into valid sign inputs for a cheqd specific DID transaction (e.g. `createDidTx`, `UpdateDidTx`)
  * For example, the Veramo SDK for cheqd uses this helper to enable users to pass a key in a Veramo SDK specific format to a cheqd sign input keys interface.

## 🧑‍💻🛠 Developer Guide

### Architecture

x

### Setup

Dependencies can be installed using Yarn or any other package manager.

```bash
yarn install
```

### Config

x

## 📄 Documentation
