import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"
import { DidStdFee, IContext, ISignInputsWithSigner } from '../types';
import { MsgCreateResource, MsgCreateResourcePayload, MsgCreateResourceResponse, protobufPackage } from "@cheqd/ts-proto/resource/v1/tx"
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
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return []
	}

	// Describe the reason for using custom method.
	encode(
		message: MsgCreateResourcePayload,
	  ): Uint8Array {
		const writer = new Writer();

		if (message.collectionId !== "") {
		  writer.uint32(10).string(message.collectionId);
		}
		if (message.id !== "") {
		  writer.uint32(18).string(message.id);
		}
		if (message.name !== "") {
		  writer.uint32(26).string(message.name);
		}
		if (message.resourceType !== "") {
		  writer.uint32(34).string(message.resourceType);
		}
		if (message.data.length !== 0) {
			// We use 42 instead of 50 or 00110.010 instead of 00101.010 because when we encode with animo
			// the index of the field is 5 instead of 6.
		  writer.uint32(42).bytes(message.data);
		}

		return writer.finish();
	  }

	async createResourceTx(signInputs: ISignInputsWithSigner[], resourcePayload: Partial<MsgCreateResourcePayload>, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgCreateResourcePayload.fromPartial(resourcePayload)



		const payloadBytes = this.encode(payload)

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
