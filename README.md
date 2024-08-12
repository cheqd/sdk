# TypeScript SDK for cheqd

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/cheqd/sdk?color=green&label=stable%20release&style=flat-square)](https://github.com/cheqd/sdk/releases/latest) ![GitHub Release Date](https://img.shields.io/github/release-date/cheqd/sdk?color=green&style=flat-square) [![GitHub license](https://img.shields.io/github/license/cheqd/sdk?color=blue&style=flat-square)](https://github.com/cheqd/sdk/blob/main/LICENSE)

[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/cheqd/sdk?include_prereleases&label=dev%20release&style=flat-square)](https://github.com/cheqd/sdk/releases/) ![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/cheqd/sdk/latest?style=flat-square) [![GitHub contributors](https://img.shields.io/github/contributors/cheqd/sdk?label=contributors%20%E2%9D%A4%EF%B8%8F&style=flat-square)](https://github.com/cheqd/sdk/graphs/contributors)

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cheqd/sdk/dispatch.yml?label=workflows&style=flat-square)](https://github.com/cheqd/sdk/actions/workflows/dispatch.yml) [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cheqd/sdk/codeql.yml?label=CodeQL&style=flat-square)](https://github.com/cheqd/sdk/actions/workflows/codeql.yml) ![GitHub repo size](https://img.shields.io/github/repo-size/cheqd/sdk?style=flat-square)

## ℹ️ Overview

The purpose of this [`@cheqd/sdk` NPM package](https://www.npmjs.com/package/@cheqd/sdk) is to provide base functionality for interacting with cheqd network. It combines the DID and [DID-Linked Resources](https://docs.cheqd.io/identity/guides/did-linked-resources) modules, and putting them into a Cosmos transaction wrapper using [CosmJS](https://github.com/cosmos/cosmjs).

This package is consumed by other SDKs/libraries such as [Veramo SDK for cheqd](https://docs.cheqd.io/identity/guides/sdk/veramo-sdk-for-cheqd) and [Hyperledger Aries Framework JavaScript (AFJ)](https://github.com/hyperledger/aries-framework-javascript) to add cheqd network support.

This package includes:

* [TypeScript Protobuf definitions](https://github.com/cheqd/ts-proto) for custom cheqd Cosmos SDK modules
* [CosmJS](https://github.com/cosmos/cosmjs), for base Cosmos SDK module functions

## 🆔 Features

Our identity documentation site provides [tutorials for utilising the identity features](https://docs.cheqd.io/identity/overview/readme) on cheqd network.

With this SDK, developers are able to:

* ✅ Create a `did:cheqd` method DID
* ✅ Update a `did:cheqd` method DID
* ✅ Deactivate a `did:cheqd` method DID
* ✅ Create or update [a DID-Linked Resource](https://docs.cheqd.io/identity/tutorials/did-linked-resources/create-resource)

### 🧰 Tooling

* ✅ **Raw payload creator**: Enables users to generate a valid raw DID payload which is ready to be populated, depending on the use case. For example, `did-provider-cheqd` leverages this helper in the CLI application.
* ✅ **Identity key converter**: Enables users to convert specific key formats from different kinds of SDKs, by transforming the input keys into valid sign inputs for a cheqd specific DID transaction (e.g. `createDidDocTx`, `updateDidDocTx`). For example, the Veramo SDK for cheqd uses this helper to enable users to pass a key in a Veramo SDK specific format to a cheqd sign input keys interface.

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

Our [identity documentation site](https://docs.cheqd.io/identity/) explains how `@cheqd/sdk` is [consumed in Veramo SDK for cheqd](https://docs.cheqd.io/identity/guides/sdk/veramo-sdk-for-cheqd) (as an example of how this package can be consumed).

## 💬 Community

Our [**Discord server**](http://cheqd.link/discord-github) is the primary chat channel for our open-source community, software developers, and node operators.

Please reach out to us there for discussions, help, and feedback on the project.

## 🙋 Find us elsewhere

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge\&logo=telegram\&logoColor=white)](https://t.me/cheqd) [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge\&logo=discord\&logoColor=white)](http://cheqd.link/discord-github) [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge\&logo=twitter\&logoColor=white)](https://twitter.com/intent/follow?screen\_name=cheqd\_io) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge\&logo=linkedin\&logoColor=white)](http://cheqd.link/linkedin) [![Medium](https://img.shields.io/badge/Medium-12100E?style=for-the-badge\&logo=medium\&logoColor=white)](https://blog.cheqd.io) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge\&logo=youtube\&logoColor=white)](https://www.youtube.com/channel/UCBUGvvH6t3BAYo5u41hJPzw/)
