import {
	AbstractCheqdSDKModule,
	MinimalImportableCheqdSDKModule
} from './_.js';
import { CheqdSigningStargateClient } from "../signer.js"
import {
	EncodeObject,
	GeneratedType
} from "@cosmjs/proto-signing"
import {
	DidStdFee,
	IContext,
	ISignInputs,
	QueryExtensionSetup
} from '../types.js';
import {
	Metadata,
	MsgCreateResource,
	MsgCreateResourcePayload,
	MsgCreateResourceResponse,
	QueryClientImpl,
	QueryCollectionResourcesResponse,
	ResourceWithMetadata,
	protobufPackage
} from "@cheqd/ts-proto/cheqd/resource/v2/index.js"
import {
	DeliverTxResponse,
	QueryClient,
	createPagination,
	createProtobufRpcClient
} from "@cosmjs/stargate"
import { SignInfo } from "@cheqd/ts-proto/cheqd/did/v2/index.js";
import { fileTypeFromBuffer } from "file-type";
import { toString } from 'uint8arrays/to-string';
import { assert } from '@cosmjs/utils';
import { PageRequest } from '@cheqd/ts-proto/cosmos/base/query/v1beta1/pagination.js';
import { CheqdQuerier } from '../querier.js';
import { isJSON } from '../utils.js';

export const defaultResourceExtensionKey = 'resource' as const

export const protobufLiterals = {
	MsgCreateResource: 'MsgCreateResource',
	MsgCreateResourceResponse: 'MsgCreateResourceResponse'
} as const

export const typeUrlMsgCreateResource = `/${protobufPackage}.${protobufLiterals.MsgCreateResource}`
export const typeUrlMsgCreateResourceResponse = `/${protobufPackage}.${protobufLiterals.MsgCreateResourceResponse}`

export interface MsgCreateResourceEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateResource,
	readonly value: Partial<MsgCreateResource>
}

export function isMsgCreateResourceEncodeObject(obj: EncodeObject): obj is MsgCreateResourceEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateResource
}

export type MinimalImportableResourceModule = MinimalImportableCheqdSDKModule<ResourceModule>

export type ResourceExtension = {
	readonly [defaultResourceExtensionKey]: {
		readonly resource: (collectionId: string, resourceId: string) => Promise<ResourceWithMetadata>
		readonly resourceMetadata: (collectionId: string, resourceId: string) => Promise<Metadata>
		readonly collectionResources: (collectionId: string, paginationKey?: Uint8Array) => Promise<QueryCollectionResourcesResponse>
	}
}

export const setupResourceExtension = (base: QueryClient): ResourceExtension => {
	const rpc = createProtobufRpcClient(base)

	const queryService = new QueryClientImpl(rpc)

	return {
		[defaultResourceExtensionKey]: {
			resource: async (collectionId: string, resourceId: string) => {
				const { resource } = await queryService.Resource({ collectionId, id: resourceId })
				assert(resource)
				return resource
			},
			resourceMetadata: async (collectionId: string, resourceId: string) => {
				const { resource } = await queryService.ResourceMetadata({ collectionId, id: resourceId })
				assert(resource)
				return resource
			},
			collectionResources: async (collectionId: string, paginationKey?: Uint8Array) => {
				const response = await queryService.CollectionResources({ collectionId, pagination: createPagination(paginationKey) as PageRequest | undefined })
				return response
			}
		}
	} as ResourceExtension
}

