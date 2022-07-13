import { CheqdExtensions, setupCheqdExtensions } from './modules/_'
import { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { DeliverTxResponse, HttpEndpoint, QueryClient, SigningStargateClient, SigningStargateClientOptions, StdFee } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { createDefaultCheqdRegistry } from "./registry";


export class CheqdSigningStargateClient extends SigningStargateClient {
    public readonly cheqdExtensions: CheqdExtensions | undefined

    public static async connectWithSigner(endpoint: string | HttpEndpoint, signer: OfflineSigner, options?: SigningStargateClientOptions | undefined): Promise<CheqdSigningStargateClient> {
        const tmClient = await Tendermint34Client.connect(endpoint)
        return new CheqdSigningStargateClient(tmClient, signer, {
            registry: createDefaultCheqdRegistry(),
            ...options
        });
    }

    constructor(
        tmClient: Tendermint34Client | undefined,
        signer: OfflineSigner,
        options: SigningStargateClientOptions = {}
    ) {
        super(tmClient, signer, options)

        /** GRPC Connection */

        /* if (tmClient) {
            this.cheqdExtensions = QueryClient.withExtensions(tmClient, setupCheqdExtensions)
        } */
    }
}