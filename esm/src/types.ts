import {
	Service as ProtobufService,
	VerificationMethod as ProtobufVerificationMethod,
} from '@cheqd/ts-proto/cheqd/did/v2/index.js';
import { CheqdSDK } from './index.js';
import { Coin, EncodeObject } from '@cosmjs/proto-signing';
import { Signer } from 'did-jwt';
import { QueryClient } from '@cosmjs/stargate';
import { DIDDocument, DIDResolutionResult } from 'did-resolver';
import { DidExtension } from './modules/did.js';
import { ResourceExtension } from './modules/resource.js';
import { FeemarketExtension } from './modules/feemarket.js';
import { FeeabstractionExtension } from './modules/feeabstraction.js';
import { GetTxResponse, SimulateResponse } from 'cosmjs-types/cosmos/tx/v1beta1/service.js';
import { Any } from 'cosmjs-types/google/protobuf/any.js';
import { Pubkey } from '@cosmjs/amino';
import { MovingAverage, OracleExtension, WMAStrategy } from './modules/oracle.js';
export { DIDDocument, VerificationMethod, Service, ServiceEndpoint, JsonWebKey } from 'did-resolver';

/** Supported Cheqd blockchain networks */
export enum CheqdNetwork {
	/** Production network for live transactions */
	Mainnet = 'mainnet',
	/** Test network for development and testing */
	Testnet = 'testnet',
}

/** Function type for setting up query extensions on a base QueryClient */
export type QueryExtensionSetup<T> = (base: QueryClient) => T;

/**
 * Utility type for creating exclusive extension objects where only one extension can be active at a time.
 * Ensures type safety when working with mutually exclusive extensions.
 */
