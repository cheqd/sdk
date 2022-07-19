import { createProtobufRpcClient, DeliverTxResponse, QueryClient, StdFee } from "@cosmjs/stargate"
/* import { QueryClientImpl } from '@cheqd/ts-proto/cheqd/v1/query' */
import { CheqdExtension, AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { DidStdFee, IContext, ISignInputs } from "../types"
import { MsgCreateDid, MsgCreateDidPayload, MsgCreateDidResponse, MsgUpdateDid, MsgUpdateDidPayload, MsgUpdateDidResponse } from "@cheqd/ts-proto/cheqd/v1/tx"
import { MsgCreateDidEncodeObject, MsgUpdateDidEncodeObject, typeUrlMsgCreateDid, typeUrlMsgUpdateDid, typeUrlMsgUpdateDidResponse } from "../registry"
import { VerificationMethod } from "@cheqd/ts-proto/cheqd/v1/did"
import { GeneratedType } from "@cosmjs/proto-signing"
import {
	typeUrlMsgCreateDidResponse,
} from "../registry"

export class DIDModule extends AbstractCheqdSDKModule {
	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
		this.methods = {
			createDidTx: this.createDidTx.bind(this),
			updateDidTx: this.updateDidTx.bind(this)
		}
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

	registryTypes = (): Iterable<[string, GeneratedType]> => {
		return [
			[typeUrlMsgCreateDid, MsgCreateDid],
			[typeUrlMsgCreateDidResponse, MsgCreateDidResponse],
			[typeUrlMsgUpdateDid, MsgUpdateDid],
			[typeUrlMsgUpdateDidResponse, MsgUpdateDidResponse],
		]
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
