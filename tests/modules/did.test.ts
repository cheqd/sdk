import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { DIDModule } from "../../src"
import { CheqdSigningStargateClient } from "../../src/signer"
import { CheqdNetwork, DidStdFee, ISignInputs, VerificationMethods } from "../../src/types"
import { createDidPayload, exampleCheqdNetwork, faucet } from "../testutils.test"
import { MsgUpdateDidPayload } from '@cheqd/ts-proto/cheqd/v1/tx';
import { generateKeyPair, sign } from '@stablelib/ed25519';


describe('DIDModule', () => {
    jest.setTimeout(20000)
    
    describe('constructor', () => {
        it('should instantiate standalone module', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didModule = new DIDModule(signer)
            expect(didModule).toBeInstanceOf(DIDModule)
        })
    })

    describe('createDidTx', () => {
        it('should create a new DID', async () => {
            jest.setTimeout(10000)

            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didModule = new DIDModule(signer)
            const keyPair = generateKeyPair()

            const didPayload = createDidPayload(keyPair.publicKey, VerificationMethods.JWK, CheqdNetwork.Testnet)
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    signer: (data: Uint8Array) => {
                        return Promise.resolve(sign(keyPair.secretKey, data))
                    }
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

            console.warn(didTx)

            expect(didTx.code).toBe(0)
        })
    })

    describe('updateDidTx', () => {
        it('should update created DID', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didModule = new DIDModule(signer)
            
            // TODO: We need strong typing for keys
            const keyPair = generateKeyPair()

            // Create a DID
            const didPayload = createDidPayload(keyPair.publicKey, VerificationMethods.JWK, CheqdNetwork.Testnet)
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    signer: (data: Uint8Array) => {
                        return Promise.resolve(sign(keyPair.secretKey, data))
                    }
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

            console.warn(didTx)
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
        })
    })
})
