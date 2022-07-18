import { CheqdSDK } from "."
import { EdDSASigner, Signer } from 'did-jwt'

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
    Multibase = 'Ed25519VerificationKey2020',
    JWK = 'JsonWebKey2020',
}

export type TSignerAlgo = {
    [key in VerificationMethods as string]?: (secretKey: Uint8Array) => Signer
}

export interface ISignInputs {
    verificationMethodId: string
    privateKeyHex: string
}