import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_';
import { CheqdSigningStargateClient } from '../signer';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing-cjs';
import { DidStdFee, IContext, ISignInputs, QueryExtensionSetup } from '../types';
import {
	Metadata,
	MsgCreateResource,
	MsgCreateResourcePayload,
	MsgCreateResourceResponse,
	QueryClientImpl,
	QueryCollectionResourcesResponse,
	ResourceWithMetadata,
	protobufPackage,
} from '@cheqd/ts-proto-cjs/cheqd/resource/v2';
import { DeliverTxResponse, QueryClient, createPagination, createProtobufRpcClient } from '@cosmjs/stargate-cjs';
import { toString } from 'uint8arrays-cjs';
import { fromBuffer } from 'file-type-cjs/browser';
import { SignInfo } from '@cheqd/ts-proto-cjs/cheqd/did/v2/index';
import { assert } from '@cosmjs/utils-cjs';
import { PageRequest } from '@cheqd/ts-proto-cjs/cosmos/base/query/v1beta1/pagination';
import { CheqdQuerier } from '../querier';
import { isJSON } from '../utils';

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
				const { resource } = await queryService.Resource({
					collectionId,
					id: resourceId,
				});
				assert(resource);
				return resource;
			},
			resourceMetadata: async (collectionId: string, resourceId: string) => {
				const { resource } = await queryService.ResourceMetadata({
					collectionId,
					id: resourceId,
				});
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
		},
	} as ResourceExtension;
};

/**
 * Resource Module class providing comprehensive linked resource functionality.
 * Handles creation, querying, and metadata management of resources linked to DID documents.
 */
export class ResourceModule extends AbstractCheqdSDKModule {
	//@ts-expect-error the underlying type is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlMsgCreateResource, MsgCreateResource],
		[typeUrlMsgCreateResourceResponse, MsgCreateResourceResponse],
	];

	/** Base denomination for Cheqd network transactions */
	static readonly baseMinimalDenom = 'ncheq' as const;

	/**
	 * Standard fee amounts for different resource types.
	 * Fees vary based on resource content type and processing requirements.
	 */
	static readonly fees = {
		/** Default fee for creating image resources */
		DefaultCreateResourceImageFee: {
			amount: '10000000000',
			denom: ResourceModule.baseMinimalDenom,
		} as const,
		/** Default fee for creating JSON resources */
		DefaultCreateResourceJsonFee: {
			amount: '10000000000',
			denom: ResourceModule.baseMinimalDenom,
		} as const,
		/** Default fee for creating other types of resources */
		DefaultCreateResourceDefaultFee: {
			amount: '10000000000',
			denom: ResourceModule.baseMinimalDenom,
		} as const,
	} as const;

	/** Querier extension setup function for resource operations */
	static readonly querierExtensionSetup: QueryExtensionSetup<ResourceExtension> = setupResourceExtension;

	/** Querier instance with resource extension capabilities */

	/** Querier instance with resource extension capabilities */
	querier: CheqdQuerier & ResourceExtension;

	/**
	 * Constructs a new resource module instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client with resource extension for data retrieval
	 */
	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & ResourceExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			createLinkedResourceTx: this.createLinkedResourceTx.bind(this),
			queryLinkedResource: this.queryLinkedResource.bind(this),
			queryLinkedResourceMetadata: this.queryLinkedResourceMetadata.bind(this),
			queryLinkedResources: this.queryLinkedResources.bind(this),
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

			fee = await (async function () {
				const mimeType = await ResourceModule.readMimeType(payload.data);

				if (mimeType.startsWith('image/')) {
					return await ResourceModule.generateCreateResourceImageFees(address);
				}

				if (mimeType.startsWith('application/json')) {
					return await ResourceModule.generateCreateResourceJsonFees(address);
				}

				return await ResourceModule.generateCreateResourceDefaultFees(address);
			})();
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
			gas: '2000000',
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
			gas: '2000000',
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
			gas: '2000000',
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}
}
