import { CheqdSDK } from "."
import { Coin } from "@cosmjs/proto-signing"
import { Signer } from "did-jwt"

export enum CheqdNetwork {
    Mainnet = 'mainnet',
    Testnet = 'testnet',
}

export interface IModuleMethod {
    (...args: any[]): Promise<any>
}

export interface IModuleMethodMap extends Record<string, IModuleMethod> {}

export interface IContext {
    sdk: CheqdSDK
}

export enum VerificationMethods {
    Base58 = 'Ed25519VerificationKey2020',
    JWK = 'JsonWebKey2020',
}

export enum MethodSpecificIdAlgo {
    Base58 = 'base58btc',
    Uuid = 'uuid',
}

export type TSignerAlgo = {
    // This is wrong: there can be more then one signer of a given type
    [key in VerificationMethods as string]?: (secretKey: Uint8Array) => Signer
}

export interface ISignInputs {
    verificationMethodId: string

    keyType?: "ed25519" | "secp256k1" | "p256"
    privateKeyHex: string
}

export interface IKeyPair {
    publicKey: string
    privateKey: string
}

export interface IKeyValuePair {
    key: string
    value: any
}

export type TVerificationKeyPrefix = string

export type TVerificationKey<K extends TVerificationKeyPrefix, N extends number> = `${K}-${N}`

export interface IVerificationKeys {
    readonly methodSpecificId: TMethodSpecificId
    readonly didUrl: `did:cheqd:${CheqdNetwork}:${IVerificationKeys['methodSpecificId']}` extends string ? string : never
    readonly keyId: `${IVerificationKeys['didUrl']}#${TVerificationKey<TVerificationKeyPrefix, number>}`
    readonly publicKey: string
}

export type TMethodSpecificId = string

export interface DidStdFee {
    readonly amount: readonly Coin[]
    readonly gas: string
    payer?: string
    granter?: string
}