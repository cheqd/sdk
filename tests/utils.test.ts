import { TImportableEd25519Key, createSignInputsFromImportableEd25519Key } from '../src/utils'
import { createDidVerificationMethod, createVerificationKeys, createKeyPairRaw } from './testutils.test'
import { toString } from 'uint8arrays/to-string'
import { IKeyPair, MethodSpecificIdAlgo, VerificationMethods } from '../src/types'

describe('createSignInputsFromImportableEd25519Key', () => {
    it('should create a sign input from an importable ed25519 key', async () => {
        const keyPair = createKeyPairRaw()
        const importableEd25519Key: TImportableEd25519Key = {
            publicKeyHex: toString(keyPair.publicKey, 'hex'),
            privateKeyHex: toString(keyPair.secretKey, 'hex'),
            kid: toString(keyPair.publicKey, 'hex'),
            type: 'Ed25519'
        }
        const keyPairBase64: IKeyPair = {
            publicKey: toString(keyPair.publicKey, 'base64'),
            privateKey: toString(keyPair.secretKey, 'base64'),
        }

        const verificationKeys = createVerificationKeys(keyPairBase64, MethodSpecificIdAlgo.Base58, 'key-1', 16)
        const verificationMethod = createDidVerificationMethod([VerificationMethods.Base58], [verificationKeys])
        const signInput = createSignInputsFromImportableEd25519Key(importableEd25519Key, verificationMethod)

        expect(signInput).toEqual({ verificationMethodId: verificationKeys.keyId, privateKeyHex: importableEd25519Key.privateKeyHex })
    })

    it('should create a sign input from an importable ed25519 key with VM type JWK', () => {
        const keyPair = createKeyPairRaw()
        const importableEd25519Key: TImportableEd25519Key = {
            publicKeyHex: toString(keyPair.publicKey, 'hex'),
            privateKeyHex: toString(keyPair.secretKey, 'hex'),
            kid: toString(keyPair.publicKey, 'hex'),
            type: 'Ed25519'
        }
        const keyPairBase64: IKeyPair = {
            publicKey: toString(keyPair.publicKey, 'base64'),
            privateKey: toString(keyPair.secretKey, 'base64'),
        }

        const verificationKeys = createVerificationKeys(keyPairBase64, MethodSpecificIdAlgo.Base58, 'key-1', 16)
        const verificationMethod = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys])
        const signInput = createSignInputsFromImportableEd25519Key(importableEd25519Key, verificationMethod)

        expect(signInput).toEqual({ verificationMethodId: verificationKeys.keyId, privateKeyHex: importableEd25519Key.privateKeyHex })
    })
})