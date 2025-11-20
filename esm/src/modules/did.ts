import { createPagination, createProtobufRpcClient, DeliverTxResponse, QueryClient } from '@cosmjs/stargate';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_.js';
import { CheqdSigningStargateClient } from '../signer.js';
import {
	DIDDocument,
	DidStdFee,
	IContext,
	ISignInputs,
	QueryExtensionSetup,
	SpecValidationResult,
	VerificationMethods,
	DIDDocumentWithMetadata,
	AuthenticationValidationResult,
	DidFeeOptions,
} from '../types.js';
import {
	MsgCreateDidDoc,
	MsgCreateDidDocPayload,
	MsgCreateDidDocResponse,
	MsgDeactivateDidDoc,
	MsgDeactivateDidDocPayload,
	MsgDeactivateDidDocResponse,
	MsgUpdateDidDoc,
	MsgUpdateDidDocPayload,
	MsgUpdateDidDocResponse,
	protobufPackage,
	QueryClientImpl,
	SignInfo,
	VerificationMethod,
	QueryAllDidDocVersionsMetadataResponse,
	DidDocWithMetadata,
	DidDoc,
	Metadata,
	QueryParamsResponse,
	FeeRange,
} from '@cheqd/ts-proto/cheqd/did/v2/index.js';
import { EncodeObject, GeneratedType, parseCoins } from '@cosmjs/proto-signing';
import { v4 } from 'uuid';
import { assert } from '@cosmjs/utils';
import { PageRequest } from '@cheqd/ts-proto/cosmos/base/query/v1beta1/pagination.js';
import { CheqdQuerier } from '../querier.js';
import { DIDDocumentMetadata } from 'did-resolver';
import { denormalizeService, normalizeAuthentication, normalizeController, normalizeService } from '../utils.js';
import { defaultOracleExtensionKey, MovingAverages, OracleExtension, WMAStrategies } from './oracle.js';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin.js';

/** Default extension key for DID-related query operations */
export const defaultDidExtensionKey = 'did' as const;

/**
 * Standard W3C and DID-related context URIs used in DID documents.
 * These contexts define the semantic meaning of properties in DID documents.
 */
export const contexts = {
	/** W3C DID Core v1 context */
	W3CDIDv1: 'https://www.w3.org/ns/did/v1',
	/** Ed25519 Signature Suite 2020 context */
	W3CSuiteEd255192020: 'https://w3id.org/security/suites/ed25519-2020/v1',
	/** Ed25519 Signature Suite 2018 context */
	W3CSuiteEd255192018: 'https://w3id.org/security/suites/ed25519-2018/v1',
	/** JSON Web Signature Suite 2020 context */
	W3CSuiteJws2020: 'https://w3id.org/security/suites/jws-2020/v1',
	/** Linked Domains context for domain verification */
	LinkedDomainsContext: 'https://identity.foundation/.well-known/did-configuration/v1',
} as const;

/**
 * Protobuf message type literals for DID operations.
 * Used for consistent message type identification across the module.
 */
export const protobufLiterals = {
	/** Create DID document message type */
	MsgCreateDidDoc: 'MsgCreateDidDoc',
	/** Create DID document response message type */
	MsgCreateDidDocResponse: 'MsgCreateDidDocResponse',
	/** Update DID document message type */
	MsgUpdateDidDoc: 'MsgUpdateDidDoc',
	/** Update DID document response message type */
	MsgUpdateDidDocResponse: 'MsgUpdateDidDocResponse',
	/** Deactivate DID document message type */
	MsgDeactivateDidDoc: 'MsgDeactivateDidDoc',
	/** Deactivate DID document response message type */
	MsgDeactivateDidDocResponse: 'MsgDeactivateDidDocResponse',
} as const;
/** Type URL for MsgCreateDidDoc messages */
export const typeUrlMsgCreateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgCreateDidDoc}` as const;
/** Type URL for MsgCreateDidDocResponse messages */
export const typeUrlMsgCreateDidDocResponse =
	`/${protobufPackage}.${protobufLiterals.MsgCreateDidDocResponse}` as const;
/** Type URL for MsgUpdateDidDoc messages */
export const typeUrlMsgUpdateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgUpdateDidDoc}` as const;
/** Type URL for MsgUpdateDidDocResponse messages */
export const typeUrlMsgUpdateDidDocResponse =
	`/${protobufPackage}.${protobufLiterals.MsgUpdateDidDocResponse}` as const;
