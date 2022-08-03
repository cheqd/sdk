import { MsgCreateDidPayload } from "@cheqd/ts-proto/cheqd/v1/tx"
import { CheqdNetwork, IKeyPair, IVerificationKeys, MethodSpecificIdAlgo, TMethodSpecificId, TVerificationKey, TVerificationKeyPrefix, VerificationMethods } from "../src/types"
import { bases } from 'multiformats/basics'
import { base64ToBytes } from "did-jwt"
import { fromString, toString } from 'uint8arrays'
import { generateKeyPair, KeyPair } from '@stablelib/ed25519'
import { GasPrice } from "@cosmjs/stargate"
import { v4 } from 'uuid'
import { VerificationMethod } from "@cheqd/ts-proto/cheqd/v1/did"
import { parseToKeyValuePair } from '../src/utils'

export const faucet = {
    prefix: 'cheqd',
    minimalDenom: 'ncheq',
    mnemonic: 'sketch mountain erode window enact net enrich smoke claim kangaroo another visual write meat latin bacon pulp similar forum guilt father state erase bright',
    address: 'cheqd1rnr5jrt4exl0samwj0yegv99jeskl0hsxmcz96',
}

export const exampleCheqdNetwork = {
    network: 'testnet',
    rpcUrl: 'https://rpc.cheqd.network',
    gasPrice: GasPrice.fromString( `25${faucet.minimalDenom}` )
}

export function createKeyPairRaw(): KeyPair {
    return generateKeyPair()
}

export function createKeyPairBase64(): IKeyPair {
    const keyPair = generateKeyPair()
    return {
        publicKey: toString(keyPair.publicKey, 'base64'),
        privateKey: toString(keyPair.secretKey, 'base64'),
    }
}

export function createKeyPairHex(): IKeyPair {
    const keyPair = generateKeyPair()
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