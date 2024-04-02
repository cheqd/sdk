import {
	Service as ProtobufService,
	VerificationMethod as ProtobufVerificationMethod,
} from '@cheqd/ts-proto/cheqd/did/v2';
import { CheqdSDK } from './index';
import { Coin } from '@cosmjs/proto-signing';
import { Signer } from 'did-jwt';
import { QueryClient } from '@cosmjs/stargate';
import { DIDResolutionResult } from 'did-resolver';
import { DidExtension } from './modules/did';
import { ResourceExtension } from './modules/resource';
export { DIDDocument, VerificationMethod, Service, ServiceEndpoint, JsonWebKey } from 'did-resolver';

export enum CheqdNetwork {
	Mainnet = 'mainnet',
	Testnet = 'testnet',
}

export type QueryExtensionSetup<T> = (base: QueryClient) => T;

export type CheqdExtension<K extends string, V = any> = {
	[P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, never>> extends infer O ? { [Q in keyof O]: O[Q] } : never;
}[K];

export type CheqdExtensions = DidExtension | ResourceExtension;

export interface IModuleMethod {
	(...args: any[]): Promise<any>;
}

export interface IModuleMethodMap extends Record<string, IModuleMethod> {}

export interface IContext {
	sdk: CheqdSDK;
}

export type DIDDocumentWithMetadata = Pick<DIDResolutionResult, 'didDocument' | 'didDocumentMetadata'>;

export type SpecValidationResult = {
	valid: boolean;
	error?: string;
	protobufVerificationMethod?: ProtobufVerificationMethod[];
	protobufService?: ProtobufService[];
};

export enum VerificationMethods {
	Ed255192020 = 'Ed25519VerificationKey2020',
	Ed255192018 = 'Ed25519VerificationKey2018',
	JWK = 'JsonWebKey2020',
}

export enum MethodSpecificIdAlgo {
	Base58 = 'base58btc',
	Uuid = 'uuid',
}

export type TSignerAlgo = {
	[key in VerificationMethods as string]?: (secretKey: Uint8Array) => Signer;
};

export interface ISignInputs {
	verificationMethodId: string;
	keyType?: 'Ed25519' | 'Secp256k1' | 'P256';
	privateKeyHex: string;
}

export interface IKeyPair {
	publicKey: string;
	privateKey: string;
	algo?: MethodSpecificIdAlgo;
}

export interface IKeyValuePair {
	key: string;
	value: any;
}

export type TVerificationKeyPrefix = string;

export type TVerificationKey<K extends TVerificationKeyPrefix, N extends number> = `${K}-${N}`;

export interface IVerificationKeys {
	readonly methodSpecificId: TMethodSpecificId;
	readonly didUrl: `did:cheqd:${CheqdNetwork}:${IVerificationKeys['methodSpecificId']}` extends string
		? string
		: never;
	readonly keyId: `${IVerificationKeys['didUrl']}#${TVerificationKey<TVerificationKeyPrefix, number>}`;
	readonly publicKey: string;
}

export type TMethodSpecificId = string;

export interface DidStdFee {
	readonly amount: readonly Coin[];
	readonly gas: string;
	payer?: string;
	granter?: string;
}

export const ISignInputs = {
	isSignInput(object: Object[]): object is ISignInputs[] {
		return object.some((x) => 'privateKeyHex' in x);
	},
};
