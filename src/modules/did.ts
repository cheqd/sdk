import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from "@cosmjs/stargate"
/* import { QueryClientImpl } from '"@cheqd/ts-proto/cheqd/did/v1/query' */
import { CheqdExtension, AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { DidStdFee, IContext, ISignInputs } from "../types"
import { MsgCreateDid, MsgCreateDidPayload, MsgCreateDidResponse, MsgUpdateDid, MsgUpdateDidPayload, MsgUpdateDidResponse, protobufPackage } from "@cheqd/ts-proto/cheqd/did/v1/tx"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"

export const typeUrlMsgCreateDid = `/${protobufPackage}.MsgCreateDid`
export const typeUrlMsgCreateDidResponse = `/${protobufPackage}.MsgCreateDidResponse`
export const typeUrlMsgUpdateDid = `/${protobufPackage}.MsgUpdateDid`
export const typeUrlMsgUpdateDidResponse = `/${protobufPackage}.MsgUpdateDidResponse`

export interface MsgCreateDidEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDid,
	readonly value: Partial<MsgCreateDid>
}

export function isMsgCreateDidEncodeObject(obj: EncodeObject): obj is MsgCreateDidEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDid
}

export interface MsgCreateDidResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidResponse,
	readonly value: Partial<MsgCreateDidResponse>
}

export function MsgCreateDidResponseEncodeObject(obj: EncodeObject): obj is MsgCreateDidResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidResponse
}

export interface MsgUpdateDidEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDid,
	readonly value: Partial<MsgUpdateDid>
}

export function MsgUpdateDidEncodeObject(obj: EncodeObject): obj is MsgUpdateDidEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDid
}

export interface MsgUpdateDidResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidResponse,
	readonly value: Partial<MsgUpdateDidResponse>
}

export function MsgUpdateDidResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateDidResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidResponse
}

export class DIDModule extends AbstractCheqdSDKModule {
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
        [typeUrlMsgCreateDid, MsgCreateDid],
        [typeUrlMsgCreateDidResponse, MsgCreateDidResponse],
        [typeUrlMsgUpdateDid, MsgUpdateDid],
        [typeUrlMsgUpdateDidResponse, MsgUpdateDidResponse],
    ]

	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
		this.methods = {
			createDidTx: this.createDidTx.bind(this),
			updateDidTx: this.updateDidTx.bind(this)
		}
	}

    public getRegistryTypes(): Iterable<[string, GeneratedType]> {
        return DIDModule.registryTypes
    }

	async createDidTx(signInputs: ISignInputs[], didPayload: Partial<MsgCreateDidPayload>, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgCreateDidPayload.fromPartial(didPayload)
		const signatures = await this._signer.signCreateDidTx(signInputs, payload)

		const value: MsgCreateDid = {
			payload,
			signatures
		}

		const createDidMsg: MsgCreateDidEncodeObject = {
			typeUrl: typeUrlMsgCreateDid,
			value
		}

		return this._signer.signAndBroadcast(
			address,
			[createDidMsg],
			fee,
			memo
		)
	}

	async updateDidTx(signInputs: ISignInputs[], didPayload: Partial<MsgUpdateDidPayload>, address: string, fee: DidStdFee | 'auto' | number, memo?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		const payload = MsgUpdateDidPayload.fromPartial(didPayload)
		const signatures = await this._signer.signUpdateDidTx(signInputs, payload)

		const value: MsgUpdateDid = {
			payload,
			signatures
		}

		const updateDidMsg: MsgUpdateDidEncodeObject = {
			typeUrl: typeUrlMsgUpdateDid,
			value
		}

		return this._signer.signAndBroadcast(
			address,
			[updateDidMsg],
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
