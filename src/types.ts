import { CheqdSDK } from "."
import { EdDSASigner, Signer } from 'did-jwt'
import { Coin } from "@cosmjs/proto-signing"

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
    Multibase58 = 'Ed25519VerificationKey2020',
    JWK = 'JsonWebKey2020',
}

export type TSignerAlgo = {
    [key in VerificationMethods as string]?: (secretKey: Uint8Array) => Signer
}

export interface ISignInputs {
    verificationMethodId: string
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

export interface DidStdFee {
    readonly amount: readonly Coin[]
    readonly gas: string
    payer?: string
    granter?: string
}