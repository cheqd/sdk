import { VerificationMethod } from "@cheqd/ts-proto/cheqd/did/v2/diddoc"
import { MsgCreateDidDoc, MsgCreateDidDocPayload, SignInfo } from "@cheqd/ts-proto/cheqd/did/v2/tx"
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing"
import { base64ToBytes, EdDSASigner } from "did-jwt"
import { typeUrlMsgCreateDidDoc } from '../src/modules/did'
import { CheqdSigningStargateClient } from "../src/signer"
import { ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from "../src/types"
import { fromString, toString } from 'uint8arrays'
import { createDidPayload, createDidVerificationMethod, createKeyPairBase64, createVerificationKeys, exampleCheqdNetwork, faucet } from "./testutils.test"
import { verify } from "@stablelib/ed25519"

const nonExistingDid = "did:cHeQd:fantasticnet:123"
const nonExistingKeyId = 'did:cHeQd:fantasticnet:123#key-678'
const nonExistingPublicKeyMultibase = '1234567890'
const nonExistingVerificationMethod = 'ExtraTerrestrialVerificationKey2045'
const nonExistingVerificationDidDocument = {
    "authentication": [
        "did:cheqd:testnet:z6Jn6NmYkaCepQe2#key-1"
    ],
    "controller": [
        "did:cheqd:testnet:z6Jn6NmYkaCepQe2"
    ],
    "id": "did:cheqd:testnet:z6Jn6NmYkaCepQe2",
    "verificationMethod": [
        {
            "controller": "did:cheqd:testnet:z6Jn6NmYkaCepQe2",
            "id": "did:cheqd:testnet:z6Jn6NmYkaCepQe2#key-1",
            "publicKeyMultibase": "z6Jn6NmYkaCepQe29vgCZQhFfRkN3YpEPiu14F8HbbmqW",
            "type": nonExistingVerificationMethod
        }
    ]
}

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
            registry.register(typeUrlMsgCreateDidDoc, MsgCreateDidDoc)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet, { registry })
            expect(signer.registry.lookupType(typeUrlMsgCreateDidDoc)).toBe(MsgCreateDidDoc)
        })
    })

    describe('getDidSigner', () => {
        it('can get a signer for a did', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair, MethodSpecificIdAlgo.Base58, 'key-1', 16)
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Base58], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            const didSigner = await signer.getDidSigner(didPayload.verificationMethod[0].id, didPayload.verificationMethod)

            expect(didSigner).toBe(EdDSASigner)
        })

        it('should throw for a non-supported verification method', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)

            await expect(signer.getDidSigner(nonExistingVerificationDidDocument.verificationMethod[0].id, nonExistingVerificationDidDocument.verificationMethod)).rejects.toThrow()
        })

        it('should throw for non-matching verification method id', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair, MethodSpecificIdAlgo.Base58, 'key-1', 16)
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Base58], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])
            await expect(signer.getDidSigner(nonExistingKeyId, didPayload.verificationMethod)).rejects.toThrow()
        })
    })

    describe('checkDidSigners', () => {
        it('it should instantiate a signer for a did', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const keyPair = createKeyPairBase64()
            const verificationKeys = createVerificationKeys(keyPair, MethodSpecificIdAlgo.Base58, 'key-1', 16)
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Base58], [verificationKeys])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys])

            const didSigners = await signer.checkDidSigners(didPayload.verificationMethod)

            expect(didSigners[VerificationMethods.Base58]).toBe(EdDSASigner)
        })

        it('should instantiate multiple signers for a did with multiple verification methods', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const keyPair1 = createKeyPairBase64()
            const keyPair2 = createKeyPairBase64()
            const verificationKeys1 = createVerificationKeys(keyPair1, MethodSpecificIdAlgo.Base58, 'key-1', 16)
            const verificationKeys2 = createVerificationKeys(keyPair2, MethodSpecificIdAlgo.Base58, 'key-2', 16)
            const verificationMethods = createDidVerificationMethod([VerificationMethods.Base58, VerificationMethods.JWK], [verificationKeys1, verificationKeys2])
            const didPayload = createDidPayload(verificationMethods, [verificationKeys1, verificationKeys2])

            const didSigners = await signer.checkDidSigners(didPayload.verificationMethod)

            expect(didSigners[VerificationMethods.Base58]).toBe(EdDSASigner)
            expect(didSigners[VerificationMethods.JWK]).toBe(EdDSASigner)
        })

        it('should throw for non-supported verification method', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
            const verificationMethod: Partial<VerificationMethod> = {
                id: nonExistingKeyId,
                type: nonExistingVerificationMethod,
                controller: nonExistingDid,
                verificationMaterial: JSON.stringify({publicKeyMultibase: nonExistingPublicKeyMultibase})
            }

            await expect(signer.checkDidSigners([VerificationMethod.fromPartial(verificationMethod)])).rejects.toThrow()
        })
    })

    describe('signCreateDidTx', () => {
        it('should sign a did tx with valid signature', async () => {
            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
            const signer = await CheqdSigningStargateClient.connectWithSigner(exampleCheqdNetwork.rpcUrl, wallet)
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
            const signInfos = await signer.signCreateDidTx(signInputs, didPayload)
            const publicKeyRaw = fromString(keyPair.publicKey, 'base64')
            const messageRaw = MsgCreateDidDocPayload.encode(didPayload).finish()

            const verified = verify(
                publicKeyRaw,
                messageRaw,
                signInfos[0].signature
            )

            expect(verified).toBe(true)
        })
    })
})