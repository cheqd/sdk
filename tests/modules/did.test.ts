import { MsgUpdateDidPayload } from "@cheqd/ts-proto/cheqd/did/v1/tx"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { fromString, toString } from 'uint8arrays'
import { DIDModule } from "../../src"
import { createDefaultCheqdRegistry } from "../../src/registry"
import { CheqdSigningStargateClient } from "../../src/signer"
import { DidStdFee, ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from "../../src/types"
import { createDidPayload, createDidVerificationMethod, createKeyPairBase64, createVerificationKeys, exampleCheqdNetwork, faucet } from "../testutils.test"

const defaultAsyncTxTimeout = 30000

describe('DIDModule', () => {
    describe('constructor', () => {
        it('should instantiate standalone module', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didModule = new DIDModule(signer)
            expect(didModule).toBeInstanceOf(DIDModule)
        })
    })

    describe('createDidTx', () => {
        it('should create a new multibase DID', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair, MethodSpecificIdAlgo.Base58, 'key-1', 16)
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Base58], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])

            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const fee: DidStdFee = {
                amount: [
                    {
                        denom: 'ncheq',
                        amount: '5000000'
                    }
                ],
                gas: '100000',
                payer: (await wallet.getAccounts())[0].address
            } 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                (await wallet.getAccounts())[0].address,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should create a new uuid DID', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair, MethodSpecificIdAlgo.Uuid, 'key-1', 16)
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Base58], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const fee: DidStdFee = {
                amount: [
                    {
                        denom: 'ncheq',
                        amount: '5000000'
                    }
                ],
                gas: '100000',
                payer: (await wallet.getAccounts())[0].address
            } 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                (await wallet.getAccounts())[0].address,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)
        }, defaultAsyncTxTimeout)
    })

    describe('updateDidTx', () => {
        it('should update a DID', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const registry = createDefaultCheqdRegistry(DIDModule.registryTypes)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet, { registry })
            const didModule = new DIDModule(signer)
            
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair, MethodSpecificIdAlgo.Base58, 'key-1', 16)
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Base58], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const fee: DidStdFee = {
                amount: [
                    {
                        denom: 'ncheq',
                        amount: '5000000'
                    }
                ],
                gas: '100000',
                payer: (await wallet.getAccounts())[0].address
            } 
            const didTx: DeliverTxResponse = await didModule.createDidTx(
                signInputs,
                didPayload,
                (await wallet.getAccounts())[0].address,
                fee
            )

            console.warn(`Using payload: ${JSON.stringify(didPayload)}`)
            console.warn(`DID Tx: ${JSON.stringify(didTx)}`)

            expect(didTx.code).toBe(0)

            // Update the DID
            const updateDidPayload = MsgUpdateDidPayload.fromPartial({
                context: didPayload.context,
                id: didPayload.id,
                controller: didPayload.controller,
                verificationMethod: didPayload.verificationMethod,
                authentication: didPayload.authentication,
                assertionMethod: [didPayload.verificationMethod[0].id], // New
                versionId: didTx.transactionHash
            })

            const updateDidTx: DeliverTxResponse = await didModule.updateDidTx(
                signInputs,
                updateDidPayload,
                (await wallet.getAccounts())[0].address,
                fee
            )

            console.warn(updateDidTx)
            expect(updateDidTx.code).toBe(0)
        }, defaultAsyncTxTimeout)
    })
})