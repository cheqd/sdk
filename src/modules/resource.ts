import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"
import { DidStdFee, IContext, ISignInputs } from '../types';
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
		this.methods = {
			createResourceTx: this.createResourceTx.bind(this)
		}
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return []
	}

	// We need this workagound because amino encoding is used in cheqd-node to derive sign bytes for identity messages.
	// In most cases it works the same way as protobuf encoding, but in the MsgCreateResourcePayload
	// we use non-default property indexes so we need this separate encoding function.
	// TODO: Remove this workaround when cheqd-node will use protobuf encoding.
	static getMsgCreateResourcePayloadAminoSignBytes(message: MsgCreateResourcePayload): Uint8Array {
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
			// Animo coded assigns index 5 to this property. In proto definitions it's 6.
			// Since we use amino on node + non default property indexing, we need to encode it manually.
			writer.uint32(42).bytes(message.data);
		}

		return writer.finish();
	}

	static async signPayload(payload: MsgCreateResourcePayload, signInputs: ISignInputs[]): Promise<MsgCreateResource> {
		const signBytes = ResourceModule.getMsgCreateResourcePayloadAminoSignBytes(payload)
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