export class ResourceModule extends AbstractCheqdSDKModule {
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlMsgCreateResource, MsgCreateResource],
		[typeUrlMsgCreateResourceResponse, MsgCreateResourceResponse]
	]

	static readonly baseMinimalDenom = 'ncheq' as const

	static readonly fees = {
		DefaultCreateResourceImageFee: { amount: '10000000000', denom: ResourceModule.baseMinimalDenom } as const,
		DefaultCreateResourceJsonFee: { amount: '2500000000', denom: ResourceModule.baseMinimalDenom } as const,
		DefaultCreateResourceDefaultFee: { amount: '5000000000', denom: ResourceModule.baseMinimalDenom } as const,
	} as const

	static readonly querierExtensionSetup: QueryExtensionSetup<ResourceExtension> = setupResourceExtension

	querier: CheqdQuerier & ResourceExtension

	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & ResourceExtension) {
		super(signer, querier)
		this.querier = querier
		this.methods = {
			createLinkedResourceTx: this.createLinkedResourceTx.bind(this),
			queryLinkedResource: this.queryLinkedResource.bind(this),
			queryLinkedResourceMetadata: this.queryLinkedResourceMetadata.bind(this),
			queryLinkedResources: this.queryLinkedResources.bind(this),
		}
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return ResourceModule.registryTypes
	}

	public getQuerierExtensionSetup(): QueryExtensionSetup<ResourceExtension> {
		return ResourceModule.querierExtensionSetup
	}

	static async signPayload(payload: MsgCreateResourcePayload, signInputs: ISignInputs[] | SignInfo[]): Promise<MsgCreateResource> {
		const signBytes = MsgCreateResourcePayload.encode(payload).finish()
		let signatures: SignInfo[]
		if(ISignInputs.isSignInput(signInputs)) {
			signatures = await CheqdSigningStargateClient.signIdentityTx(signBytes, signInputs)
		} else {
			signatures = signInputs
		}

		return {
			payload,
			signatures
		}
	}

	async createLinkedResourceTx(signInputs: ISignInputs[] | SignInfo[], resourcePayload: Partial<MsgCreateResourcePayload>, address: string, fee?: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgCreateResourcePayload.fromPartial(resourcePayload)

		const msg = await ResourceModule.signPayload(payload, signInputs)

		const encObj: MsgCreateResourceEncodeObject = {
			typeUrl: typeUrlMsgCreateResource,
			value: msg
		}

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address
		}

		if (!fee) {
			if (payload.data.length === 0) {
				throw new Error('Linked resource data is empty')
			}

			fee = await async function() {
				const mimeType = await ResourceModule.readMimeType(payload.data)

				if (mimeType.startsWith('image/')) {
					return await ResourceModule.generateCreateResourceImageFees(address)
				}

				if (mimeType.startsWith('application/json')) {
					return await ResourceModule.generateCreateResourceJsonFees(address)
				}

				return await ResourceModule.generateCreateResourceDefaultFees(address)
			}()
		}

		return this._signer.signAndBroadcast(
			address,
			[encObj],
			fee!,
			memo
		)
	}

	async queryLinkedResource(collectionId: string, resourceId: string, context?: IContext): Promise<ResourceWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier
		}
		return await this.querier[defaultResourceExtensionKey].resource(collectionId, resourceId)
	}

	async queryLinkedResourceMetadata(collectionId: string, resourceId: string, context?: IContext): Promise<Metadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier
		}
		return await this.querier[defaultResourceExtensionKey].resourceMetadata(collectionId, resourceId)
	}

	async queryLinkedResources(collectionId: string, context?: IContext): Promise<QueryCollectionResourcesResponse> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier
		}
		return await this.querier[defaultResourceExtensionKey].collectionResources(collectionId)
	}

	static async readMimeType(content: Uint8Array): Promise<string> {
		if (isJSON(toString(content, 'utf-8'))) return 'application/json'

		return (await fileTypeFromBuffer(content))?.mime ?? 'application/octet-stream'
	}

	static async generateCreateResourceImageFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				ResourceModule.fees.DefaultCreateResourceImageFee
			],
			gas: '1200000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateCreateResourceJsonFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				ResourceModule.fees.DefaultCreateResourceJsonFee
			],
			gas: '1200000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateCreateResourceDefaultFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				ResourceModule.fees.DefaultCreateResourceDefaultFee
			],
			gas: '1200000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}
}
