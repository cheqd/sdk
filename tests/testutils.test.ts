import { MsgCreateDidDocPayload, VerificationMethod } from "@cheqd/ts-proto/cheqd/did/v2"
import { CheqdNetwork, IKeyPair, IVerificationKeys, MethodSpecificIdAlgo, MsgCreateDidPayload, TMethodSpecificId, TVerificationKey, TVerificationKeyPrefix, VerificationMethodPayload, VerificationMethods } from "../src/types"
import { bases } from 'multiformats/basics'
import { base58ToBytes, base64ToBytes } from "did-jwt"
import { fromString, toString } from 'uint8arrays'
import { generateKeyPair, KeyPair } from '@stablelib/ed25519'
import { GasPrice } from "@cosmjs/stargate"
import { v4 } from 'uuid'
import { createHash } from 'crypto'
import { convertKeyPairtoTImportableEd25519Key } from "../src/utils"

export const faucet = {
    prefix: 'cheqd',
    minimalDenom: 'ncheq',
    mnemonic: 'sketch mountain erode window enact net enrich smoke claim kangaroo another visual write meat latin bacon pulp similar forum guilt father state erase bright',
    address: 'cheqd1rnr5jrt4exl0samwj0yegv99jeskl0hsxmcz96',
}

export const exampleCheqdNetwork = {
    network: 'testnet',
    rpcUrl: 'http://localhost:26657',
    gasPrice: GasPrice.fromString( `50${faucet.minimalDenom}` )
}

// multicodec ed25519-pub header as varint
const MULTICODEC_ED25519_PUB_HEADER = new Uint8Array([0xed, 0x01]);

/**
 *? General test utils. Look for src/utils.ts for stable utils exports.
 *? Used for testing purposes.
 ** NOTE: The following utils are stable but subject to change at any given moment.
 */
export function createKeyPairRaw(): KeyPair {
    return generateKeyPair()
}

/**
 *? General test utils. Look for src/utils.ts for stable utils exports.
 *? Used for testing purposes.
 ** NOTE: The following utils are stable but subject to change at any given moment.
 */
export function createKeyPairBase64(): IKeyPair {
    const keyPair = generateKeyPair()
    return {
        publicKey: toString(keyPair.publicKey, 'base64'),
        privateKey: toString(keyPair.secretKey, 'base64'),
    }
}

/**
 *? General test utils. Look for src/utils.ts for stable utils exports.
 *? Used for testing purposes.
 ** NOTE: The following utils are stable but subject to change at any given moment.
 */
export function createKeyPairHex(): IKeyPair {
    const keyPair = generateKeyPair()
    return {
        publicKey: toString(keyPair.publicKey, 'hex'),
        privateKey: toString(keyPair.secretKey, 'hex'),
    }
}

/**
 *? General test utils. Look for src/utils.ts for stable utils exports.
 *? Used for testing purposes.
 ** NOTE: The following utils are stable but subject to change at any given moment.
 */
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

/**
 *? General test utils. Look for src/utils.ts for stable utils exports.
 *? Used for testing purposes.
 ** NOTE: The following utils are stable but subject to change at any given moment.
 */
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

/**
 *? General test utils. Look for src/utils.ts for stable utils exports.
 *? Used for testing purposes.
 ** NOTE: The following utils are stable but subject to change at any given moment.
 */
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

  function _encodeMbKey(header: any, key: Uint8Array) {
    const mbKey = new Uint8Array(header.length + key.length);
  
    mbKey.set(header);
    mbKey.set(key, header.length);
  
    return bases['base58btc'].encode(mbKey);
  }
