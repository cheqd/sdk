import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from "@cosmjs/stargate"
import { QueryClientImpl } from '@cheqd/ts-proto/cheqd/v1/query'
import { CheqdExtension, AbstractCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"

export class DIDModule extends AbstractCheqdSDKModule {
    constructor(signer: CheqdSigningStargateClient){
        super(signer)
    }

    async createDidTx(did: string, publicKey: string): Promise<string> {
        return ''
    }

    async updateDidTx(did: string, publicKey: string): Promise<string> {
        return ''
    }
}

export interface DidExtension extends CheqdExtension<string, {}> {
    did: {}
}

export const setupDidExtension = (base: QueryClient): DidExtension => {
    const rpc = createProtobufRpcClient(base)

    const queryService = new QueryClientImpl(rpc)

    return {
        did: {
            //...
        }
    }
}