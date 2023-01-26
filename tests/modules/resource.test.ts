import { DirectSecp256k1HdWallet, GeneratedType } from "@cosmjs/proto-signing"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { fromString, toString } from 'uint8arrays'
import { DIDModule, ResourceModule } from "../../src"
import { createDefaultCheqdRegistry } from "../../src/registry"
import { CheqdSigningStargateClient } from "../../src/signer"
import { ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from '../../src/types';
import { createDidPayload, createDidVerificationMethod, createKeyPairBase64, createVerificationKeys } from "../../src/utils"
import { localnet, faucet, image_content, default_content } from "../testutils.test"
import { MsgCreateResourcePayload } from '@cheqd/ts-proto/cheqd/resource/v2';
import { v4 } from "uuid"

const defaultAsyncTxTimeout = 30000

describe('ResourceModule', () => {
    describe('constructor', () => {
        it('should instantiate standalone module', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet)
            const resourceModule = new ResourceModule(signer)
            expect(resourceModule).toBeInstanceOf(ResourceModule)
        })
    })

    describe('createResourceTx', () => {
        it('should create a new Resource - case: json', async () => {
            // create an associated did document
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})

            const registry = createDefaultCheqdRegistry(Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes)))

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

            // create a did linked resource
            const resourceModule = new ResourceModule(signer)

            const resourcePayload: MsgCreateResourcePayload = {
                collectionId: didPayload.id.split(":").reverse()[0],
                id: v4(),
                version: "1.0",
                alsoKnownAs: [],
                name: 'Test Resource',
                resourceType: 'test-resource-type',
                data: new TextEncoder().encode("{\"message\": \"hello world\"}")
            }

            const resourceSignInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    keyType: 'Ed25519',
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]

            const feeResourceJson = await ResourceModule.generateCreateResourceJsonFees(feePayer)
            const resourceTx = await resourceModule.createResourceTx(
                resourceSignInputs,
                resourcePayload,
                feePayer,
                feeResourceJson
            )

            console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(resourceTx)}`)

            expect(resourceTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new Resource - case: image', async () => {
            // create an associated did document
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})

            const registry = createDefaultCheqdRegistry(Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes)))

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

            // create a did linked resource
            const resourceModule = new ResourceModule(signer)

            const resourcePayload: MsgCreateResourcePayload = {
                collectionId: didPayload.id.split(":").reverse()[0],
                id: v4(),
                version: "1.0",
                alsoKnownAs: [],
                name: 'Test Resource',
                resourceType: 'test-resource-type',
                data: fromString(image_content, 'base64')
            }

            const resourceSignInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    keyType: 'Ed25519',
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]

            const feeResourceImage = await ResourceModule.generateCreateResourceImageFees(feePayer)
            const resourceTx = await resourceModule.createResourceTx(
                resourceSignInputs,
                resourcePayload,
                feePayer,
                feeResourceImage
            )

            console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(resourceTx)}`)

            expect(resourceTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new Resource - case: default', async () => {
            // create an associated did document
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})

            const registry = createDefaultCheqdRegistry(Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes)))

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

            // create a did linked resource
            const resourceModule = new ResourceModule(signer)

            const resourcePayload: MsgCreateResourcePayload = {
                collectionId: didPayload.id.split(":").reverse()[0],
                id: v4(),
                version: "1.0",
                alsoKnownAs: [],
                name: 'Test Resource',
                resourceType: 'test-resource-type',
                data: new TextEncoder().encode(default_content)
            }

            const resourceSignInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod![0].id,
                    keyType: 'Ed25519',
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]

            const feeResourceDefault = await ResourceModule.generateCreateResourceDefaultFees(feePayer)
            const resourceTx = await resourceModule.createResourceTx(
                resourceSignInputs,
                resourcePayload,
                feePayer,
                feeResourceDefault
            )

            console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(resourceTx)}`)

            expect(resourceTx.code).toBe(0)
        }, defaultAsyncTxTimeout)
    })
})
