import { VerificationMethod } from "@cheqd/ts-proto/cheqd/did/v1/did"
import {
    MsgCreateDidPayload,
    MsgUpdateDidPayload 
} from "@cheqd/ts-proto/cheqd/did/v1/tx"
import { 
    IKeyPair, 
    IKeyValuePair, 
    ISignInputs, 
    VerificationMethods, 
    TMethodSpecificId, 
    MethodSpecificIdAlgo, 
    TVerificationKey, 
    TVerificationKeyPrefix, 
    CheqdNetwork, 
    IVerificationKeys 
} from "./types"
import { fromString, toString } from 'uint8arrays'
import { bases } from "multiformats/basics"
import { base64ToBytes } from "did-jwt"
import { generateKeyPair, generateKeyPairFromSeed, KeyPair } from '@stablelib/ed25519'
import { v4 } from 'uuid'


export type TImportableEd25519Key = {
    publicKeyHex: string
    privateKeyHex: string
    kid: string
    type: "Ed25519"
}

export type IdentifierPayload = Partial<MsgCreateDidPayload> | Partial<MsgUpdateDidPayload>

export function parseToKeyValuePair(object: { [key: string]: any }): IKeyValuePair[] {
    return Object.entries(object).map(([key, value]) => ({ key, value }))
}

export function isEqualKeyValuePair(kv1: IKeyValuePair[], kv2: IKeyValuePair[]): boolean {
    return kv1.every((item, index) => item.key === kv2[index].key && item.value === kv2[index].value)
}

export function createSignInputsFromImportableEd25519Key(key: TImportableEd25519Key, verificationMethod: VerificationMethod[]): ISignInputs {
    if (verificationMethod?.length === 0) throw new Error('No verification methods provided')

    const publicKey = fromString(key.publicKeyHex, 'hex')

    for(const method of verificationMethod) {
        switch (method?.type) {
            case VerificationMethods.Base58:
                const publicKeyMultibase = bases['base58btc'].encode(publicKey)
                if (method.publicKeyMultibase === publicKeyMultibase) {
                    return {
                        verificationMethodId: method.id,
                        privateKeyHex: key.privateKeyHex
                    }
                }

            case VerificationMethods.JWK:
                const publicKeyJWK = parseToKeyValuePair({
                    crv: 'Ed25519',
                    kty: 'OKP',
                    x: toString( publicKey, 'base64url' )
                })
                if (isEqualKeyValuePair(method.publicKeyJwk, publicKeyJWK)) {
                    return {
                        verificationMethodId: method.id,
                        privateKeyHex: key.privateKeyHex
                    }
                }
        }
    }

    throw new Error('No verification method type provided')
}

export function createKeyPairRaw(seed?: string): KeyPair {
    return seed ? generateKeyPairFromSeed(fromString(seed)) : generateKeyPair()
}

export function createKeyPairBase64(seed?: string): IKeyPair {
    const keyPair = seed ? generateKeyPairFromSeed(fromString(seed)) : generateKeyPair()
    return {
        publicKey: toString(keyPair.publicKey, 'base64'),
        privateKey: toString(keyPair.secretKey, 'base64'),
    }
}

export function createKeyPairHex(seed?: string): IKeyPair {
    const keyPair = createKeyPairRaw(seed)
    return {
        publicKey: toString(keyPair.publicKey, 'hex'),
        privateKey: toString(keyPair.secretKey, 'hex'),
    }
}

export function createVerificationKeys(keyPair: IKeyPair, algo: MethodSpecificIdAlgo, key: TVerificationKey<TVerificationKeyPrefix, number>, length: number = 32, network: CheqdNetwork = CheqdNetwork.Testnet): IVerificationKeys {
    let methodSpecificId: TMethodSpecificId
    let didUrl: IVerificationKeys['didUrl']
    switch (algo) {
        case MethodSpecificIdAlgo.Base58:
            methodSpecificId = bases['base58btc'].encode(base64ToBytes(keyPair.publicKey))
            didUrl = `did:cheqd:${network}:${methodSpecificId.substring(0, length)}`
            return {
                methodSpecificId,
                didUrl,
                keyId: `${didUrl}#${key}`,
                publicKey: keyPair.publicKey,
            }
        case MethodSpecificIdAlgo.Uuid:
            methodSpecificId = bases['base58btc'].encode(base64ToBytes(keyPair.publicKey))
            didUrl = `did:cheqd:${network}:${v4()}`
            return {
                methodSpecificId,
                didUrl,
                keyId: `${didUrl}#${key}`,
                publicKey: keyPair.publicKey,
            }
    }
}

