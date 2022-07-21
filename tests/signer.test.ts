import { VerificationMethod } from "@cheqd/ts-proto/cheqd/v1/did"
import { MsgCreateDid, MsgCreateDidPayload, SignInfo } from "@cheqd/ts-proto/cheqd/v1/tx"
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing"
import { base64ToBytes, EdDSASigner } from "did-jwt"
import { typeUrlMsgCreateDid } from "../src/registry"
import { CheqdSigningStargateClient } from "../src/signer"
import { ISignInputs, VerificationMethods } from "../src/types"
import { fromString, toString } from 'uint8arrays'
import { createDidPayload, createKeyPairBase64, exampleCheqdNetwork, faucet } from "./testutils.test"
import { verify } from "@stablelib/ed25519"

const nonExistingDid = "did:cHeQd:fantasticnet:123"
const nonExistingKeyId = 'did:cHeQd:fantasticnet:123#key-678'
const nonExistingPublicKeyMultibase = '1234567890'
const nonExistingVerificationMethod = 'ExtraTerrestrialVerificationKey2045'

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

    describe('getDidSigner', () => {
        it('can get a signer for a did', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didPayload = createDidPayload(createKeyPairBase64(), VerificationMethods.Multibase58)
            const didSigner = await signer.getDidSigner(didPayload.verificationMethod[0].id, didPayload.verificationMethod)

            expect(didSigner).toBe(EdDSASigner)
        })

        it('should not return a did payload for a non-supported verification method', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            //@ts-ignore
            const didPayload = createDidPayload(createKeyPairBase64(), 'ExtraTerrestrialVerificationKey2045')

            expect(didPayload).toBe(undefined)
        })

        it('should throw for non-matching verification method id', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didPayload = createDidPayload(createKeyPairBase64(), VerificationMethods.JWK)
            await expect(signer.getDidSigner(nonExistingKeyId, didPayload.verificationMethod)).rejects.toThrow()
        })
    })

    describe('checkDidSigners', () => {
        it('it should instantiate a signer for a did', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didPayload = createDidPayload(createKeyPairBase64(), VerificationMethods.Multibase58)

            const didSigners = await signer.checkDidSigners(didPayload.verificationMethod)

            expect(didSigners[VerificationMethods.Multibase58]).toBe(EdDSASigner)
        })

        it('should instantiate multiple signers for a did with multiple verification methods', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const didPayload = createDidPayload(createKeyPairBase64(), VerificationMethods.Multibase58)

            didPayload.verificationMethod.push(createDidPayload(createKeyPairBase64(), VerificationMethods.JWK).verificationMethod[0])

            const didSigners = await signer.checkDidSigners(didPayload.verificationMethod)

            expect(didSigners[VerificationMethods.Multibase58]).toBe(EdDSASigner)
            expect(didSigners[VerificationMethods.JWK]).toBe(EdDSASigner)
        })

        it('should throw for non-supported verification method', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const verificationMethod: Partial<VerificationMethod> = {
                id: nonExistingKeyId,
                type: nonExistingVerificationMethod,
                controller: nonExistingDid,
                publicKeyMultibase: nonExistingPublicKeyMultibase
            }

            await expect(signer.checkDidSigners([VerificationMethod.fromPartial(verificationMethod)])).rejects.toThrow()
        })
    })

    describe('signDidTx', () => {
        it('should sign a did tx with valid signature', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const keyPair = createKeyPairBase64()
            const didPayload = createDidPayload(keyPair, VerificationMethods.Multibase58)
            const signInputs: ISignInputs[] = [
                {
                    verificationMethodId: didPayload.verificationMethod[0].id,
                    privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex')
                }
            ]
            const signInfos = await signer.signDidTx(signInputs, didPayload)
            const publicKeyRaw = fromString(keyPair.publicKey, 'base64')
            const messageRaw = MsgCreateDidPayload.encode(didPayload).finish()
            const signatureRaw = base64ToBytes(signInfos[0].signature)
            const verified = verify(
                publicKeyRaw,
                messageRaw,
                signatureRaw
            )

            expect(verified).toBe(true)
        })
    })
})