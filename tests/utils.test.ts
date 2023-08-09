import {
    TImportableEd25519Key,
    checkBalance,
    createSignInputsFromImportableEd25519Key,
    getCosmosAccount
} from '../src/utils'
import {
    createDidVerificationMethod,
    createVerificationKeys,
    createKeyPairRaw
} from '../src/utils'
import { toString } from 'uint8arrays'
import {
    IKeyPair,
    MethodSpecificIdAlgo,
    VerificationMethods
} from '../src/types'
import { faucet_address, pubkey_hex, testnet_rpc } from './testutils.test'

describe('createSignInputsFromImportableEd25519Key', () => {
    it('should create a sign input from an importable ed25519 key 2020', async () => {
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

        const verificationKeys = createVerificationKeys(keyPairBase64.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
        const verificationMethod = createDidVerificationMethod([VerificationMethods.Ed255192020], [verificationKeys])
        const signInput = createSignInputsFromImportableEd25519Key(importableEd25519Key, verificationMethod)

        expect(signInput).toEqual({ verificationMethodId: verificationKeys.keyId, privateKeyHex: importableEd25519Key.privateKeyHex })
    })

    it('should create a sign input from an importable ed25519 key 2018', async () => {
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

        const verificationKeys = createVerificationKeys(keyPairBase64.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
        const verificationMethod = createDidVerificationMethod([VerificationMethods.Ed255192018], [verificationKeys])
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

        const verificationKeys = createVerificationKeys(keyPairBase64.publicKey, MethodSpecificIdAlgo.Base58, 'key-1')
        const verificationMethod = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys])
        const signInput = createSignInputsFromImportableEd25519Key(importableEd25519Key, verificationMethod)

        expect(signInput).toEqual({ verificationMethodId: verificationKeys.keyId, privateKeyHex: importableEd25519Key.privateKeyHex })
    })

    it('should get the cosmos account from publicKeyHex', () => {
        // We know, that such point could be transformed to a cheqd account cheqd1ehcg0jarxkyxtkzrwcxayedxrskwyftxj4exm9
        const expectedAddress = "cheqd1ehcg0jarxkyxtkzrwcxayedxrskwyftxj4exm9"

        expect(expectedAddress).toEqual(getCosmosAccount(pubkey_hex))

    })

    it('should return not empty account balance', async () => {
        const balances = await checkBalance(faucet_address, testnet_rpc)
        expect(balances.length).toBeGreaterThan(0)
        expect(balances[0].denom).toEqual("ncheq")
        expect(+balances[0].amount).toBeGreaterThan(0)
    })
})