export type CheqdExtension<K extends string, V = any> = {
	[P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, never>> extends infer O ? { [Q in keyof O]: O[Q] } : never;
}[K];

/** Union type of all supported Cheqd query extensions */
export type CheqdExtensions =
	| DidExtension
	| ResourceExtension
	| FeemarketExtension
	| FeeabstractionExtension
	| OracleExtension;

/**
 * Extension interface for transaction-related operations.
 * Provides methods for transaction retrieval and simulation.
 */
export interface TxExtension {
	readonly tx: {
		/** Retrieves a transaction by its ID */
		getTx: (txId: string) => Promise<GetTxResponse>;
		/** Simulates a transaction to estimate gas usage and validate execution */
		simulate: (
			messages: readonly Any[],
			memo: string | undefined,
			signer: Pubkey,
			signerAddress: string,
			sequence: number,
			gasLimit: number
		) => Promise<SimulateResponse>;
	};
}

/** Generic interface for module methods that can be executed with variable arguments */
export interface IModuleMethod {
	(...args: any[]): Promise<any>;
}

/** Map of method names to their corresponding module method implementations */
/** Map of method names to their corresponding module method implementations */
export interface IModuleMethodMap extends Record<string, IModuleMethod> {}

/** Context interface providing access to the SDK instance for module methods */
export interface IContext {
	sdk: CheqdSDK;
}

/** DID document with associated metadata from resolution results */
export type DIDDocumentWithMetadata = Pick<DIDResolutionResult, 'didDocument' | 'didDocumentMetadata'>;

/**
 * Result of DID specification validation containing validation status,
 * error information, and converted protobuf objects.
 */
export type SpecValidationResult = {
	/** Whether the validation passed */
	valid: boolean;
	/** Error message if validation failed */
	error?: string;
	/** Converted verification methods in protobuf format */
	protobufVerificationMethod?: ProtobufVerificationMethod[];
	/** Converted services in protobuf format */
	protobufService?: ProtobufService[];
};

/**
 * Result of authentication validation for DID operations,
 * including resolved external controllers and previous document state.
 */
export type AuthenticationValidationResult = {
	/** Whether the authentication validation passed */
	valid: boolean;
	/** Error message if validation failed */
	error?: string;
	/** Resolved external controller DID documents */
	externalControllersDocuments?: DIDDocument[];
	/** Previous version of the DID document for updates */
	previousDidDocument?: DIDDocument;
};

/**
 * Batched messages grouped by gas consumption limits,
 * with corresponding gas estimates for each batch.
 */
export type MessageBatch = {
	/** Array of message batches grouped by gas limits */
	readonly batches: EncodeObject[][];
	/** Gas estimates for each corresponding batch */
	readonly gas: number[];
};

/** Supported verification method types for DID documents */
export enum VerificationMethods {
	/** Ed25519 verification key (2020 specification) */
	Ed255192020 = 'Ed25519VerificationKey2020',
	/** Ed25519 verification key (2018 specification) */
	Ed255192018 = 'Ed25519VerificationKey2018',
	/** JSON Web Key (2020 specification) */
	JWK = 'JsonWebKey2020',
}

/** Supported algorithms for generating method-specific identifiers */
export enum MethodSpecificIdAlgo {
	/** Base58 Bitcoin encoding */
	Base58 = 'base58btc',
	/** UUID format */
	Uuid = 'uuid',
}

/** Map of verification method types to their corresponding signer algorithms */
export type TSignerAlgo = {
	[key in VerificationMethods as string]?: (secretKey: Uint8Array) => Signer;
};

/**
 * Interface for signing inputs containing verification method details
 * and the private key required for signing operations.
 */
export interface ISignInputs {
	/** ID of the verification method to use for signing */
	verificationMethodId: string;
	/** Type of cryptographic key (Ed25519, Secp256k1, or P256) */
	keyType?: 'Ed25519' | 'Secp256k1' | 'P256';
	/** Private key in hexadecimal format */
	privateKeyHex: string;
}

/**
 * Interface representing a cryptographic key pair with optional algorithm specification.
 */
export interface IKeyPair {
	/** Public key string */
	publicKey: string;
	/** Private key string */
	privateKey: string;
	/** Optional algorithm used for key generation */
	algo?: MethodSpecificIdAlgo;
}

/** Generic key-value pair interface for flexible data storage */
export interface IKeyValuePair {
	/** The key identifier */
	key: string;
	/** The associated value (can be any type) */
	value: any;
}

/** String type for verification key prefixes */
export type TVerificationKeyPrefix = string;

/** Template literal type for creating verification key identifiers with prefix and number */
export type TVerificationKey<K extends TVerificationKeyPrefix, N extends number> = `${K}-${N}`;

/**
 * Interface for verification key structures with strongly typed DID URLs and key IDs.
 * Provides type safety for Cheqd DID identifiers and verification key relationships.
 */
export interface IVerificationKeys {
	/** Method-specific identifier for the DID */
	readonly methodSpecificId: TMethodSpecificId;
	/** Fully qualified DID URL for the Cheqd network */
	readonly didUrl: `did:cheqd:${CheqdNetwork}:${IVerificationKeys['methodSpecificId']}` extends string
		? string
		: never;
	/** Key identifier combining DID URL with verification key fragment */
	readonly keyId: `${IVerificationKeys['didUrl']}#${TVerificationKey<TVerificationKeyPrefix, number>}`;
	/** Public key string representation */
	readonly publicKey: string;
}

/** String type representing a method-specific identifier for DIDs */
export type TMethodSpecificId = string;

/**
 * DID-specific fee structure extending standard fee with payer and granter support.
 * Enables fee delegation and payment by third parties for DID operations.
 */
export interface DidStdFee {
	/** Array of coins representing the fee amount */
	readonly amount: readonly Coin[];
	/** Gas limit for the transaction */
	readonly gas: string;
	/** Optional address of the account paying the fees */
	payer?: string;
	/** Optional address of the account granting fee payment permissions */
	granter?: string;
}

/**
 * Identity-specific fee options for DID and DLR transactions.
 * Enables customization of fee payment and slippage tolerance.
 */
export interface DidFeeOptions {
	/** Optional explicit USD amount, otherwise we use lower bound from parameters */
	wantedAmountUsd?: string;
	/** Optional slippage in basis points; default is module's defaultSlippageBps */
	slippageBps?: number;
	/**
	 * Optional fee denom.
	 * - If 'ncheq': pay in native after oracle conversion.
	 * - If accepted fee-abstraction denom: go through fee-abstraction flow.
	 * - If omitted: pay in native 'ncheq'.
	 */
	feeDenom?: string;
	/** Optional gas limit for the transaction */
	gasLimit?: string;
	/** Optional moving average type. */
	movingAverageType?: MovingAverage;
	/** Optional WMA strategy, if applicable */
	wmaStrategy?: WMAStrategy;
	/** Optional weights for WMA strategy CUSTOM, if applicable */
	wmaWeights?: number[];
}

/**
 * Utility object providing type guard functions for ISignInputs validation.
 * Contains helper methods to validate and type-check signing input objects.
 */
export const ISignInputs = {
	/** Type guard function to check if an object array contains valid ISignInputs */
	isSignInput(object: Object[]): object is ISignInputs[] {
		return object.some((x) => 'privateKeyHex' in x);
	},
};

/** Enumeration of supported service types for DID documents */
export enum ServiceType {
	/** Service type for linking domain names to DIDs */
	LinkedDomains = 'LinkedDomains',
}
