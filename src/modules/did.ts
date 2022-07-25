import { createProtobufRpcClient, DeliverTxResponse, QueryClient, StdFee } from "@cosmjs/stargate"
/* import { QueryClientImpl } from '@cheqd/ts-proto/cheqd/v1/query' */
import { CheqdExtension, AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { DidStdFee, IContext, ISignInputs } from "../types"
import { MsgCreateDid, MsgCreateDidPayload } from "@cheqd/ts-proto/cheqd/v1/tx"
import { MsgCreateDidEncodeObject, typeUrlMsgCreateDid } from "../registry"

export class DIDModule extends AbstractCheqdSDKModule {
    constructor(signer: CheqdSigningStargateClient){
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
        const signatures = await this._signer.signDidTx(signInputs, payload)

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

    async updateDidTx(did: string, publicKey: string): Promise<string> {
        return ''
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