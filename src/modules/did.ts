import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from "@cosmjs/stargate"
/* import { QueryClientImpl } from '@cheqd/ts-proto/cheqd/did/v1/query' */
import { CheqdExtension, AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { DidStdFee, IContext, ISignInputs, MsgDeactivateDidPayload } from "../types"
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
	protobufPackage 
} from "@cheqd/ts-proto/cheqd/did/v2"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"

export const typeUrlMsgCreateDidDoc = `/${protobufPackage}.MsgCreateDidDoc`
export const typeUrlMsgCreateDidDocResponse = `/${protobufPackage}.MsgCreateDidDocResponse`
export const typeUrlMsgUpdateDidDoc = `/${protobufPackage}.MsgUpdateDidDoc`
export const typeUrlMsgUpdateDidDocResponse = `/${protobufPackage}.MsgUpdateDidDocResponse`
export const typeUrlMsgDeactivateDidDoc = `/${protobufPackage}.MsgDeactivateDidDoc`
export const typeUrlMsgDeactivateDidDocResponse = `/${protobufPackage}.MsgDeactivateDidDocResponse`

export interface MsgCreateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDoc,
	readonly value: Partial<MsgCreateDidDoc>
}

export function isMsgCreateDidDocEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDoc
}

export interface MsgCreateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDocResponse,
	readonly value: Partial<MsgCreateDidDocResponse>
}

export function MsgCreateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDocResponse
}

export interface MsgUpdateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDoc,
	readonly value: Partial<MsgUpdateDidDoc>
}

export function MsgUpdateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDoc
}

export interface MsgUpdateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDocResponse,
	readonly value: Partial<MsgUpdateDidDocResponse>
}

export function MsgUpdateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse
}

export interface MsgDeactivateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDoc,
	readonly value: Partial<MsgDeactivateDidDoc>
}

export function MsgDeactivateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgDeactivateDidDoc
}

export interface MsgDeactivateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDocResponse,
	readonly value: Partial<MsgDeactivateDidDocResponse>
}

export function MsgDeactiveDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgDeactivateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse
}

export class DIDModule extends AbstractCheqdSDKModule {
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
        [typeUrlMsgCreateDidDoc, MsgCreateDidDoc],
        [typeUrlMsgCreateDidDocResponse, MsgCreateDidDocResponse],
        [typeUrlMsgUpdateDidDoc, MsgUpdateDidDoc],
        [typeUrlMsgUpdateDidDocResponse, MsgUpdateDidDocResponse],
    ]

	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
		this.methods = {
			createDidTx: this.createDidTx.bind(this),
			updateDidTx: this.updateDidTx.bind(this),
			deactivateDidTx: this.deactivateDidTx.bind(this),
		}
	}

    public getRegistryTypes(): Iterable<[string, GeneratedType]> {
        return DIDModule.registryTypes
    }

	async createDidTx(signInputs: ISignInputs[], didPayload: Partial<MsgCreateDidDocPayload>, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgCreateDidDocPayload.fromPartial(didPayload)
		const signatures = await this._signer.signCreateDidTx(signInputs, payload)

		const value: MsgCreateDidDoc = {
			payload,
			signatures
		}

		const createDidMsg: MsgCreateDidDocEncodeObject = {
			typeUrl: typeUrlMsgCreateDidDoc,
			value
		}

		return this._signer.signAndBroadcast(
			address,
			[createDidMsg],
			fee,
			memo
		)
	}

	async updateDidTx(signInputs: ISignInputs[], didPayload: Partial<MsgUpdateDidDocPayload>, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgUpdateDidDocPayload.fromPartial(didPayload)
		const signatures = await this._signer.signUpdateDidTx(signInputs, payload)

		const value: MsgUpdateDidDoc = {
			payload,
			signatures
		}

		const updateDidMsg: MsgUpdateDidDocEncodeObject = {
			typeUrl: typeUrlMsgUpdateDidDoc,
			value
		}

		return this._signer.signAndBroadcast(
			address,
			[updateDidMsg],
			fee,
			memo
		)
	}

	async deactivateDidTx(signInputs: ISignInputs[], didPayload: MsgDeactivateDidPayload, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgDeactivateDidDocPayload.fromPartial({id: didPayload.id, versionId: didPayload.versionId})
		const signatures = await this._signer.signDeactivateDidTx(signInputs, payload, didPayload.verificationMethod)

		const value: MsgDeactivateDidDoc = {
			payload,
			signatures
		}

		const deactivateDidMsg: MsgDeactivateDidDocEncodeObject = {
			typeUrl: typeUrlMsgDeactivateDidDoc,
			value
		}

		return this._signer.signAndBroadcast(
			address,
			[deactivateDidMsg],
			fee,
			memo
		)
	}
}

export type MinimalImportableDIDModule = MinimalImportableCheqdSDKModule<DIDModule>

export interface DidExtension extends CheqdExtension<string, {}> {
	did: {}
}

export const setupDidExtension = (base: QueryClient): DidExtension => {
	const rpc = createProtobufRpcClient(base)

	/* const queryService = new QueryClientImpl(rpc) */

	return {
		did: {
			//...
		}
	}
}
