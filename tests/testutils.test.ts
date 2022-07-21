import { MsgCreateDidPayload } from "@cheqd/ts-proto/cheqd/v1/tx"
import { CheqdNetwork, IKeyPair, IKeyValuePair, TSignerAlgo, VerificationMethods } from "../src/types"
import { bases } from 'multiformats/basics'
import { base64ToBytes } from "did-jwt"
import { fromString, toString } from 'uint8arrays'
import { generateKeyPair, KeyPair } from '@stablelib/ed25519'
import { GasPrice } from "@cosmjs/stargate"

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

export function createDidPayload(keyPair: IKeyPair, verificationMethodType: VerificationMethods, network: CheqdNetwork = CheqdNetwork.Testnet): MsgCreateDidPayload {
    const methodSpecificId = bases['base58btc'].encode(base64ToBytes(keyPair.publicKey))
    const did = `did:cheqd:${network}:${methodSpecificId.substring(0, 16)}`
    const keyId = `${did}#key-1`

    switch (verificationMethodType) {
        case VerificationMethods.Multibase58:
            return MsgCreateDidPayload.fromPartial({
                id: did,
                controller: [did],
                verificationMethod: [
                    {
                        id: keyId,
                        type: VerificationMethods.Multibase58,
                        controller: did,
                        publicKeyMultibase: methodSpecificId
                    }
                ],
                authentication: [keyId]
            })

        case VerificationMethods.JWK:
            const jwk = {
                crv: 'Ed25519',
                kty: 'OKP',
                x: toString( fromString( keyPair.publicKey, 'base64pad' ), 'base64url' )
            }
            return MsgCreateDidPayload.fromPartial({
                id: did,
                controller: [did],
                verificationMethod: [
                    {
                        id: keyId,
                        type: VerificationMethods.JWK,
                        controller: did,
                        publicKeyJwk: parseToKeyValuePair(jwk),
                    }
                ],
                authentication: [keyId]
            })
    }
}

export function parseToKeyValuePair(object: { [key: string]: any }): IKeyValuePair[] {
    return Object.entries(object).map(([key, value]) => ({ key, value }))
}