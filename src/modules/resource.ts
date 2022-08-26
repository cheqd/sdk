import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"
import { DidStdFee, IContext, ISignInputsWithSigner } from '../types';
import { MsgCreateResource, MsgCreateResourcePayload, MsgCreateResourceResponse, protobufPackage } from "@cheqd/ts-proto/resource/v1/tx"
import { DeliverTxResponse } from "@cosmjs/stargate"

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
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return []
	}

	async createResourceTx(signInputs: ISignInputsWithSigner[], resourcePayload: Partial<MsgCreateResourcePayload>, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgCreateResourcePayload.fromPartial(resourcePayload)
		const payloadBytes = MsgCreateResourcePayload.encode(payload).finish()

		const signatures = await this._signer.signIdentityTx(signInputs, payloadBytes)

		console.log("signatures", JSON.stringify(signatures, null, 2))

		const value: MsgCreateResource = {
			payload,
			signatures
		}

		const createResourceMsg: MsgCreateResourceEncodeObject = {
			typeUrl: typeUrlMsgCreateResource,
			value
		}

		return this._signer.signAndBroadcast(
			address,
			[createResourceMsg],
			fee,
			memo
		)
	}
}

export type MinimalImportableResourcesModule = MinimalImportableCheqdSDKModule<ResourceModule>
