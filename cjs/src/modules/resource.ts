import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_';
import { CheqdSigningStargateClient } from '../signer';
import { EncodeObject, GeneratedType, parseCoins } from '@cosmjs/proto-signing-cjs';
import { CheqdNetwork, DidFeeOptions, DidStdFee, IContext, ISignInputs, QueryExtensionSetup } from '../types';
import {
	Metadata,
	MsgCreateResource,
	MsgCreateResourcePayload,
	MsgCreateResourceResponse,
	QueryClientImpl,
	QueryCollectionResourcesResponse,
	QueryParamsResponse,
	ResourceWithMetadata,
	protobufPackage,
} from '@cheqd/ts-proto-cjs/cheqd/resource/v2/index';
import { DeliverTxResponse, QueryClient, createPagination, createProtobufRpcClient } from '@cosmjs/stargate-cjs';
import { FeeRange, SignInfo } from '@cheqd/ts-proto-cjs/cheqd/did/v2/index';
import { fromBuffer } from 'file-type-cjs';
import { toString } from 'uint8arrays-cjs';
import { assert } from '@cosmjs/utils-cjs';
import { PageRequest } from '@cheqd/ts-proto-cjs/cosmos/base/query/v1beta1/pagination';
import { CheqdQuerier } from '../querier';
import { isJSON } from '../utils';
import { defaultOracleExtensionKey, MovingAverages, OracleExtension, WMAStrategies } from './oracle';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

/** Default extension key for resource-related query operations */
export const defaultResourceExtensionKey = 'resource' as const;

/**
 * Protobuf message type literals for resource operations.
 * Used for consistent message type identification across the module.
 */
export const protobufLiterals = {
	/** Create resource message type */
	MsgCreateResource: 'MsgCreateResource',
	/** Create resource response message type */
	MsgCreateResourceResponse: 'MsgCreateResourceResponse',
} as const;

/** Type URL for MsgCreateResource messages */
export const typeUrlMsgCreateResource = `/${protobufPackage}.${protobufLiterals.MsgCreateResource}` as const;
/** Type URL for MsgCreateResourceResponse messages */
export const typeUrlMsgCreateResourceResponse =
	`/${protobufPackage}.${protobufLiterals.MsgCreateResourceResponse}` as const;

/**
 * Encode object interface for MsgCreateResource messages.
 * Used for type-safe message encoding in resource creation transactions.
 */
export interface MsgCreateResourceEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateResource;
	readonly value: Partial<MsgCreateResource>;
}

/**
 * Type guard function to check if an object is a MsgCreateResourceEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgCreateResourceEncodeObject
 */
export function isMsgCreateResourceEncodeObject(obj: EncodeObject): obj is MsgCreateResourceEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateResource;
}

/** Minimal importable version of the resource module for clean external interfaces */
export type MinimalImportableResourceModule = MinimalImportableCheqdSDKModule<ResourceModule>;

/**
 * Resource extension interface for querier functionality.
 * Provides methods for querying resources and their metadata.
 */
export type ResourceExtension = {
	readonly [defaultResourceExtensionKey]: {
		/** Query a specific resource by collection and resource ID */
		readonly resource: (collectionId: string, resourceId: string) => Promise<ResourceWithMetadata>;
		/** Query metadata for a specific resource */
		readonly resourceMetadata: (collectionId: string, resourceId: string) => Promise<Metadata>;
		/** Query all resources in a collection with pagination support */
		readonly collectionResources: (
			collectionId: string,
			paginationKey?: Uint8Array
		) => Promise<QueryCollectionResourcesResponse>;
		/** Query latest resource version */
		readonly latestResourceVersion: (
			collectionId: string,
			name: string,
			type: string
		) => Promise<ResourceWithMetadata>;
		/** Query latest resource metadata */
		readonly latestResourceVersionMetadata: (collectionId: string, name: string, type: string) => Promise<Metadata>;
		/** Query parameters for resource module */
		readonly params: () => Promise<QueryParamsResponse>;
	};
};

/**
 * Sets up the resource extension for the querier client.
 * Creates and configures the resource-specific query methods.
 *
 * @param base - Base QueryClient to extend
 * @returns Configured resource extension with query methods
 */
