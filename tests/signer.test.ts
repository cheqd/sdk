import { MsgCreateDid, MsgCreateDidPayload } from "@cheqd/ts-proto/cheqd/v1/tx"
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing"
import { base64ToBytes } from "did-jwt"
import { typeUrlMsgCreateDid } from "../src/registry"
import { CheqdSigningStargateClient } from "../src/signer"
import { ISignInputs, VerificationMethods } from "../src/types"
import { createDidPayload, exampleCheqdNetwork, faucet } from "./testutils.test"
import { verify, generateKeyPair, sign } from '@stablelib/ed25519';

describe('CheqdSigningStargateClient', () => {
    describe('constructor', () => {
        it('can be instantiated & works for cheqd networks', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            expect(signer).toBeInstanceOf(CheqdSigningStargateClient)
        })

        it('can be constructed with cheqd custom registry', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const registry = new Registry()
            registry.register(typeUrlMsgCreateDid, MsgCreateDid)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet, { registry })
            expect(signer.registry.lookupType(typeUrlMsgCreateDid)).toBe(MsgCreateDid)
        })
    })

    describe('signDidTx', () => {
        it('should sign a did tx with valid signature', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const keyPair = generateKeyPair()
            const didPayload = createDidPayload(keyPair.publicKey, VerificationMethods.Multibase58)
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    signer: (data) => Promise.resolve(sign(keyPair.secretKey, data))
                }
            ]
            const signInfos = await signer.signDidTx(signInputs, didPayload)
            const messageRaw = MsgCreateDidPayload.encode(didPayload).finish()
            const signatureRaw = base64ToBytes(signInfos[0].signature)
            const verified = verify(
                keyPair.publicKey,
                messageRaw,
                signatureRaw
            )

            expect(verified).toBe(true)
        })
    })
})