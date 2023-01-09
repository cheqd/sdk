import {
    MsgCreateDidDocPayload,
    MsgUpdateDidDocPayload,
    VerificationMethod 
} from "@cheqd/ts-proto/cheqd/did/v2"
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
    IVerificationKeys, 
    MsgCreateDidPayload,
    VerificationMethodPayload,
    MsgUpdateDidPayload
} from "./types"
import { fromString, toString } from 'uint8arrays'
import { bases } from "multiformats/basics"
import { base64ToBytes } from "did-jwt"
import { generateKeyPair, generateKeyPairFromSeed, KeyPair } from '@stablelib/ed25519'
import { v4 } from 'uuid'
import { createHash } from 'crypto'

export type TImportableEd25519Key = {
    publicKeyHex: string
    privateKeyHex: string
    kid: string
    type: "Ed25519"
}

// multicodec ed25519-pub header as varint
const MULTICODEC_ED25519_PUB_HEADER = new Uint8Array([0xed, 0x01]);

export type IdentifierPayload = Partial<MsgCreateDidPayload> | Partial<MsgUpdateDidPayload>

export function isEqualKeyValuePair(kv1: IKeyValuePair[], kv2: IKeyValuePair[]): boolean {
    return kv1.every((item, index) => item.key === kv2[index].key && item.value === kv2[index].value)
}

export function createSignInputsFromImportableEd25519Key(key: TImportableEd25519Key, verificationMethod: VerificationMethodPayload[]): ISignInputs {
    if (verificationMethod?.length === 0) throw new Error('No verification methods provided')

    const publicKey = fromString(key.publicKeyHex, 'hex')

    for(const method of verificationMethod) {
        switch (method?.type) {
            case VerificationMethods.Ed255192020:
                const publicKeyMultibase = _encodeMbKey(MULTICODEC_ED25519_PUB_HEADER, publicKey)
                if (method.publicKeyMultibase === publicKeyMultibase) {
                    return {
                        verificationMethodId: method.id,
                        privateKeyHex: key.privateKeyHex
                    }
                }
            
            case VerificationMethods.Ed255192018:
                const publicKeyBase58 = bases['base58btc'].encode(publicKey).slice(1)
                if (method.publicKeyBase58 === publicKeyBase58) {
                    return {
                        verificationMethodId: method.id,
                        privateKeyHex: key.privateKeyHex
                    }
                }

            case VerificationMethods.JWK:
                const publicKeyJWK: any = {
                    crv: 'Ed25519',
                    kty: 'OKP',
                    x: toString( publicKey, 'base64url' )
                }
                if (method.publicKeyJWK! === publicKeyJWK) {
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
            didUrl = `did:cheqd:${network}:${(bases['base58btc'].encode((fromString(sha256(keyPair.publicKey))).slice(0,16))).slice(1)}`
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

export function createDidVerificationMethod(verificationMethodTypes: VerificationMethods[], verificationKeys: IVerificationKeys[]): VerificationMethodPayload[] {
    return verificationMethodTypes.map((type, _) => {
        switch (type) {
            case VerificationMethods.Ed255192020:
                return {
                    id: verificationKeys[_].keyId,
                    type,
                    controller: verificationKeys[_].didUrl,
                    publicKeyMultibase: _encodeMbKey(MULTICODEC_ED25519_PUB_HEADER, base64ToBytes(verificationKeys[_].publicKey))
                }
            
            case VerificationMethods.Ed255192018:
                return {
                    id: verificationKeys[_].keyId,
                    type,
                    controller: verificationKeys[_].didUrl,
                    publicKeyBase58: verificationKeys[_].methodSpecificId.slice(1)
                }

            case VerificationMethods.JWK:
                return {
                    id: verificationKeys[_].keyId,
                    type,
                    controller: verificationKeys[_].didUrl,
                    publicKeyJWK: JSON.stringify({
                            crv: 'Ed25519',
                            kty: 'OKP',
                            x: toString( fromString( verificationKeys[_].publicKey, 'base64pad' ), 'base64url' )
                        }
                    )
                }
        }
    }) ?? []
}

export function createDidPayload(verificationMethods: VerificationMethodPayload[], verificationKeys: IVerificationKeys[]): MsgCreateDidPayload {
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
            authentication: verificationKeys.map(key => key.keyId),
            versionId: v4()
        }
    )
}

export function createDidPayloadWithSignInputs(seed?: string, keys?: IKeyPair[]) {
    if(seed && keys) throw new Error ('Only one of seed or keys should be passed as an argument')
    
    if(!keys) {
        keys = [seed ? createKeyPairBase64(seed) : createKeyPairBase64()]
    }

    const verificationMethodTypes = keys.map((key) => !key.algo || key.algo == MethodSpecificIdAlgo.Base58 ? VerificationMethods.Ed255192020 : VerificationMethods.JWK)
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

    return { didPayload: MsgCreateDidDocPayload.fromPartial(payload), keys, signInputs }
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
    const signInputs = keyHexs.map((key)=>createSignInputsFromImportableEd25519Key(key, didDocument.verificationMethod || []))
    return signInputs
}

function sha256(message: string) {
    return createHash('sha256').update(message).digest('hex')
}

// encode a multibase base58-btc multicodec key
function _encodeMbKey(header: any, key: Uint8Array) {
    const mbKey = new Uint8Array(header.length + key.length);
  
    mbKey.set(header);
    mbKey.set(key, header.length);
  
    return bases['base58btc'].encode(mbKey);
  }
  
