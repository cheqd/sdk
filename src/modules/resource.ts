import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"
import { DidStdFee, IContext, ISignInputs } from '../types';
import { MsgCreateResource, MsgCreateResourcePayload, MsgCreateResourceResponse, protobufPackage } from "@cheqd/ts-proto/cheqd/resource/v2"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { SignInfo } from "@cheqd/ts-proto/cheqd/did/v2";
import { fromBuffer } from "file-type";

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

	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
		this.methods = {
			createResourceTx: this.createResourceTx.bind(this)
		}
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return []
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

	async createResourceTx(signInputs: ISignInputs[] | SignInfo[], resourcePayload: Partial<MsgCreateResourcePayload>, address: string, fee?: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
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

	static async readMimeType(content: Uint8Array): Promise<string> {
		return (await fromBuffer(content))?.mime ?? 'application/octet-stream'
	}

	static async generateCreateResourceImageFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				ResourceModule.fees.DefaultCreateResourceImageFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateCreateResourceJsonFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				ResourceModule.fees.DefaultCreateResourceJsonFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateCreateResourceDefaultFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				ResourceModule.fees.DefaultCreateResourceDefaultFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}
}

export type MinimalImportableResourcesModule = MinimalImportableCheqdSDKModule<ResourceModule>