export const setupResourceExtension = (base: QueryClient): ResourceExtension => {
	const rpc = createProtobufRpcClient(base);

	const queryService = new QueryClientImpl(rpc);

	return {
		[defaultResourceExtensionKey]: {
			resource: async (collectionId: string, resourceId: string) => {
				const { resource } = await queryService.Resource({ collectionId, id: resourceId });
				assert(resource);
				return resource;
			},
			resourceMetadata: async (collectionId: string, resourceId: string) => {
				const { resource } = await queryService.ResourceMetadata({ collectionId, id: resourceId });
				assert(resource);
				return resource;
			},
			collectionResources: async (collectionId: string, paginationKey?: Uint8Array) => {
				const response = await queryService.CollectionResources({
					collectionId,
					pagination: createPagination(paginationKey) as PageRequest | undefined,
				});
				return response;
			},
			latestResourceVersion: async (collectionId: string, name: string, type: string) => {
				const { resource } = await queryService.LatestResourceVersion({
					collectionId,
					name,
					resourceType: type,
				});
				assert(resource);
				return resource;
			},
			latestResourceVersionMetadata: async (collectionId: string, name: string, type: string) => {
				const { resource } = await queryService.LatestResourceVersionMetadata({
					collectionId,
					name,
					resourceType: type,
				});
				assert(resource);
				return resource;
			},
			params: async () => {
				const response = await queryService.Params({});
				assert(response.params);
				return response;
			},
		},
	} as ResourceExtension;
};

/**
 * Resource Module class providing comprehensive linked resource functionality.
 * Handles creation, querying, and metadata management of resources linked to DID documents.
 */
