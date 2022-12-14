import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"
import { DidStdFee, IContext, ISignInputs } from '../types';
import { MsgCreateResource, MsgCreateResourcePayload, MsgCreateResourceResponse, protobufPackage } from "@cheqd/ts-proto/cheqd/resource/v2"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { Writer } from "protobufjs"

export const typeUrlMsgCreateResource = `/${protobufPackage}.MsgCreateResource`
export const typeUrlMsgCreateResourceResponse = `/${protobufPackage}.MsgCreateResourceResponse`

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

	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
		this.methods = {
			createResourceTx: this.createResourceTx.bind(this)
		}
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return []
	}

	static async signPayload(payload: MsgCreateResourcePayload, signInputs: ISignInputs[]): Promise<MsgCreateResource> {
		const signBytes = MsgCreateResourcePayload.encode(payload).finish()
		const signatures = await CheqdSigningStargateClient.signIdentityTx(signBytes, signInputs)
		
		return {
			payload,
			signatures
		}
	}

	async createResourceTx(signInputs: ISignInputs[], resourcePayload: Partial<MsgCreateResourcePayload>, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgCreateResourcePayload.fromPartial(resourcePayload)

		const msg = await ResourceModule.signPayload(payload, signInputs)

		const encObj: MsgCreateResourceEncodeObject = {
			typeUrl: typeUrlMsgCreateResource,
			value: msg
		}

		return this._signer.signAndBroadcast(
			address,
			[encObj],
			fee,
			memo
		)
	}
}

export type MinimalImportableResourcesModule = MinimalImportableCheqdSDKModule<ResourceModule>
