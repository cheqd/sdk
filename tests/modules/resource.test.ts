import { DirectSecp256k1HdWallet, GeneratedType } from "@cosmjs/proto-signing"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { sign } from "@stablelib/ed25519"
import { fromString, toString } from 'uint8arrays'
import { DIDModule, ResourcesModule } from "../../src"
import { createDefaultCheqdRegistry } from "../../src/registry"
import { CheqdSigningStargateClient } from "../../src/signer"
import { DidStdFee, ISignInputs, MethodSpecificIdAlgo, VerificationMethods, ISignInputsWithSigner } from '../../src/types';
import { createDidPayload, createDidVerificationMethod, createKeyPairBase64, createVerificationKeys, exampleCheqdNetwork, faucet } from "../testutils.test"
import { MsgCreateResourcePayload } from '@cheqd/ts-proto/resource/v1/tx';
import { randomUUID } from "crypto"
import { Did } from "@cheqd/ts-proto/cheqd/v1/did"
import { AminoTypes } from "@cosmjs/stargate"
import { typeUrlMsgCreateResource } from "../../src/modules/resources"

const defaultAsyncTxTimeout = 20000

describe('ResourceModule', () => {
    describe('constructor', () => {
        it('should instantiate standalone module', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const resourcesModule = new ResourcesModule(signer)
            expect(resourcesModule).toBeInstanceOf(ResourcesModule)
        })
    })

    describe('createResourceTx', () => {
        it('should create a new Resource', async () => {
            // Creating a DID
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})

            const registry = createDefaultCheqdRegistry(Array.from(DIDModule.registryTypes).concat(Array.from(ResourcesModule.registryTypes)))

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

            const resourcesModule = new ResourcesModule(signer)

            const resourceSignInputs: ISignInputsWithSigner[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    signer: async (data: Uint8Array) => Promise.resolve(sign(fromString(keyPair.privateKey, 'base64'), data))
                }
            ]

            const resourcePayload: MsgCreateResourcePayload = {
                collectionId: didPayload.id.split(":").reverse()[0],
                id: randomUUID(),
                name: 'Test Resource',
                resourceType: 'test-resource-type',
                data: new TextEncoder().encode("{ \"message\": \"hello world\"}")
            }

            console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`)

            const resourceTx = await resourcesModule.createResourceTx(
                resourceSignInputs,
                resourcePayload,
                (await wallet.getAccounts())[0].address,
                fee
            )

            console.warn(`DID Tx: ${JSON.stringify(resourceTx)}`)

            expect(resourceTx.code).toBe(0)
        }, defaultAsyncTxTimeout)

        it('should properly encode payload', async () => {
            const resourcePayload: MsgCreateResourcePayload = {
                // collectionId: "zAZrzcvsYSBwnMCU",
                // id: "94087863-663f-4bac-a2e6-dd3dcad2add1",                
                // name: 'Test Resource',
                // resourceType: 'test-resource-type',
                collectionId: "",
                id: "",                
                name: '',
                resourceType: '',
                data: new TextEncoder().encode("abc")
            }

            // let animoRegistry = new AminoTypes({});

            // let encodeRes = animoRegistry.toAmino({
                // typeUrl: typeUrlMsgCreateResource,
                // value: resourcePayload
            // })
            // console.log(encodeRes)
            // 2a - amino - 00101.010
            // 32 - proto - 00110.010

            let bytes = MsgCreateResourcePayload.encode(resourcePayload).finish()
            console.log(`Bytes: `, toString(bytes, 'hex'))
            console.log(`Bytes: `, bytes)
        })
    })
})