export function createDidVerificationMethod(verificationMethodTypes: VerificationMethods[], verificationKeys: IVerificationKeys[]): VerificationMethod[] {
    return verificationMethodTypes.map((type, _) => {
        switch (type) {
            case VerificationMethods.Base58:
                return {
                    id: verificationKeys[_].keyId,
                    type: type,
                    controller: verificationKeys[_].didUrl,
                    publicKeyMultibase: verificationKeys[_].methodSpecificId,
                    publicKeyJwk: []
                }

            case VerificationMethods.JWK:
                return {
                    id: verificationKeys[_].keyId,
                    type: type,
                    controller: verificationKeys[_].didUrl,
                    publicKeyJwk: parseToKeyValuePair(
                        {
                            crv: 'Ed25519',
                            kty: 'OKP',
                            x: toString( fromString( verificationKeys[_].publicKey, 'base64pad' ), 'base64url' )
                        }
                    ),
                    publicKeyMultibase: ''
                }
        }
    }) ?? []
}

export function createDidPayload(verificationMethods: VerificationMethod[], verificationKeys: IVerificationKeys[]): MsgCreateDidPayload {
    if (!verificationMethods || verificationMethods.length === 0)
        throw new Error('No verification methods provided')
    if (!verificationKeys || verificationKeys.length === 0)
        throw new Error('No verification keys provided')

    const did = verificationKeys[0].didUrl
    return MsgCreateDidPayload.fromPartial(
        {
            id: did,
            controller: verificationKeys.map(key => key.didUrl),
            verificationMethod: verificationMethods,
            authentication: verificationKeys.map(key => key.keyId)
        }
    )
}

export function createDidPayloadWithSignInputs(seed?: string, keys?: IKeyPair[]) {
    if(seed && keys) throw new Error ('Only one of seed or keys should be passed as an argument')
    
    if(!keys) {
        keys = [seed ? createKeyPairBase64(seed) : createKeyPairBase64()]
    }

    const verificationMethodTypes = keys.map((key) => !key.algo || key.algo == MethodSpecificIdAlgo.Base58 ? VerificationMethods.Base58 : VerificationMethods.JWK)
    const verificationKeys = keys.map((key, i) => createVerificationKeys(key, key.algo || MethodSpecificIdAlgo.Base58, `key-${i}`))
    const verificationMethod = createDidVerificationMethod(verificationMethodTypes, verificationKeys)
    
    let payload : Partial<MsgCreateDidPayload> = {
        id: verificationKeys[0].didUrl,
        controller: verificationKeys.map(key => key.didUrl),
        verificationMethod: verificationMethod,
        authentication: verificationKeys.map(key => key.keyId),
    }

    const keyHexs = keys.map((key)=>convertKeyPairtoTImportableEd25519Key(key))
    const signInputs = keyHexs.map((key)=>createSignInputsFromImportableEd25519Key(key, verificationMethod))

    return { didPayload: MsgCreateDidPayload.fromPartial(payload), keys, signInputs }
}

export function convertKeyPairtoTImportableEd25519Key(keyPair: IKeyPair) : TImportableEd25519Key {
    return {
        type: 'Ed25519',
        privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
        kid: 'kid',
        publicKeyHex: toString(fromString(keyPair.publicKey, 'base64'), 'hex')
    }
}

export function createSignInputsFromKeyPair(didDocument: IdentifierPayload, keys: IKeyPair[]) {
    const keyHexs = keys.map((key)=>convertKeyPairtoTImportableEd25519Key(key))
    const signInputs = keyHexs.map((key)=>createSignInputsFromImportableEd25519Key(key, didDocument.verificationMethod!))
    return signInputs
}
