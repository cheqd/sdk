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
                if (JSON.stringify(method.publicKeyJWK) === JSON.stringify(publicKeyJWK)) {
                    return {
                        verificationMethodId: method.id,
                        privateKeyHex: key.privateKeyHex
                    }
                } else {
                    throw new Error(`JWK not matching ${method.publicKeyJWK}, ${publicKeyJWK}`)
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

export function createVerificationKeys(publicKey: string, algo: MethodSpecificIdAlgo, key: TVerificationKey<TVerificationKeyPrefix, number>, network: CheqdNetwork = CheqdNetwork.Testnet): IVerificationKeys {
    let methodSpecificId: TMethodSpecificId
    let didUrl: IVerificationKeys['didUrl']
    
    publicKey = isBase64(publicKey) ? publicKey : toString(fromString(publicKey, 'hex'), 'base64')
    switch (algo) {
        case MethodSpecificIdAlgo.Base58:
            methodSpecificId = bases['base58btc'].encode(base64ToBytes(publicKey))
            didUrl = `did:cheqd:${network}:${(bases['base58btc'].encode((fromString(sha256(publicKey))).slice(0,16))).slice(1)}`
            return {
                methodSpecificId,
                didUrl,
                keyId: `${didUrl}#${key}`,
                publicKey,
            }
        case MethodSpecificIdAlgo.Uuid:
            methodSpecificId = bases['base58btc'].encode(base64ToBytes(publicKey))
            didUrl = `did:cheqd:${network}:${v4()}`
            return {
                methodSpecificId,
                didUrl,
                keyId: `${didUrl}#${key}`,
                publicKey,
            }
    }
}

const isBase64 = (value: string) => /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(value);

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
                    publicKeyJWK: {
                        crv: 'Ed25519',
                        kty: 'OKP',
                        x: toString( fromString( verificationKeys[_].publicKey, 'base64pad' ), 'base64url' )
                    }
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
  
