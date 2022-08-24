# TypeScript SDK for cheqd

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/cheqd/sdk?color=green&label=stable%20release&style=flat-square)](https://github.com/cheqd/sdk/releases/latest) ![GitHub Release Date](https://img.shields.io/github/release-date/cheqd/sdk?color=green&style=flat-square) [![GitHub license](https://img.shields.io/github/license/cheqd/sdk?color=blue&style=flat-square)](https://github.com/cheqd/sdk/blob/main/LICENSE)

[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/cheqd/sdk?include_prereleases&label=dev%20release&style=flat-square)](https://github.com/cheqd/sdk/releases/) ![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/cheqd/sdk/latest?style=flat-square) [![GitHub contributors](https://img.shields.io/github/contributors/cheqd/sdk?label=contributors%20%E2%9D%A4%EF%B8%8F&style=flat-square)](https://github.com/cheqd/sdk/graphs/contributors)

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/cheqd/sdk/Workflow%20Dispatch?label=workflows&style=flat-square)](https://github.com/cheqd/sdk/actions/workflows/dispatch.yml) [![GitHub Workflow Status](https://img.shields.io/github/workflow/status/cheqd/sdk/CodeQL?label=CodeQL&style=flat-square)](https://github.com/cheqd/sdk/actions/workflows/codeql.yml) ![GitHub repo size](https://img.shields.io/github/repo-size/cheqd/sdk?style=flat-square)

## ℹ️ Overview

The purpose of this [`@cheqd/sdk` NPM package](https://www.npmjs.com/package/@cheqd/sdk) is to provide a mechanism of integrating cheqd functionality in an application *without* using a 3rd-party SDK like [Veramo SDK for cheqd](https://docs.cheqd.io/identity/building-decentralized-identity-apps/veramo-sdk-for-cheqd).

This package includes:

* [TypeScript Protobuf definitions](https://github.com/cheqd/ts-proto) for custom cheqd Cosmos SDK modules
* [CosmJS](https://github.com/cosmos/cosmjs), for base Cosmos SDK module functions

If you are using [Versmo SDK for cheqd](https://docs.cheqd.io/identity/building-decentralized-identity-apps/veramo-sdk-for-cheqd), this SDK package is automatically installed and consumed by the [`@cheqd/did-provider-cheqd` Veramo plugin](https://github.com/cheqd/did-provider-cheqd).

## 🆔 Features

With this SDK, developers are able to:

* ✅ Create a `did:cheqd` method DID
* ✅ Update a `did:cheqd` method DID
* 🚧 Create Resource within a `did:cheqd` method DID

### 🧰 Tooling

* ✅ **Raw payload creator**: Enables users to generate a valid raw DID payload which is ready to be populated, depending on the use case. For example, `did-provider-cheqd` leverages this helper in the CLI application.
* ✅ **Identity key converter**: Enables users to convert specific key formats from different kinds of SDKs, by transforming the input keys into valid sign inputs for a cheqd specific DID transaction (e.g. `createDidTx`, `UpdateDidTx`). For example, the Veramo SDK for cheqd uses this helper to enable users to pass a key in a Veramo SDK specific format to a cheqd sign input keys interface.

## 📖 Documentation

Our [identity documentation site](https://docs.cheqd.io/identity/) explains how `@cheqd/sdk` is [consumed in Veramo SDK for cheqd](https://docs.cheqd.io/identity/building-decentralized-identity-apps/veramo-sdk-for-cheqd) (as an example of how this package can be consumed).

## 💬 Community

The [**cheqd Community Slack**](http://cheqd.link/join-cheqd-slack) is our primary chat channel for the open-source community, software developers, and node operators.

Please reach out to us there for discussions, help, and feedback on the project.

## 🙋 Find us elsewhere

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge\&logo=telegram\&logoColor=white)](https://t.me/cheqd) [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge\&logo=discord\&logoColor=white)](http://cheqd.link/discord-github) [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge\&logo=twitter\&logoColor=white)](https://twitter.com/intent/follow?screen\_name=cheqd\_io) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge\&logo=linkedin\&logoColor=white)](http://cheqd.link/linkedin) [![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge\&logo=slack\&logoColor=white)](http://cheqd.link/join-cheqd-slack) [![Medium](https://img.shields.io/badge/Medium-12100E?style=for-the-badge\&logo=medium\&logoColor=white)](https://blog.cheqd.io) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge\&logo=youtube\&logoColor=white)](https://www.youtube.com/channel/UCBUGvvH6t3BAYo5u41hJPzw/)