/** Type URL for MsgDeactivateDidDoc messages */
export const typeUrlMsgDeactivateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgDeactivateDidDoc}` as const;
/** Type URL for MsgDeactivateDidDocResponse messages */
export const typeUrlMsgDeactivateDidDocResponse =
	`/${protobufPackage}.${protobufLiterals.MsgDeactivateDidDocResponse}` as const;

/**
 * Encode object interface for MsgCreateDidDoc messages.
 * Used for type-safe message encoding in transactions.
 */
export interface MsgCreateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDoc;
	readonly value: Partial<MsgCreateDidDoc>;
}

/**
 * Type guard function to check if an object is a MsgCreateDidDocEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgCreateDidDocEncodeObject
 */
export function isMsgCreateDidDocEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDoc;
}

/**
 * Type guard function to check if an object is a MsgUpdateDidDocEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgUpdateDidDocEncodeObject
 */
export function isMsgUpdateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDoc;
}

/**
 * Type guard function to check if an object is a MsgDeactivateDidDocEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgDeactivateDidDocEncodeObject
 */
export function isMsgDeactivateDidDocEncodeObject(obj: EncodeObject): obj is MsgDeactivateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgDeactivateDidDoc;
}

/**
 * Encode object interface for MsgCreateDidDocResponse messages.
 * Used for type-safe response message handling.
 */
export interface MsgCreateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDocResponse;
	readonly value: Partial<MsgCreateDidDocResponse>;
}

/**
 * Type guard function to check if an object is a MsgCreateDidDocResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgCreateDidDocResponseEncodeObject
 */
export function MsgCreateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDocResponse;
}

/**
 * Encode object interface for MsgUpdateDidDoc messages.
 * Used for type-safe message encoding in update transactions.
 */
export interface MsgUpdateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDoc;
	readonly value: Partial<MsgUpdateDidDoc>;
}

/**
 * Type guard function to check if an object is a MsgUpdateDidDocEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgUpdateDidDocEncodeObject
 */
export function MsgUpdateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDoc;
}

/**
 * Encode object interface for MsgUpdateDidDocResponse messages.
 * Used for type-safe response message handling in update operations.
 */
export interface MsgUpdateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDocResponse;
	readonly value: Partial<MsgUpdateDidDocResponse>;
}

/**
 * Type guard function to check if an object is a MsgUpdateDidDocResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgUpdateDidDocResponseEncodeObject
 */
export function MsgUpdateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse;
}

/**
 * Encode object interface for MsgDeactivateDidDoc messages.
 * Used for type-safe message encoding in deactivation transactions.
 */
export interface MsgDeactivateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDoc;
	readonly value: Partial<MsgDeactivateDidDoc>;
}

/**
 * Type guard function to check if an object is a MsgDeactivateDidDocEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgDeactivateDidDocEncodeObject
 */
export function MsgDeactivateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgDeactivateDidDoc;
}

/**
 * Encode object interface for MsgDeactivateDidDocResponse messages.
 * Used for type-safe response message handling in deactivation operations.
 */
export interface MsgDeactivateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDocResponse;
	readonly value: Partial<MsgDeactivateDidDocResponse>;
}

/**
 * Type guard function to check if an object is a MsgDeactivateDidDocResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgDeactivateDidDocResponseEncodeObject
 */
export function MsgDeactiveDidDocResponseEncodeObject(
	obj: EncodeObject
): obj is MsgDeactivateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse;
}

/** Minimal importable version of the DID module for clean external interfaces */
export type MinimalImportableDIDModule = MinimalImportableCheqdSDKModule<DIDModule>;

/**
 * DID extension interface for querier functionality.
 * Provides methods for querying DID documents and their versions.
 */
export type DidExtension = {
	readonly [defaultDidExtensionKey]: {
		/** Query a DID document by ID */
		readonly didDoc: (id: string) => Promise<DidDocWithMetadata>;
		/** Query a specific version of a DID document */
		readonly didDocVersion: (id: string, versionId: string) => Promise<DidDocWithMetadata>;
		/** Query metadata for all versions of a DID document */
		readonly allDidDocVersionsMetadata: (
			id: string,
			paginationKey?: Uint8Array
		) => Promise<QueryAllDidDocVersionsMetadataResponse>;
		/** Query DID module parameters */
		readonly params: () => Promise<QueryParamsResponse>;
	};
};

/**
 * Sets up the DID extension for the querier client.
 * Creates and configures the DID-specific query methods.
 *
 * @param base - Base QueryClient to extend
 * @returns Configured DID extension with query methods
 */
export const setupDidExtension = (base: QueryClient): DidExtension => {
	const rpc = createProtobufRpcClient(base);

	const queryService = new QueryClientImpl(rpc);

	return {
		[defaultDidExtensionKey]: {
			didDoc: async (id: string) => {
				const { value } = await queryService.DidDoc({ id });
				assert(value);
				return value;
			},
			didDocVersion: async (id: string, versionId: string) => {
				const { value } = await queryService.DidDocVersion({ id, version: versionId });
				assert(value);
				return value;
			},
			allDidDocVersionsMetadata: async (id: string, paginationKey?: Uint8Array) => {
				const response = await queryService.AllDidDocVersionsMetadata({
					id,
					pagination: createPagination(paginationKey) as PageRequest | undefined,
				});
				return response;
			},
			params: async () => {
				const response = await queryService.Params({});
				assert(response.params);
				return response;
			},
		},
	} as DidExtension;
};

/**
 * DID Module class providing comprehensive DID document management functionality.
 * Handles creation, updates, deactivation, and querying of DID documents on the Cheqd blockchain.
 */
export class DIDModule extends AbstractCheqdSDKModule {
	// @ts-expect-error underlying type `GeneratedType` is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlMsgCreateDidDoc, MsgCreateDidDoc],
		[typeUrlMsgCreateDidDocResponse, MsgCreateDidDocResponse],
		[typeUrlMsgUpdateDidDoc, MsgUpdateDidDoc],
		[typeUrlMsgUpdateDidDocResponse, MsgUpdateDidDocResponse],
		[typeUrlMsgDeactivateDidDoc, MsgDeactivateDidDoc],
		[typeUrlMsgDeactivateDidDocResponse, MsgDeactivateDidDocResponse],
	];

	/** Base denomination for Cheqd network transactions */
	static readonly baseMinimalDenom = 'ncheq' as const;

	/** Base denomination in USD for Cheqd network transactions */
	static readonly baseUsdDenom = 'usd' as const;

	/** Default slippage tolerance in base points (BPS) */
	static readonly defaultSlippageBps = 500n;

	/**
	 * Standard fee amounts for DID operations.
	 * These represent the default costs for different DID document operations.
	 */
	static readonly fees = {
		/** Default fee for creating a new DID document */
		DefaultCreateDidDocFee: { amount: '50000000000', denom: DIDModule.baseMinimalDenom } as const,
		/** Default fee for updating an existing DID document */
		DefaultUpdateDidDocFee: { amount: '25000000000', denom: DIDModule.baseMinimalDenom } as const,
		/** Default fee for deactivating a DID document */
		DefaultDeactivateDidDocFee: { amount: '10000000000', denom: DIDModule.baseMinimalDenom } as const,
		/** Default fee for creating a new DID document in USD */
		DefaultCreateDidDocFeeUSD: { amount: '2000000000000000000', denom: DIDModule.baseUsdDenom } as const,
		/** Default fee for updating an existing DID document in USD */
		DefaultUpdateDidDocFeeUSD: { amount: '1000000000000000000', denom: DIDModule.baseUsdDenom } as const,
		/** Default fee for deactivating a DID document in USD */
		DefaultDeactivateDidDocFeeUSD: { amount: '400000000000000000', denom: DIDModule.baseUsdDenom } as const,
	} as const;

	/**
	 * Standard gas limits for DID operations.
	 * These represent the default gas limits for different DID document operations.
	 */
	static readonly gasLimits = {
		/** Gas limit for creating a new DID document */
		CreateDidDocGasLimit: '360000',
		/** Gas limit for updating an existing DID document */
		UpdateDidDocGasLimit: '360000',
		/** Gas limit for deactivating a DID document */
		DeactivateDidDocGasLimit: '360000',
	} as const;

	/** Querier extension setup function for DID operations */
	static readonly querierExtensionSetup: QueryExtensionSetup<DidExtension> = setupDidExtension;

	/** Querier instance with DID extension capabilities */
	querier: CheqdQuerier & DidExtension & OracleExtension;

	/**
	 * Constructs a new DID module instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client with DID extension for data retrieval
	 */
	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & DidExtension & OracleExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			createDidDocTx: this.createDidDocTx.bind(this),
			updateDidDocTx: this.updateDidDocTx.bind(this),
			deactivateDidDocTx: this.deactivateDidDocTx.bind(this),
			queryDidDoc: this.queryDidDoc.bind(this),
			queryDidDocVersion: this.queryDidDocVersion.bind(this),
			queryAllDidDocVersionsMetadata: this.queryAllDidDocVersionsMetadata.bind(this),
			queryParams: this.queryParams.bind(this),
			generateCreateDidDocFees: this.generateCreateDidDocFees.bind(this),
			generateUpdateDidDocFees: this.generateUpdateDidDocFees.bind(this),
			generateDeactivateDidDocFees: this.generateDeactivateDidDocFees.bind(this),
			getPriceRangeFromParams: this.getPriceRangeFromParams.bind(this),
		};
	}

	/**
	 * Gets the registry types for DID message encoding/decoding.
	 *
	 * @returns Iterable of [typeUrl, GeneratedType] pairs for the registry
	 */
	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return DIDModule.registryTypes;
	}

	/**
	 * Gets the querier extension setup for DID operations.
	 *
	 * @returns Query extension setup function for DID functionality
	 */
	public getQuerierExtensionSetup(): QueryExtensionSetup<DidExtension> {
		return DIDModule.querierExtensionSetup;
	}

	/**
	 * Creates a new DID document transaction on the blockchain.
	 * Validates the DID payload and authentication before submission.
	 *
	 * @param signInputs - Signing inputs or pre-computed signatures for the transaction
	 * @param didPayload - DID document payload to create
	 * @param address - Address of the account submitting the transaction
	 * @param fee - Transaction fee configuration or 'auto' for automatic calculation
	 * @param memo - Optional transaction memo
	 * @param versionId - Optional version identifier for the DID document
	 * @param feeOptions - Optional fee options for the transaction
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 * @throws Error if DID payload is not spec compliant or authentication is invalid
	 */
	async createDidDocTx(
		signInputs: ISignInputs[] | SignInfo[],
		didPayload: DIDDocument,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo?: string,
		versionId?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer;
		}

		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}

		if (!versionId || versionId === '') {
			versionId = v4();
		}

		const { valid, error, protobufVerificationMethod, protobufService } =
			await DIDModule.validateSpecCompliantPayload(didPayload);

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`);
		}

		const { valid: authenticationValid, error: authenticationError } =
			await DIDModule.validateAuthenticationAgainstSignatures(didPayload, signInputs as SignInfo[], this.querier);

		if (!authenticationValid) {
			throw new Error(`DID authentication is not valid: ${authenticationError}`);
		}

		const payload = MsgCreateDidDocPayload.fromPartial({
			context: <string[]>didPayload?.['@context'],
			id: didPayload.id,
			controller: <string[]>didPayload.controller,
			verificationMethod: protobufVerificationMethod,
			authentication: <string[]>didPayload.authentication,
			assertionMethod: <string[]>didPayload.assertionMethod,
			capabilityInvocation: <string[]>didPayload.capabilityInvocation,
			capabilityDelegation: <string[]>didPayload.capabilityDelegation,
			keyAgreement: <string[]>didPayload.keyAgreement,
			service: protobufService,
			alsoKnownAs: <string[]>didPayload.alsoKnownAs,
			versionId: versionId,
		});

		let signatures: SignInfo[];
		if (ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signCreateDidDocTx(signInputs, payload);
		} else {
			signatures = signInputs;
		}

		const value: MsgCreateDidDoc = {
			payload,
			signatures,
		};

		const createDidMsg: MsgCreateDidDocEncodeObject = {
			typeUrl: typeUrlMsgCreateDidDoc,
			value,
		};

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address;
		}

		if (!fee) {
			fee = await this.generateCreateDidDocFees(address, undefined, feeOptions, context);
		}

		return this._signer.signAndBroadcast(address, [createDidMsg], fee!, memo);
	}

	/**
	 * Updates an existing DID document transaction on the blockchain.
	 * Validates the updated DID payload and handles key rotation scenarios.
	 *
	 * @param signInputs - Signing inputs or pre-computed signatures for the transaction
	 * @param didPayload - Updated DID document payload
	 * @param address - Address of the account submitting the transaction
	 * @param fee - Transaction fee configuration or 'auto' for automatic calculation
	 * @param memo - Optional transaction memo
	 * @param versionId - Optional version identifier for the updated DID document
	 * @param feeOptions - Optional fee options for the transaction
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 * @throws Error if DID payload is not spec compliant or authentication is invalid
	 */
	async updateDidDocTx(
		signInputs: ISignInputs[] | SignInfo[],
		didPayload: DIDDocument,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo?: string,
		versionId?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer;
		}

		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}

		if (!versionId || versionId === '') {
			versionId = v4();
		}

		const { valid, error, protobufVerificationMethod, protobufService } =
			await DIDModule.validateSpecCompliantPayload(didPayload);

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`);
		}

		const {
			valid: authenticationValid,
			error: authenticationError,
			externalControllersDocuments,
			previousDidDocument,
		} = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
			didPayload,
			signInputs as SignInfo[],
			this.querier
		);

		if (!authenticationValid) {
			throw new Error(`DID authentication is not valid: ${authenticationError}`);
		}

		const payload = MsgUpdateDidDocPayload.fromPartial({
			context: <string[]>didPayload?.['@context'],
			id: didPayload.id,
			controller: <string[]>didPayload.controller,
			verificationMethod: protobufVerificationMethod,
			authentication: <string[]>didPayload.authentication,
			assertionMethod: <string[]>didPayload.assertionMethod,
			capabilityInvocation: <string[]>didPayload.capabilityInvocation,
			capabilityDelegation: <string[]>didPayload.capabilityDelegation,
			keyAgreement: <string[]>didPayload.keyAgreement,
			service: protobufService,
			alsoKnownAs: <string[]>didPayload.alsoKnownAs,
			versionId: versionId,
		});

		let signatures: SignInfo[];
		if (ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signUpdateDidDocTx(
				signInputs,
				payload,
				externalControllersDocuments,
				previousDidDocument
			);
		} else {
			signatures = signInputs;
		}

		const value: MsgUpdateDidDoc = {
			payload,
			signatures,
		};

		const updateDidMsg: MsgUpdateDidDocEncodeObject = {
			typeUrl: typeUrlMsgUpdateDidDoc,
			value,
		};

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address;
		}

		if (!fee) {
			fee = await this.generateUpdateDidDocFees(address, undefined, feeOptions, context);
		}

		return this._signer.signAndBroadcast(address, [updateDidMsg], fee!, memo);
	}

	/**
	 * Deactivates an existing DID document transaction on the blockchain.
	 * Validates authentication and creates a deactivation transaction.
	 *
	 * @param signInputs - Signing inputs or pre-computed signatures for the transaction
	 * @param didPayload - DID document payload containing the ID to deactivate
	 * @param address - Address of the account submitting the transaction
	 * @param fee - Transaction fee configuration or 'auto' for automatic calculation
	 * @param memo - Optional transaction memo
	 * @param versionId - Optional version identifier for the deactivation
	 * @param feeOptions - Optional fee options for the transaction
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 * @throws Error if DID payload is not spec compliant or authentication is invalid
	 */
	async deactivateDidDocTx(
		signInputs: ISignInputs[] | SignInfo[],
		didPayload: DIDDocument,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo?: string,
		versionId?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer;
		}

		if (!versionId || versionId === '') {
			versionId = v4();
		}

		const { valid, error, protobufVerificationMethod } = await DIDModule.validateSpecCompliantPayload(didPayload);

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`);
		}

		const { valid: authenticationValid, error: authenticationError } =
			await DIDModule.validateAuthenticationAgainstSignatures(didPayload, signInputs as SignInfo[], this.querier);

		if (!authenticationValid) {
			throw new Error(`DID authentication is not valid: ${authenticationError}`);
		}

		const payload = MsgDeactivateDidDocPayload.fromPartial({
			id: didPayload.id,
			versionId: versionId,
		});

		let signatures: SignInfo[];
		if (ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signDeactivateDidDocTx(signInputs, payload, protobufVerificationMethod!);
		} else {
			signatures = signInputs;
		}

		const value: MsgDeactivateDidDoc = {
			payload,
			signatures,
		};

		const deactivateDidMsg: MsgDeactivateDidDocEncodeObject = {
			typeUrl: typeUrlMsgDeactivateDidDoc,
			value,
		};

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address;
		}

		if (!fee) {
			fee = await this.generateDeactivateDidDocFees(address, undefined, feeOptions, context);
		}

		return this._signer.signAndBroadcast(address, [deactivateDidMsg], fee!, memo);
	}

	/**
	 * Queries a DID document by its identifier.
	 * Retrieves the latest version of the DID document with metadata.
	 *
	 * @param id - DID identifier to query
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the DID document with metadata
	 */
	async queryDidDoc(id: string, context?: IContext): Promise<DIDDocumentWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		const { didDoc, metadata } = await this.querier[defaultDidExtensionKey].didDoc(id);
		return {
			didDocument: await DIDModule.toSpecCompliantPayload(didDoc!),
			didDocumentMetadata: await DIDModule.toSpecCompliantMetadata(metadata!),
		} as DIDDocumentWithMetadata;
	}

	/**
	 * Queries a specific version of a DID document by its identifier and version ID.
	 *
	 * @param id - DID identifier to query
	 * @param versionId - Specific version identifier to retrieve
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the DID document version with metadata
	 */
	async queryDidDocVersion(id: string, versionId: string, context?: IContext): Promise<DIDDocumentWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		const { didDoc, metadata } = await this.querier[defaultDidExtensionKey].didDocVersion(id, versionId);
		return {
			didDocument: await DIDModule.toSpecCompliantPayload(didDoc!),
			didDocumentMetadata: await DIDModule.toSpecCompliantMetadata(metadata!),
		} as DIDDocumentWithMetadata;
	}

	/**
	 * Queries metadata for all versions of a DID document.
	 * Retrieves version history information for a specific DID.
	 *
	 * @param id - DID identifier to query version metadata for
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to array of version metadata and pagination info
	 */
	async queryAllDidDocVersionsMetadata(
		id: string,
		context?: IContext
	): Promise<{
		didDocumentVersionsMetadata: DIDDocumentMetadata[];
		pagination: QueryAllDidDocVersionsMetadataResponse['pagination'];
	}> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		const { versions, pagination } = await this.querier[defaultDidExtensionKey].allDidDocVersionsMetadata(id);
		return {
			didDocumentVersionsMetadata: await Promise.all(
				versions.map(async (m) => await DIDModule.toSpecCompliantMetadata(m))
			),
			pagination,
		};
	}

	/**
	 * Queries the DID module parameters from the blockchain.
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the DID module parameters
	 */
	async queryParams(context?: IContext): Promise<QueryParamsResponse> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		return this.querier[defaultDidExtensionKey].params();
	}

	/**
	 * Generates oracle-powered fees for creating a DID document.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @param feeOptions - Options for fetching oracle fees
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the fee configuration for DID document creation with oracle fees
	 */
	async generateCreateDidDocFees(
		feePayer: string,
		granter?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DidStdFee> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		// fetch fee parameters from the DID module
		const feeParams = await this.queryParams(context);

		// get the price range for the create operation
		const priceRange = await this.getPriceRangeFromParams(feeParams, 'create', feeOptions);

		// calculate the oracle fee amount based on the price range and options
		return {
			amount: [await this.calculateOracleFeeAmount(priceRange, feeOptions, context)],
			gas: feeOptions?.gasLimit || DIDModule.gasLimits.CreateDidDocGasLimit,
			payer: feePayer,
			granter,
		} satisfies DidStdFee;
	}

	/**
	 * Generates oracle-powered fees for updating a DID document.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @param feeOptions - Options for fetching oracle fees
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the fee configuration for DID document update with oracle fees
	 */
	async generateUpdateDidDocFees(
		feePayer: string,
		granter?: string,
		fetchOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DidStdFee> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		// fetch fee parameters from the DID module
		const feeParams = await this.queryParams(context);

		// get the price range for the update operation
		const priceRange = await this.getPriceRangeFromParams(feeParams, 'update', fetchOptions);

		// calculate the oracle fee amount based on the price range and options
		return {
			amount: [await this.calculateOracleFeeAmount(priceRange, fetchOptions, context)],
			gas: fetchOptions?.gasLimit || DIDModule.gasLimits.UpdateDidDocGasLimit,
			payer: feePayer,
			granter,
		} satisfies DidStdFee;
	}

	/** Generates oracle-powered fees for deactivating a DID document.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @param feeOptions - Options for fetching oracle fees
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the fee configuration for DID document deactivation with oracle fees
	 */
	async generateDeactivateDidDocFees(
		feePayer: string,
		granter?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DidStdFee> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		// fetch fee parameters from the DID module
		const feeParams = await this.queryParams(context);

		// get the price range for the deactivate operation
		const priceRange = await this.getPriceRangeFromParams(feeParams, 'deactivate', feeOptions);

		// calculate the oracle fee amount based on the price range and options
		return {
			amount: [await this.calculateOracleFeeAmount(priceRange, feeOptions, context)],
			gas: feeOptions?.gasLimit || DIDModule.gasLimits.DeactivateDidDocGasLimit,
			payer: feePayer,
			granter,
		} satisfies DidStdFee;
	}

	/**
	 * Gets the fee range for a specific DID operation from the module parameters.
	 * @param feeParams - DID module fee parameters
	 * @param operation - DID operation type ('create', 'update', 'deactivate')
	 * @param feeOptions - Options for fee retrieval
	 * @returns Promise resolving to the fee range for the specified operation
	 */
	async getPriceRangeFromParams(
		feeParams: QueryParamsResponse,
		operation: 'create' | 'update' | 'deactivate',
		feeOptions?: DidFeeOptions
	) {
		const operationFees = (() => {
			switch (operation) {
				case 'create':
					return feeParams.params?.createDid.find(
						(fee) => fee.denom === (feeOptions?.feeDenom ?? DIDModule.baseUsdDenom)
					);
				case 'update':
					return feeParams.params?.updateDid.find(
						(fee) => fee.denom === (feeOptions?.feeDenom ?? DIDModule.baseUsdDenom)
					);
				case 'deactivate':
					return feeParams.params?.deactivateDid.find(
						(fee) => fee.denom === (feeOptions?.feeDenom ?? DIDModule.baseUsdDenom)
					);
				default:
					throw new Error('Unsupported operation for fee retrieval');
			}
		})();

		if (!operationFees) {
			throw new Error(`Fee parameters not found for operation: ${operation}`);
		}

		return operationFees;
	}

	/**
	 * Calculates the oracle fee amount based on the provided fee range and options.
	 * @param feeRange - Fee range for the DID operation
	 * @param feeOptions - Options for fee calculation
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the calculated fee amount as a Coin
	 */
	private async calculateOracleFeeAmount(
		feeRange: FeeRange,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<Coin> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		if (feeRange.denom !== feeOptions?.feeDenom && feeOptions?.feeDenom !== undefined) {
			throw new Error(`Fee denomination mismatch: expected ${feeRange.denom}, got ${feeOptions.feeDenom}`);
		}

		const wantedFeeAmount =
			feeRange.denom === DIDModule.baseUsdDenom
				? (feeOptions?.wantedAmountUsd ?? DIDModule.isFixedRange(feeRange))
					? feeRange.minAmount
					: feeRange.minAmount
				: feeRange.minAmount;

		// override fee options, if unassigned - case: moving average type
		feeOptions = {
			...feeOptions,
			movingAverageType: feeOptions?.movingAverageType || MovingAverages.WMA,
		};

		// override fee options, if unassigned - case: WMA strategy
		feeOptions = {
			...feeOptions,
			wmaStrategy:
				feeOptions?.wmaStrategy || feeOptions?.movingAverageType === MovingAverages.WMA
					? WMAStrategies.BALANCED
					: undefined,
		};

		const convertedFeeAmount =
			feeRange.denom === DIDModule.baseUsdDenom
				? parseCoins(
						(
							await this.querier[defaultOracleExtensionKey].convertUSDtoCHEQ(
								wantedFeeAmount,
								feeOptions?.movingAverageType!,
								feeOptions?.wmaStrategy,
								feeOptions?.wmaWeights?.map((w) => BigInt(w))
							)
						).amount
					)[0]
				: Coin.fromPartial({ amount: wantedFeeAmount, denom: feeRange.denom });

		return feeOptions?.slippageBps
			? DIDModule.applySlippageToCoin(convertedFeeAmount, feeOptions.slippageBps)
			: convertedFeeAmount;
	}

	/**
	 * Applies slippage to a given coin amount based on the specified basis points.
	 * @param coin - Coin amount to apply slippage to
	 * @param slippageBps - Slippage in basis points (bps)
	 * @returns Coin with adjusted amount after applying slippage
	 */
	static applySlippageToCoin(coin: Coin, slippageBps: number): Coin {
		const base = BigInt(coin.amount);
		const delta = (base * BigInt(slippageBps)) / BigInt(10_000);
		const adjustedAmount = base + delta;
		return Coin.fromPartial({ amount: adjustedAmount.toString(), denom: coin.denom });
	}

	/**
	 * Checks if a fee range represents a fixed fee (minAmount equals maxAmount).
	 * @param feeRange - Fee range to check
	 * @returns True if the fee range is fixed, false otherwise
	 */
	static isFixedRange(feeRange: FeeRange): boolean {
		return feeRange.minAmount === feeRange.maxAmount;
	}

	/**
	 * Validates a DID document against the Cheqd specification requirements.
	 * Ensures all required fields are present and verification methods are supported.
	 *
	 * @param didDocument - DID document to validate
	 * @returns Promise resolving to validation result with protobuf conversion or error details
	 */
	static async validateSpecCompliantPayload(didDocument: DIDDocument): Promise<SpecValidationResult> {
		// id is required, validated on both compile and runtime
		if (!didDocument?.id) return { valid: false, error: 'id is required' };

		// verificationMethod is required
		if (!didDocument?.verificationMethod) return { valid: false, error: 'verificationMethod is required' };

		// verificationMethod must be an array
		if (!Array.isArray(didDocument?.verificationMethod))
			return { valid: false, error: 'verificationMethod must be an array' };

		// verificationMethod types must be supported
		const protoVerificationMethod = didDocument.verificationMethod.map((vm) => {
			switch (vm?.type) {
				case VerificationMethods.Ed255192020:
					if (!vm?.publicKeyMultibase) throw new Error('publicKeyMultibase is required');

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.Ed255192020,
						verificationMaterial: vm.publicKeyMultibase,
					});
				case VerificationMethods.JWK:
					if (!vm?.publicKeyJwk) throw new Error('publicKeyJwk is required');

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.JWK,
						verificationMaterial: JSON.stringify(vm.publicKeyJwk),
					});
				case VerificationMethods.Ed255192018:
					if (!vm?.publicKeyBase58) throw new Error('publicKeyBase58 is required');

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.Ed255192018,
						verificationMaterial: vm.publicKeyBase58,
					});
				default:
					throw new Error('Unsupported verificationMethod type');
			}
		});

		const protoService = normalizeService(didDocument);

		return {
			valid: true,
			protobufVerificationMethod: protoVerificationMethod,
			protobufService: protoService,
		} as SpecValidationResult;
	}

	/**
	 * Converts a protobuf DID document to a specification-compliant DID document format.
	 * Handles context inclusion, verification method formatting, and service denormalization.
	 *
	 * @param protobufDidDocument - Protobuf DID document to convert
	 * @returns Promise resolving to a spec-compliant DID document
	 */
	static async toSpecCompliantPayload(protobufDidDocument: DidDoc): Promise<DIDDocument> {
		const verificationMethod = protobufDidDocument.verificationMethod.map((vm) => {
			switch (vm.verificationMethodType) {
				case VerificationMethods.Ed255192020:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteEd255192020))
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteEd255192020];
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyMultibase: vm.verificationMaterial,
					};
				case VerificationMethods.JWK:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteJws2020))
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteJws2020];
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyJwk: JSON.parse(vm.verificationMaterial),
					};
				case VerificationMethods.Ed255192018:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteEd255192018))
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteEd255192018];
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyBase58: vm.verificationMaterial,
					};
				default:
					throw new Error('Unsupported verificationMethod type'); // should never happen
			}
		});

		const service = denormalizeService(protobufDidDocument);

		const context = (function () {
			if (protobufDidDocument.context.includes(contexts.W3CDIDv1)) return protobufDidDocument.context;

			return [contexts.W3CDIDv1, ...protobufDidDocument.context];
		})();

		const assertionMethod = protobufDidDocument.assertionMethod.map((am) => {
			try {
				// Check if the assertionMethod is a DID URL
				if (!am.startsWith('did:cheqd:')) {
					// Parse once if it's a stringified JSON
					const parsedAm = JSON.parse(am);
					if (typeof parsedAm === 'string') {
						// Parse again only if necessary
						return JSON.parse(parsedAm);
					}
					return parsedAm;
				}
				return am;
			} catch (error) {
				throw new Error(`Unsupported assertionMethod type: ${am}`);
			}
		});

		const specCompliant = {
			'@context': context,
			id: protobufDidDocument.id,
			controller: protobufDidDocument.controller,
			verificationMethod: verificationMethod,
			authentication: protobufDidDocument.authentication,
			assertionMethod: assertionMethod,
			capabilityInvocation: protobufDidDocument.capabilityInvocation,
			capabilityDelegation: protobufDidDocument.capabilityDelegation,
			keyAgreement: protobufDidDocument.keyAgreement,
			service: service,
			alsoKnownAs: protobufDidDocument.alsoKnownAs,
		} as DIDDocument;

		if (!protobufDidDocument.authentication?.length) delete specCompliant.authentication;
		if (!protobufDidDocument.assertionMethod?.length) delete specCompliant.assertionMethod;
		if (!protobufDidDocument.capabilityInvocation?.length) delete specCompliant.capabilityInvocation;
		if (!protobufDidDocument.capabilityDelegation?.length) delete specCompliant.capabilityDelegation;
		if (!protobufDidDocument.keyAgreement?.length) delete specCompliant.keyAgreement;
		if (!protobufDidDocument.service?.length) delete specCompliant.service;
		if (!protobufDidDocument.alsoKnownAs?.length) delete specCompliant.alsoKnownAs;

		return specCompliant;
	}

	/**
	 * Converts protobuf metadata to specification-compliant DID document metadata format.
	 * Handles date formatting and optional field normalization.
	 *
	 * @param protobufDidDocument - Protobuf metadata to convert
	 * @returns Promise resolving to spec-compliant DID document metadata
	 */
	static async toSpecCompliantMetadata(protobufDidDocument: Metadata): Promise<DIDDocumentMetadata> {
		return {
			created: protobufDidDocument.created?.toISOString(),
			updated: protobufDidDocument.updated?.toISOString(),
			deactivated: protobufDidDocument.deactivated,
			versionId: protobufDidDocument.versionId,
			nextVersionId: protobufDidDocument?.nextVersionId,
			previousVersionId: protobufDidDocument?.previousVersionId,
		};
	}

	/**
	 * Validates that provided signatures match the authentication requirements in a DID document.
	 * Checks signature count, authentication presence, and controller authorization.
	 *
	 * @param didDocument - DID document containing authentication requirements
	 * @param signatures - Array of signatures to validate against authentication
	 * @param querier - Optional querier for retrieving external controller documents
	 * @param externalControllersDidDocuments - Optional pre-loaded external controller documents
	 * @returns Promise resolving to validation result with error details if invalid
	 */
	static async validateAuthenticationAgainstSignatures(
		didDocument: DIDDocument,
		signatures: readonly SignInfo[],
		querier?: CheqdQuerier & DidExtension,
		externalControllersDidDocuments?: DIDDocument[]
	): Promise<AuthenticationValidationResult> {
		// validate signatures - case: no signatures
		if (!signatures || !signatures.length) return { valid: false, error: 'signatures are required' };

		// validate authentication - case: no authentication when at least one verificationMethod
		if (
			(!didDocument.authentication || !didDocument.authentication.length) &&
			didDocument.verificationMethod?.length
		)
			return { valid: false, error: 'authentication is required' };

		const normalizedAuthentication = normalizeAuthentication(didDocument);

		// define unique authentication
		const uniqueAuthentication = new Set<string>(normalizedAuthentication);

		// validate authentication - case: authentication contains duplicates
		if (uniqueAuthentication.size < normalizedAuthentication.length)
			return {
				valid: false,
				error: `authentication contains duplicate key references: duplicate key reference ${Array.from(uniqueAuthentication).find((a) => normalizeAuthentication(didDocument).filter((aa) => aa === a).length > 1)}`,
			};

		// define unique signatures - shallow, only verificationMethodId, no signature
		const uniqueSignatures = new Set(signatures.map((s) => s.verificationMethodId));

		// validate signatures - case: signatures contain duplicates
		if (uniqueSignatures.size < signatures.length)
			return {
				valid: false,
				error: `signatures contain duplicates: duplicate signature for key reference ${Array.from(uniqueSignatures).find((s) => signatures.filter((ss) => ss.verificationMethodId === s).length > 1)}`,
			};

		// validate authentication - case: authentication contains invalid key references
		if (!Array.from(uniqueAuthentication).every((a) => didDocument.verificationMethod?.some((vm) => vm.id === a)))
			return {
				valid: false,
				error: `authentication contains invalid key references: invalid key reference ${Array.from(uniqueAuthentication).find((a) => !didDocument.verificationMethod?.some((vm) => vm.id === a))}`,
			};

		// define whether external controller or not
		const externalController = normalizeController(didDocument).some((c) => c !== didDocument.id);

		// validate authentication - case: authentication matches signatures, unique, if no external controller
		if (!Array.from(uniqueAuthentication).every((a) => uniqueSignatures.has(a)) && !externalController)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueAuthentication).find((a) => !uniqueSignatures.has(a))} is missing`,
			};

		// validate signatures - case: authentication matches signatures, unique, excessive signatures, no external controller
		if (!Array.from(uniqueSignatures).every((s) => uniqueAuthentication.has(s)) && !externalController)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignatures).find((s) => !uniqueAuthentication.has(s))} is not required`,
			};

		// return, if no external controller
		if (!externalController) return { valid: true };

		// require querier
		if (!querier) throw new Error('querier is required for external controller validation');

		// get external controllers
		const externalControllers = normalizeController(didDocument).filter((c) => c !== didDocument.id);

		// get external controllers' documents
		const externalControllersDocuments = await Promise.all(
			externalControllers?.map(async (c) => {
				// compute index of external controller's document, if provided
				const externalControllerDocumentIndex = externalControllersDidDocuments?.findIndex((d) => d.id === c);

				// get external controller's document, if provided
				if (externalControllerDocumentIndex !== undefined && externalControllerDocumentIndex !== -1)
					return externalControllersDidDocuments?.[externalControllerDocumentIndex];

				// fetch external controller's document
				const protobufDocument = await querier[defaultDidExtensionKey].didDoc(c);

				// throw, if not found
				if (!protobufDocument || !protobufDocument.didDoc)
					throw new Error(`Document for controller ${c} not found`);

				// convert to spec compliant payload
				return await DIDModule.toSpecCompliantPayload(protobufDocument.didDoc);
			})
		);

		// define unique required signatures
		const uniqueRequiredSignatures: Set<string> = new Set(
			externalControllersDocuments.concat(didDocument).flatMap((d) => (d ? normalizeAuthentication(d) : []))
		);

		// validate authentication - case: authentication matches signatures, unique, if external controller
		if (!Array.from(uniqueRequiredSignatures).every((a) => uniqueSignatures.has(a)))
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueRequiredSignatures).find((a) => !uniqueSignatures.has(a))} is missing`,
			};

		// validate authentication - case: authentication matches signatures, unique, excessive signatures, if external controller
		if (uniqueRequiredSignatures.size < uniqueSignatures.size)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignatures).find((s) => !uniqueRequiredSignatures.has(s))} is not required`,
			};

		// return valid
		return { valid: true };
	}

	/**
	 * Validates authentication against signatures for key rotation scenarios.
	 * Handles validation during DID document updates where keys may have changed.
	 *
	 * @param didDocument - Updated DID document to validate
	 * @param signatures - Array of signatures to validate
	 * @param querier - Querier for retrieving previous DID document and controllers
	 * @param previousDidDocument - Optional previous version of the DID document
	 * @param externalControllersDidDocuments - Optional pre-loaded external controller documents
	 * @returns Promise resolving to validation result with controller documents and previous document
	 */
	static async validateAuthenticationAgainstSignaturesKeyRotation(
		didDocument: DIDDocument,
		signatures: readonly SignInfo[],
		querier: CheqdQuerier & DidExtension,
		previousDidDocument?: DIDDocument,
		externalControllersDidDocuments?: DIDDocument[]
	): Promise<AuthenticationValidationResult> {
		// validate signatures - case: no signatures
		if (!signatures || !signatures.length) return { valid: false, error: 'signatures are required' };

		// validate authentication - case: no authentication when at least one verificationMethod
		if (
			(!didDocument.authentication || !didDocument.authentication.length) &&
			didDocument.verificationMethod?.length
		)
			return { valid: false, error: 'authentication is required' };

		// define unique authentication
		const authentication = normalizeAuthentication(didDocument);
		const uniqueAuthentication = new Set<string>(authentication);

		// validate authentication - case: authentication contains duplicates
		if (uniqueAuthentication.size < authentication.length)
			return {
				valid: false,
				error: `authentication contains duplicate key references: duplicate key reference ${Array.from(uniqueAuthentication).find((a) => normalizeAuthentication(didDocument).filter((aa) => aa === a).length > 1)}`,
			};

		// define unique signatures
		const uniqueSignatures = new Set(signatures.map((s) => s.verificationMethodId));

		// validate authentication - case: authentication contains invalid key references
		if (!Array.from(uniqueAuthentication).every((a) => didDocument.verificationMethod?.some((vm) => vm.id === a)))
			return {
				valid: false,
				error: `authentication contains invalid key references: invalid key reference ${Array.from(uniqueAuthentication).find((a) => !didDocument.verificationMethod?.some((vm) => vm.id === a))}`,
			};

		// lookup previous document
		if (!previousDidDocument) {
			// get previous document
			const previousDocument = await querier[defaultDidExtensionKey].didDoc(didDocument.id);

			// throw, if not found
			if (!previousDocument || !previousDocument.didDoc) throw new Error('Previous did document not found');

			previousDidDocument = await DIDModule.toSpecCompliantPayload(previousDocument.didDoc);
		}

		const controllers = normalizeController(didDocument);
		const previousControllers = normalizeController(previousDidDocument);

		// define whether external controller or not
		const externalController = controllers.concat(previousControllers).some((c) => c !== didDocument.id);

		// define whether key rotation or not (same ID, different material)
		const keyRotation = !!didDocument.verificationMethod?.some((vm) =>
			previousDidDocument?.verificationMethod?.some(
				(pvm) =>
					pvm.id === vm.id &&
					(pvm.publicKeyBase58 !== vm.publicKeyBase58 ||
						pvm.publicKeyMultibase !== vm.publicKeyMultibase ||
						pvm.publicKeyJwk?.x !== vm.publicKeyJwk?.x)
			)
		);

		// define whether key replacement or not (different IDs in authentication)
		const currentAuthenticationIds = new Set(normalizeAuthentication(didDocument));
		const previousAuthenticationIds = new Set(normalizeAuthentication(previousDidDocument));

		const removedKeys = Array.from(previousAuthenticationIds).filter((id) => !currentAuthenticationIds.has(id));
		const addedKeys = Array.from(currentAuthenticationIds).filter((id) => !previousAuthenticationIds.has(id));
		const keyReplacement = removedKeys.length > 0 && addedKeys.length > 0;

		// define controller rotation
		const controllerRotation =
			!controllers.every((c) => previousControllers.includes(c)) ||
			!previousControllers.every((c) => controllers.includes(c));

		// define rotated controllers
		const rotatedControllers = controllerRotation
			? previousControllers.filter((c) => !controllers.includes(c))
			: [];

		// define unique union of authentication
		const previousAuthentication = normalizeAuthentication(previousDidDocument);
		const uniqueUnionAuthentication = new Set<string>([...uniqueAuthentication, ...previousAuthentication]);

		// validate authentication - case: authentication matches signatures, unique, if no external controller, no key rotation, no key replacement
		if (
			!Array.from(uniqueUnionAuthentication).every((a) => uniqueSignatures.has(a)) &&
			!externalController &&
			!keyRotation &&
			!keyReplacement
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueAuthentication).find((a) => !uniqueSignatures.has(a))} is missing`,
			};

		// define rotated keys
		const rotatedKeys = keyRotation
			? didDocument.verificationMethod?.filter((vm) =>
					previousDidDocument?.verificationMethod?.some(
						(pvm) =>
							pvm.id === vm.id &&
							(pvm.publicKeyBase58 !== vm.publicKeyBase58 ||
								pvm.publicKeyMultibase !== vm.publicKeyMultibase ||
								pvm.publicKeyJwk?.x !== vm.publicKeyJwk?.x)
					)
				)
			: [];

		// define unique union of signatures required, including key replacement logic
		let uniqueUnionSignaturesRequired = new Set<string>();
		if (keyRotation && keyReplacement) {
			// Combined operation: Both key rotation AND key replacement happening
			// Need signatures from:
			// 1. All rotated keys (both old and new material for same ID)
			// 2. All added keys (new keys being added)
			// 3. All removed keys (old keys being removed)
			const rotatedKeySignatures = authentication
				.filter((a) => rotatedKeys?.find((rk) => a === rk.id))
				.map((a) => `${a}(document0)`);
			const previousRotatedKeySignatures = previousAuthentication
				.filter((a) => rotatedKeys?.find((rk) => a === rk.id))
				.map((a) => `${a}(document1)`);
			const newKeySignatures = addedKeys
				.filter((keyId) => !rotatedKeys?.find((rk) => keyId === rk.id))
				.map((keyId) => `${keyId}(document0)`);
			const oldKeySignatures = removedKeys
				.filter((keyId) => previousAuthentication.includes(keyId))
				.map((keyId) => `${keyId}(document1)`);

			uniqueUnionSignaturesRequired = new Set([
				...rotatedKeySignatures,
				...previousRotatedKeySignatures,
				...newKeySignatures,
				...oldKeySignatures,
			]);
		} else if (keyRotation) {
			// Key rotation only (same ID, different material)
			uniqueUnionSignaturesRequired = new Set([
				...authentication.filter((a) => rotatedKeys?.find((rk) => a === rk.id)).map((a) => `${a}(document0)`),
				...previousAuthentication.map((a) => `${a}(document1)`),
			]);
		} else if (keyReplacement) {
			// Key replacement only (different IDs in authentication)
			// For key replacement, we need signatures from:
			// 1. The new keys (from current document)
			// 2. The old keys that are being replaced (from previous document)
			const newKeySignatures = addedKeys.map((keyId) => `${keyId}(document0)`);
			const oldKeySignatures = removedKeys
				.filter((keyId) => previousAuthentication.includes(keyId)) // Only if they were in authentication
				.map((keyId) => `${keyId}(document1)`);

			uniqueUnionSignaturesRequired = new Set([...newKeySignatures, ...oldKeySignatures]);
		} else {
			// No rotation or replacement
			uniqueUnionSignaturesRequired = new Set([...authentication.map((a) => `${a}(document0)`)]);
		}

		// define frequency of unique union of signatures required
		const uniqueUnionSignaturesRequiredFrequency = new Map(
			[...uniqueUnionSignaturesRequired].map((s) => [s.replace(new RegExp(/\(document\d+\)/), ''), 0])
		);

		// count frequency of unique union of signatures required
		uniqueUnionSignaturesRequired.forEach((s) => {
			// define key
			const key = s.replace(new RegExp(/\(document\d+\)/), '');

			// increment frequency
			uniqueUnionSignaturesRequiredFrequency.set(key, uniqueUnionSignaturesRequiredFrequency.get(key)! + 1);
		});

		// define frequency of signatures provided
		const uniqueSignaturesFrequency = new Map(signatures.map((s) => [s.verificationMethodId, 0]));

		// count frequency of signatures provided
		signatures.forEach((s) => {
			// increment frequency
			uniqueSignaturesFrequency.set(
				s.verificationMethodId,
				uniqueSignaturesFrequency.get(s.verificationMethodId)! + 1
			);
		});

		// validate signatures - case: authentication matches signatures, unique, excessive signatures, no external controller
		if (
			Array.from(uniqueSignaturesFrequency).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredFrequency.get(k) === undefined ||
					(uniqueUnionSignaturesRequiredFrequency.get(k) &&
						uniqueUnionSignaturesRequiredFrequency.get(k)! < f)
			).length &&
			!externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequency).find(([k, f]) => uniqueUnionSignaturesRequiredFrequency.get(k) === undefined || uniqueUnionSignaturesRequiredFrequency.get(k)! < f)?.[0]} is not required`,
			};

		// validate signatures - case: authentication matches signatures, unique, missing signatures, no external controller
		if (
			Array.from(uniqueSignaturesFrequency).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredFrequency.get(k) && uniqueUnionSignaturesRequiredFrequency.get(k)! > f
			).length &&
			!externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequency).find(([k, f]) => uniqueUnionSignaturesRequiredFrequency.get(k)! > f)?.[0]} is missing`,
			};

		// validate signatures - case: all required keys must have signatures provided (check for completely missing keys)
		if (!externalController) {
			const missingKeys = Array.from(uniqueUnionSignaturesRequiredFrequency.keys()).filter(
				(requiredKey) => !uniqueSignaturesFrequency.has(requiredKey)
			);
			if (missingKeys.length > 0) {
				return {
					valid: false,
					error: `authentication does not match signatures: signature from key ${missingKeys[0]} is missing`,
				};
			}
		}
		// require querier
		if (!querier) throw new Error('querier is required for external controller validation');

		// get external controllers
		// Only include rotated controllers if they are external (not the current DID itself)
		const externalRotatedControllers = rotatedControllers.filter((c) => c !== didDocument.id);
		const externalControllers = controllers?.filter((c) => c !== didDocument.id).concat(externalRotatedControllers);

		// get external controllers' documents
		const externalControllersDocuments = await Promise.all(
			externalControllers?.map(async (c) => {
				// compute index of external controller's document, if provided
				const externalControllerDocumentIndex = externalControllersDidDocuments?.findIndex((d) => d.id === c);

				// get external controller's document, if provided
				if (externalControllerDocumentIndex !== undefined && externalControllerDocumentIndex !== -1)
					return externalControllersDidDocuments![externalControllerDocumentIndex]!;

				// fetch external controller's document
				const protobufDocument = await querier[defaultDidExtensionKey].didDoc(c);

				// throw, if not found
				if (!protobufDocument || !protobufDocument.didDoc)
					throw new Error(`Document for controller ${c} not found`);

				// convert to spec compliant payload
				return await DIDModule.toSpecCompliantPayload(protobufDocument.didDoc);
			})
		);

		// define unique required signatures, delimited, with external controllers
		const uniqueUnionSignaturesRequiredWithExternalControllers = new Set<string>([
			...uniqueUnionSignaturesRequired,
			...externalControllersDocuments
				.flatMap((d) => normalizeAuthentication(d))
				.map(
					(a) =>
						`${a}(document${externalControllersDocuments.findIndex((d) => normalizeAuthentication(d).includes(a))})`
				),
		]);

		// add rotated controller keys to unique required signatures, if any
		if (controllerRotation) {
			// walk through rotated controllers
			rotatedControllers.forEach((c) => {
				// get rotated controller's document index
				const rotatedControllerDocumentIndex = externalControllersDocuments.findIndex((d) => d?.id === c);

				// early return, if no document
				if (rotatedControllerDocumentIndex === -1) return;

				// get rotated controller's document
				const rotatedControllerDocument = externalControllersDocuments[rotatedControllerDocumentIndex]!;

				// add rotated controller's authentication to unique required signatures
				rotatedControllerDocument.authentication?.forEach((a) =>
					uniqueUnionSignaturesRequiredWithExternalControllers.add(
						`${a}(document${rotatedControllerDocumentIndex})`
					)
				);
			});
		}

		// define frequency of unique union of signatures required, with external controllers
		const uniqueUnionSignaturesRequiredWithExternalControllersFrequency = new Map(
			[...uniqueUnionSignaturesRequiredWithExternalControllers].map((s) => [
				s.replace(new RegExp(/\(document\d+\)/), ''),
				0,
			])
		);

		// count frequency of unique union of signatures required, with external controllers
		uniqueUnionSignaturesRequiredWithExternalControllers.forEach((s) => {
			// define key
			const key = s.replace(new RegExp(/\(document\d+\)/), '');

			// increment frequency
			uniqueUnionSignaturesRequiredWithExternalControllersFrequency.set(
				key,
				uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(key)! + 1
			);
		});

		// define frequency of signatures provided, with external controllers
		const uniqueSignaturesFrequencyWithExternalControllers = new Map(
			signatures.map((s) => [s.verificationMethodId, 0])
		);

		// count frequency of signatures provided, with external controllers
		signatures.forEach((s) => {
			// increment frequency
			uniqueSignaturesFrequencyWithExternalControllers.set(
				s.verificationMethodId,
				uniqueSignaturesFrequencyWithExternalControllers.get(s.verificationMethodId)! + 1
			);
		});

		// validate signatures - case: authentication matches signatures, unique, excessive signatures, with external controllers
		if (
			Array.from(uniqueSignaturesFrequencyWithExternalControllers).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) === undefined ||
					(uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) &&
						uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! < f)
			).length &&
			externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequencyWithExternalControllers).find(([k, f]) => uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) === undefined || uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! < f)?.[0]} is not required`,
			};

		// validate signatures - case: authentication matches signatures, unique, missing signatures, with external controllers
		if (
			Array.from(uniqueSignaturesFrequencyWithExternalControllers).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) &&
					uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! > f
			).length &&
			externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequencyWithExternalControllers).find(([k, f]) => uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! > f)?.[0]} is missing`,
			};

		// return valid
		return { valid: true, previousDidDocument, externalControllersDocuments };
	}

	/**
	 * Generates standard fees for creating a DID document.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @returns Promise resolving to the fee configuration for DID document creation
	 */
	static async generateCreateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [DIDModule.fees.DefaultCreateDidDocFee],
			gas: '360000',
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}

	/**
	 * Generates fee configuration for DID document update transactions.
	 * Uses default update fees and gas requirements.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @returns Promise resolving to the fee configuration for DID document updates
	 */
	static async generateUpdateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [DIDModule.fees.DefaultUpdateDidDocFee],
			gas: '360000',
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}

	/**
	 * Generates fee configuration for DID document deactivation transactions.
	 * Uses default deactivation fees and gas requirements.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @returns Promise resolving to the fee configuration for DID document deactivation
	 */
	static async generateDeactivateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [DIDModule.fees.DefaultDeactivateDidDocFee],
			gas: '360000',
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}
}
