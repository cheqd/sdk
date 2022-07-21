import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { fromString, toString } from 'uint8arrays'
import { DIDModule } from "../../src"
import { CheqdSigningStargateClient } from "../../src/signer"
import { CheqdNetwork, DidStdFee, ISignInputs, VerificationMethods } from "../../src/types"
import { createDidPayload, createKeyPairBase64, exampleCheqdNetwork, faucet } from "../testutils.test"


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
        it('should create a new DID', async () => {
            jest.setTimeout(10000)

            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {prefix: faucet.prefix})
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didModule = new DIDModule(signer)
            const keyPair = createKeyPairBase64()
            const didPayload = createDidPayload(keyPair, VerificationMethods.JWK, CheqdNetwork.Testnet)
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

            console.warn(didTx)

            expect(didTx.code).toBe(0)
        })
    })
})