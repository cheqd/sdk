import { DirectSecp256k1HdWallet, GeneratedType } from "@cosmjs/proto-signing"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { fromString, toString } from 'uint8arrays'
import { DIDModule, ResourceModule } from "../../src"
import { createDefaultCheqdRegistry } from "../../src/registry"
import { CheqdSigningStargateClient } from "../../src/signer"
import { DidStdFee, ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from '../../src/types';
import { createDidPayload, createDidVerificationMethod, createKeyPairBase64, createVerificationKeys, exampleCheqdNetwork, faucet } from "../testutils.test"
import { MsgCreateResourcePayload } from '@cheqd/ts-proto/cheqd/resource/v2/tx';
import { randomUUID } from "crypto"

const defaultAsyncTxTimeout = 30000

describe('ResourceModule', () => {
    describe('constructor', () => {
        it('should instantiate standalone module', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const resourceModule = new ResourceModule(signer)
            expect(resourceModule).toBeInstanceOf(ResourceModule)
        })
    })

    describe('createResourceTx', () => {
        it('should create a new Resource', async () => {
            // Creating a DID
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})

            const registry = createDefaultCheqdRegistry(Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes)))

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
                        amount: '50000000'
                    }
                ],
                gas: '1000000',
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

            // Creating a resource

            const resourceModule = new ResourceModule(signer)

            const resourcePayload: MsgCreateResourcePayload = {
                collectionId: didPayload.id.split(":").reverse()[0],
                id: randomUUID(),
                version: "1.0",
                alsoKnownAs: [],
                name: 'Test Resource',
                resourceType: 'test-resource-type',
                data: new TextEncoder().encode("{ \"message\": \"hello world\"}")
            }

            console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)

            const resourceSignInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    keyType: 'Ed25519',
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]

            const resourceTx = await resourceModule.createResourceTx(
                resourceSignInputs,
                resourcePayload,
                (await wallet.getAccounts())[0].address,
                fee
            )

            console.warn(`DID Tx: ${JSON.stringify(resourceTx)}`)

            expect(resourceTx.code).toBe(0)
        }, defaultAsyncTxTimeout)
    })
})