export class ResourceModule extends AbstractCheqdSDKModule {
	// @ts-expect-error underlying type `GeneratedType` is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlMsgCreateResource, MsgCreateResource],
		[typeUrlMsgCreateResourceResponse, MsgCreateResourceResponse],
	];

	/** Base denomination for Cheqd network transactions */
	static readonly baseMinimalDenom = 'ncheq' as const;

	/** Base denomination in USD for Cheqd network transactions */
	static readonly baseUsdDenom = 'usd' as const;

	/** Default slippage tolerance in base points (BPS) */
	static readonly defaultSlippageBps = 500n;

	/**
	 * Standard fee amounts for different resource types.
	 * Fees vary based on resource content type and processing requirements.
	 */
	static readonly fees = {
		/** Default fee for creating image resources */
		DefaultCreateResourceImageFee: { amount: '10000000000', denom: ResourceModule.baseMinimalDenom } as const,
		/** Default fee for creating JSON resources */
		DefaultCreateResourceJsonFee: { amount: '10000000000', denom: ResourceModule.baseMinimalDenom } as const,
		/** Default fee for creating other types of resources */
		DefaultCreateResourceDefaultFee: { amount: '10000000000', denom: ResourceModule.baseMinimalDenom } as const,
		/** Default fee for creating image resources in USD */
		DefaultCreateResourceImageFeeUsd: { amount: '100000000000000000', denom: ResourceModule.baseUsdDenom } as const,
		/** Default fee for creating JSON resources in USD */
		DefaultCreateResourceJsonFeeUsd: { amount: '400000000000000000', denom: ResourceModule.baseUsdDenom } as const,
		/** Default fee for creating other types of resources in USD */
		DefaultCreateResourceDefaultFeeUsd: {
			amount: '200000000000000000',
			denom: ResourceModule.baseUsdDenom,
		} as const,
	} as const;

	/** Standard gas limits for DLR operations.
	 * These represent the default gas limits for various DLR-related transactions.
	 */
	static readonly gasLimits = {
		/** Gas limit for creating linked resources */
		CreateLinkedResourceImageGasLimit: '1000000',
		/** Gas limit for creating linked JSON resources */
		CreateLinkedResourceJsonGasLimit: '1000000',
		/** Gas limit for creating other types of linked resources */
		CreateLinkedResourceDefaultGasLimit: '1000000',
	} as const;

	/** Querier extension setup function for resource operations */
	static readonly querierExtensionSetup: QueryExtensionSetup<ResourceExtension> = setupResourceExtension;

	/** Querier instance with resource extension capabilities */
	querier: CheqdQuerier & ResourceExtension & OracleExtension;

	/**
	 * Constructs a new resource module instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client with resource extension for data retrieval
	 */
	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & ResourceExtension & OracleExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			createLinkedResourceTx: this.createLinkedResourceTx.bind(this),
			queryLinkedResource: this.queryLinkedResource.bind(this),
			queryLinkedResourceMetadata: this.queryLinkedResourceMetadata.bind(this),
			queryLinkedResources: this.queryLinkedResources.bind(this),
			queryLatestLinkedResourceVersion: this.queryLatestLinkedResourceVersion.bind(this),
			queryLatestLinkedResourceVersionMetadata: this.queryLatestLinkedResourceVersionMetadata.bind(this),
			queryParams: this.queryParams.bind(this),
			generateCreateResourceImageFees: this.generateCreateResourceImageFees.bind(this),
			generateCreateResourceJsonFees: this.generateCreateResourceJsonFees.bind(this),
			generateCreateResourceDefaultFees: this.generateCreateResourceDefaultFees.bind(this),
			getPriceRangeFromParams: this.getPriceRangeFromParams.bind(this),
		};
	}

	/**
	 * Gets the registry types for resource message encoding/decoding.
	 *
	 * @returns Iterable of [typeUrl, GeneratedType] pairs for the registry
	 */
	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return ResourceModule.registryTypes;
	}

	/**
	 * Gets the querier extension setup for resource operations.
	 *
	 * @returns Query extension setup function for resource functionality
	 */
	public getQuerierExtensionSetup(): QueryExtensionSetup<ResourceExtension> {
		return ResourceModule.querierExtensionSetup;
	}

	/**
	 * Signs a resource payload with provided signature inputs.
	 * Creates a complete signed resource message ready for blockchain submission.
	 *
	 * @param payload - Resource payload to sign
	 * @param signInputs - Signing inputs or pre-computed signatures
	 * @returns Promise resolving to the signed resource message
	 */
	static async signPayload(
		payload: MsgCreateResourcePayload,
		signInputs: ISignInputs[] | SignInfo[]
	): Promise<MsgCreateResource> {
		const signBytes = MsgCreateResourcePayload.encode(payload).finish();
		let signatures: SignInfo[];
		if (ISignInputs.isSignInput(signInputs)) {
			signatures = await CheqdSigningStargateClient.signIdentityTx(signBytes, signInputs);
		} else {
			signatures = signInputs;
		}

		return {
			payload,
			signatures,
		};
	}

	/**
	 * Creates a linked resource transaction on the blockchain.
	 * Handles automatic fee calculation based on resource content type and size.
	 *
	 * @param signInputs - Signing inputs or pre-computed signatures for the transaction
	 * @param resourcePayload - Resource payload containing data and metadata
	 * @param address - Address of the account submitting the transaction
	 * @param fee - Transaction fee configuration or 'auto' for automatic calculation
	 * @param memo - Optional transaction memo
	 * @param feeOptions - Optional fee options for the transaction
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 * @throws Error if linked resource data is empty when automatic fee calculation is requested
	 */
	async createLinkedResourceTx(
		signInputs: ISignInputs[] | SignInfo[],
		resourcePayload: Partial<MsgCreateResourcePayload>,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer;
		}

		const payload = MsgCreateResourcePayload.fromPartial(resourcePayload);

		const msg = await ResourceModule.signPayload(payload, signInputs);

		const encObj: MsgCreateResourceEncodeObject = {
			typeUrl: typeUrlMsgCreateResource,
			value: msg,
		};

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address;
		}

		if (!fee) {
			if (payload.data.length === 0) {
				throw new Error('Linked resource data is empty');
			}

			fee = await (async function (that) {
				const mimeType = await ResourceModule.readMimeType(payload.data);

				if (mimeType.startsWith('image/')) {
					return await that.generateCreateResourceImageFees(address, undefined, feeOptions, context);
				}

				if (mimeType.startsWith('application/json')) {
					return await that.generateCreateResourceJsonFees(address, undefined, feeOptions, context);
				}

				return await that.generateCreateResourceDefaultFees(address, undefined, feeOptions, context);
			})(this);
		}

		return this._signer.signAndBroadcast(address, [encObj], fee!, memo);
	}

	/**
	 * Queries a specific linked resource by collection and resource ID.
	 * Retrieves the complete resource data along with its metadata.
	 *
	 * @param collectionId - ID of the collection containing the resource
	 * @param resourceId - ID of the resource to query
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the resource with metadata
	 */
	async queryLinkedResource(
		collectionId: string,
		resourceId: string,
		context?: IContext
	): Promise<ResourceWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		return await this.querier[defaultResourceExtensionKey].resource(collectionId, resourceId);
	}

	/**
	 * Queries metadata for a specific linked resource.
	 * Retrieves only the metadata without the resource content data.
	 *
	 * @param collectionId - ID of the collection containing the resource
	 * @param resourceId - ID of the resource to query metadata for
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the resource metadata
	 */
	async queryLinkedResourceMetadata(collectionId: string, resourceId: string, context?: IContext): Promise<Metadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		return await this.querier[defaultResourceExtensionKey].resourceMetadata(collectionId, resourceId);
	}

	/**
	 * Queries all resources in a collection with pagination support.
	 * Retrieves a list of all resources belonging to a specific collection.
	 *
	 * @param collectionId - ID of the collection to query resources for
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the collection resources response with pagination
	 */
	async queryLinkedResources(collectionId: string, context?: IContext): Promise<QueryCollectionResourcesResponse> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		return await this.querier[defaultResourceExtensionKey].collectionResources(collectionId);
	}

	/**
	 * Queries the latest version of a linked resource by collection ID, name, and type.
	 * Retrieves the most recent version of the specified resource.
	 *
	 * @param collectionId - ID of the collection containing the resource
	 * @param name - Name of the resource
	 * @param type - Type of the resource
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the latest resource version with metadata
	 */
	async queryLatestLinkedResourceVersion(
		collectionId: string,
		name: string,
		type: string,
		context?: IContext
	): Promise<ResourceWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		return await this.querier[defaultResourceExtensionKey].latestResourceVersion(collectionId, name, type);
	}

	/**
	 * Queries the latest metadata of a linked resource by collection ID, name, and type.
	 * Retrieves only the metadata of the most recent version of the specified resource.
	 *
	 * @param collectionId - ID of the collection containing the resource
	 * @param name - Name of the resource
	 * @param type - Type of the resource
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the latest resource metadata
	 */
	async queryLatestLinkedResourceVersionMetadata(
		collectionId: string,
		name: string,
		type: string,
		context?: IContext
	): Promise<Metadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		return await this.querier[defaultResourceExtensionKey].latestResourceVersionMetadata(collectionId, name, type);
	}

	private async resolveNetworkForFees(context?: IContext): Promise<CheqdNetwork> {
		if (context?.sdk?.options?.rpcUrl) {
			return await CheqdQuerier.detectNetwork(context.sdk.options.rpcUrl);
		}

		return context?.sdk?.options?.network ?? CheqdNetwork.Testnet;
	}

	private async shouldUseOracleFees(context?: IContext): Promise<boolean> {
		return (await this.resolveNetworkForFees(context)) === CheqdNetwork.Testnet;
	}

	/**
	 * Queries the Resource module parameters from the blockchain.
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the Resource module parameters
	 */
	async queryParams(context?: IContext): Promise<QueryParamsResponse> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		return await this.querier[defaultResourceExtensionKey].params();
	}

	/**
	 * Generates oracle-powered fees for creating image DID-Linked Resources.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @param feeOptions - Options for fetching oracle fees
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the fee configuration for DLR creation
	 */
	async generateCreateResourceImageFees(
		feePayer: string,
		granter?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DidStdFee> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}

		if (!(await this.shouldUseOracleFees(context))) {
			return ResourceModule.generateCreateResourceImageFees(feePayer, granter);
		}
		// fetch fee parameters from the Resource module
		const feeParams = await this.queryParams(context);

		// get the price range for the image resource creation
		const priceRange = await this.getPriceRangeFromParams(feeParams, 'image', feeOptions);

		// calculate the oracle fee amount based on the price range and options
		return {
			amount: [await this.calculateOracleFeeAmount(priceRange, feeOptions, context)],
			gas: ResourceModule.gasLimits.CreateLinkedResourceImageGasLimit,
			payer: feePayer,
			granter,
		} satisfies DidStdFee;
	}

	/**
	 * Generates oracle-powered fees for creating JSON DID-Linked Resources.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @param feeOptions - Options for fetching oracle fees
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the fee configuration for DLR creation
	 */
	async generateCreateResourceJsonFees(
		feePayer: string,
		granter?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DidStdFee> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}

		if (!(await this.shouldUseOracleFees(context))) {
			return ResourceModule.generateCreateResourceJsonFees(feePayer, granter);
		}
		// fetch fee parameters from the Resource module
		const feeParams = await this.queryParams(context);

		// get the price range for the JSON resource creation
		const priceRange = await this.getPriceRangeFromParams(feeParams, 'json', feeOptions);

		// calculate the oracle fee amount based on the price range and options
		return {
			amount: [await this.calculateOracleFeeAmount(priceRange, feeOptions, context)],
			gas: ResourceModule.gasLimits.CreateLinkedResourceJsonGasLimit,
			payer: feePayer,
			granter,
		} satisfies DidStdFee;
	}

	/**
	 * Generates oracle-powered fees for creating default DID-Linked Resources.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @param feeOptions - Options for fetching oracle fees
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the fee configuration for DLR creation
	 */
	async generateCreateResourceDefaultFees(
		feePayer: string,
		granter?: string,
		feeOptions?: DidFeeOptions,
		context?: IContext
	): Promise<DidStdFee> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}

		if (!(await this.shouldUseOracleFees(context))) {
			return ResourceModule.generateCreateResourceDefaultFees(feePayer, granter);
		}
		// fetch fee parameters from the Resource module
		const feeParams = await this.queryParams(context);

		// get the price range for the default resource creation
		const priceRange = await this.getPriceRangeFromParams(feeParams, 'default', feeOptions);

		// calculate the oracle fee amount based on the price range and options
		return {
			amount: [await this.calculateOracleFeeAmount(priceRange, feeOptions, context)],
			gas: ResourceModule.gasLimits.CreateLinkedResourceDefaultGasLimit,
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
		operation: 'image' | 'json' | 'default',
		feeOptions?: DidFeeOptions
	) {
		const operationFees = (() => {
			switch (operation) {
				case 'image':
					return feeParams.params?.image.find(
						(fee) => fee.denom === (feeOptions?.feeDenom ?? ResourceModule.baseUsdDenom)
					);
				case 'json':
					return feeParams.params?.json.find(
						(fee) => fee.denom === (feeOptions?.feeDenom ?? ResourceModule.baseUsdDenom)
					);
				case 'default':
					return feeParams.params?.default.find(
						(fee) => fee.denom === (feeOptions?.feeDenom ?? ResourceModule.baseUsdDenom)
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
			feeRange.denom === ResourceModule.baseUsdDenom
				? (feeOptions?.wantedAmountUsd ?? ResourceModule.isFixedRange(feeRange))
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
			feeRange.denom === ResourceModule.baseUsdDenom
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
			? ResourceModule.applySlippageToCoin(convertedFeeAmount, feeOptions.slippageBps)
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
	 * Reads and determines the MIME type of resource content.
	 * Analyzes the content to identify the appropriate MIME type for fee calculation and validation.
	 *
	 * @param content - Resource content as byte array
	 * @returns Promise resolving to the detected MIME type string
	 */
	static async readMimeType(content: Uint8Array): Promise<string> {
		if (isJSON(toString(content, 'utf-8'))) return 'application/json';

		return (await fromBuffer(content))?.mime ?? 'application/octet-stream';
	}

	/**
	 * Generates fee configuration for image resource creation transactions.
	 * Uses higher gas limits appropriate for image processing and storage.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @returns Promise resolving to the fee configuration for image resources
	 */
	static async generateCreateResourceImageFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [ResourceModule.fees.DefaultCreateResourceImageFee],
			gas: ResourceModule.gasLimits.CreateLinkedResourceImageGasLimit,
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}

	/**
	 * Generates fee configuration for JSON resource creation transactions.
	 * Uses gas limits optimized for JSON data processing and validation.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @returns Promise resolving to the fee configuration for JSON resources
	 */
	static async generateCreateResourceJsonFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [ResourceModule.fees.DefaultCreateResourceJsonFee],
			gas: ResourceModule.gasLimits.CreateLinkedResourceJsonGasLimit,
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}

	/**
	 * Generates fee configuration for default resource creation transactions.
	 * Uses standard gas limits for generic resource types and binary data.
	 *
	 * @param feePayer - Address of the account that will pay the transaction fees
	 * @param granter - Optional address of the account granting fee payment permissions
	 * @returns Promise resolving to the fee configuration for default resources
	 */
	static async generateCreateResourceDefaultFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [ResourceModule.fees.DefaultCreateResourceDefaultFee],
			gas: ResourceModule.gasLimits.CreateLinkedResourceDefaultGasLimit,
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}
}
