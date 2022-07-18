import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from "@cosmjs/stargate"
/* import { QueryClientImpl } from '@cheqd/ts-proto/cheqd/v1/query' */
import { CheqdExtension, AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { IContext } from "../types"

export class DIDModule extends AbstractCheqdSDKModule {
    constructor(signer: CheqdSigningStargateClient){
        super(signer)
        this.methods = {
            createDidTx: this.createDidTx.bind(this),
            updateDidTx: this.updateDidTx.bind(this)
        }
    }

    async createDidTx(did: string, publicKey: string, context?: IContext): Promise<string> {
        if (!this._signer) {
            this._signer = context!.sdk!.signer
        }
        return ''
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