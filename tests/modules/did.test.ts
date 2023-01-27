import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { fromString, toString } from 'uint8arrays'
import { DIDModule } from "../../src"
import { createDefaultCheqdRegistry } from "../../src/registry"
import { CheqdSigningStargateClient } from "../../src/signer"
import { DIDDocument, ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from "../../src/types"
import { createDidPayload, createDidVerificationMethod, createKeyPairBase64, createVerificationKeys } from "../../src/utils"
import { localnet, faucet } from "../testutils.test"

const defaultAsyncTxTimeout = 30000

describe('DIDModule', () => {
    describe('constructor', () => {
        it('should instantiate standalone module', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet)
            const didModule = new DIDModule(signer)
            expect(didModule).toBeInstanceOf(DIDModule)
        })
    })

    describe('createDidTx', () => {
        it('should create a new multibase DID - case: Ed25519VerificationKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192020], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])

            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]

            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new multibase DID - case: Ed25519VerificationKey2018', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192018], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])

            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new multibase DID - case: JsonWebKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])

            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new uuid DID - case: Ed25519VerificationKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Uuid, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192020], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new uuid DID - case: Ed25519VerificationKey2018', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Uuid, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192018], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new uuid DID - case: JsonWebKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Uuid, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer)
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)
    })

    describe('updateDidTx', () => {
        it('should update a DID - case: Ed25519VerificationKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)

            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192020], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)

            // update the did document
            const updateDidPayload = {
                '@context': didPayload?.['@context'],
                id: didPayload.id,
                controller: didPayload.controller,
                verificationMethod: didPayload.verificationMethod,
                authentication: didPayload.authentication,
                assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
                versionId: didTx.transactionHash
            } as DIDDocument

            const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer)
            const updateDidTx: DeliverTxResponse = await didModule.updateDidTx(
                signInputs,
                updateDidPayload,
                feePayer,
                feeUpdate
            )

            console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(updateDidTx)}`)

            expect(updateDidTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should update a DID - case: Ed25519VerificationKey2018', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)

            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192018], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)

            // update the did document
            const updateDidPayload = {
                '@context': didPayload?.['@context'],
                id: didPayload.id,
                controller: didPayload.controller,
                verificationMethod: didPayload.verificationMethod,
                authentication: didPayload.authentication,
                assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
                versionId: didTx.transactionHash
            } as DIDDocument

            const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer) 

            const updateDidTx: DeliverTxResponse = await didModule.updateDidTx(
                signInputs,
                updateDidPayload,
                feePayer,
                feeUpdate
            )

            console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(updateDidTx)}`)

            expect(updateDidTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should update a DID - case: JsonWebKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)

            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)

            // update the did document
            const updateDidPayload = {
                '@context': didPayload?.['@context'],
                id: didPayload.id,
                controller: didPayload.controller,
                verificationMethod: didPayload.verificationMethod,
                authentication: didPayload.authentication,
                assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
                versionId: didTx.transactionHash
            } as DIDDocument

            const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer)

            const updateDidTx: DeliverTxResponse = await didModule.updateDidTx(
                signInputs,
                updateDidPayload,
                feePayer,
                feeUpdate
            )

            console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(updateDidTx)}`)

            expect(updateDidTx.code).toBe(0)
        }, defaultAsyncTxTimeout)
    })

    describe('deactivateDidTx', () => {
        it('should deactivate a DID - case: Ed25519VerificationKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)

            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192020], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)

            // deactivate the did document
            const deactivateDidPayload = {
                id: didPayload.id,
                verificationMethod: didPayload.verificationMethod,
            } as DIDDocument

            const feeDeactivate = await DIDModule.generateDeactivateDidDocFees(feePayer)

            const deactivateDidTx: DeliverTxResponse = await didModule.deactivateDidTx(
                signInputs,
                deactivateDidPayload,
                feePayer,
                feeDeactivate
            )

            console.warn(`Using payload: ${JSON.stringify(deactivateDidPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(deactivateDidTx)}`)

            expect(deactivateDidTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should deactivate a DID - case: Ed25519VerificationKey2018', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)

            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Ed255192018], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer) 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)

            // deactivate the did document
            const deactivateDidPayload = {
                id: didPayload.id,
                verificationMethod: didPayload.verificationMethod,
            } as DIDDocument

            const feeDeactivate = await DIDModule.generateDeactivateDidDocFees(feePayer)

            const deactivateDidTx: DeliverTxResponse = await didModule.deactivateDidTx(
                signInputs,
                deactivateDidPayload,
                feePayer,
                feeDeactivate
            )

            console.warn(`Using payload: ${JSON.stringify(deactivateDidPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(deactivateDidTx)}`)

            expect(deactivateDidTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should deactivate a DID - case: JsonWebKey2020', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)

            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
            const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const feePayer = (await wallet.getAccounts())[0].address
            const fee = await DIDModule.generateCreateDidDocFees(feePayer)
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                feePayer,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)

            // deactivate the did document
            const deactivateDidPayload = {
                id: didPayload.id,
                verificationMethod: didPayload.verificationMethod,
            } as DIDDocument

            const feeDeactivate = await DIDModule.generateDeactivateDidDocFees(feePayer)

            const deactivateDidTx: DeliverTxResponse = await didModule.deactivateDidTx(
                signInputs,
                deactivateDidPayload,
                feePayer,
                feeDeactivate
            )

            console.warn(`Using payload: ${JSON.stringify(deactivateDidPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(deactivateDidTx)}`)

            expect(deactivateDidTx.code).toBe(0)
        }, defaultAsyncTxTimeout)
    })
})