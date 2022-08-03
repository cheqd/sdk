# Veramo SDK for cheqd: SDK

## ℹ️ Overview

The purpose of this package is enable users to easily perform identity transactions on the cheqd Ledger, either throught directly with an application, or through using [`@veramo/cli`](https://github.com/uport-project/veramo/tree/next/packages/cli).

This package contains the necessary modules required to do so, which includes:
* [DID Module](https://github.com/cheqd/sdk/blob/main/src/modules/did.ts)
* [@cosmjs](https://github.com/cheqd/sdk/blob/main/src/modules/_.ts)

With this SDK, users are able to:

### 🆔 DIDs

* Create Issuers DID + DIDDoc
* Create Subject DID using `did:key`
* Update DIDs

### 🛂 Verifiable Credentials

* Issue JSON credentials with JWT proof
* Verify JSON credentials with JWT proof

### 📱 Verifiable Presentations

* Create a Verifiable Presentation with a JSON credential (JWT proof)
* Verify a Verifiable Presentation with a JSON credential (JWT proof)

## 🧑‍💻🛠 Developer Guide

### Architecture

This SDK works alongside `did-provider-cheqd` which provides the functiomaltiy for writing to the ledger, using the Veramo SDK. 

* [`@veramo/core`](https://github.com/uport-project/veramo/tree/next/packages/core)
* [`@veramo/cli`](https://github.com/uport-project/veramo/tree/next/packages/cli)
* [`@veramo/credential-w3c`](https://github.com/uport-project/veramo/tree/next/packages/credential-w3c)

Find out about other Veramo plug-ins at [`veramo_agent/plugins/`](https://veramo.io/docs/veramo_agent/plugins/)

You'll also see where this package sits in the overall archicture used across the Veramo SDK for cheqd in the diagram below:

https://github.com/cheqd/sdk/blob/main/diagrams/sdk-modules.drawio

### Setup

Dependencies can be installed using Yarn or any other package manager.

```bash
yarn install
```

### Config

A default agent configuration is provided with the [`agent.yml`](https://github.com/cheqd/did-provider-cheqd/blob/main/agent.yml) file.

To specify further configurations, see the Veramo docs, however when making changes, ensure the cheqd specific suggested configurations are retained.

### Deploy

`cheqd/sdk` supports the same out of the box use cases as Veramo provides.

As such, this can be utilised in a backend (server-side) envrionment or frontend (browser/web) application, or in a CLI specific applications by leverage [`@veramo/cli`](https://github.com/uport-project/veramo/tree/next/packages/cli).

## 📄 Documentation
