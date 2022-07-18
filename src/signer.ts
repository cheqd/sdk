import { CheqdExtensions, setupCheqdExtensions } from './modules/_'
import { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { DeliverTxResponse, HttpEndpoint, QueryClient, SigningStargateClient, SigningStargateClientOptions, StdFee } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { createDefaultCheqdRegistry } from "./registry";
import { MsgCreateDidPayload, SignInfo } from '@cheqd/ts-proto/cheqd/v1/tx';
import { ISignInputs, TSignerAlgo, VerificationMethods } from './types';
import { VerificationMethod } from '@cheqd/ts-proto/cheqd/v1/did';
import { EdDSASigner, hexToBytes, Signer } from 'did-jwt';


export class CheqdSigningStargateClient extends SigningStargateClient {
    public readonly cheqdExtensions: CheqdExtensions | undefined
    private didSigners: TSignerAlgo = {}

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

    private async checkDidSigners(verificationMethods: VerificationMethod[] = []) {
        verificationMethods.forEach((verificationMethod) => {
            if (!(Object.values(VerificationMethods) as string[]).includes(verificationMethod.type)) {
                throw new Error(`Unsupported verification method type: ${verificationMethod.type}`)
            }
            if (!this.didSigners[verificationMethod.type]) {
                this.didSigners[verificationMethod.type] = EdDSASigner
            }
        })
    }

    async getDidSigner(verificationMethodId: string, verificationMethods: VerificationMethod[]): Promise<(secretKey: Uint8Array) => Signer> {
        return this.didSigners[verificationMethods.find(method => method.id === verificationMethodId)!.type] ?? EdDSASigner
    }

    async signDIDTx(signInputs: ISignInputs[], payload: MsgCreateDidPayload): Promise<SignInfo[]> {
        await this.checkDidSigners(payload?.verificationMethod)

        const signBytes = MsgCreateDidPayload.encode(payload).finish()
        const signInfos: SignInfo[] = await Promise.all(signInputs.map(async (signInput) => {
            return {
                verificationMethodId: signInput.verificationMethodId,
                signature: await (await this.getDidSigner(signInput.verificationMethodId, payload.verificationMethod))(hexToBytes(signInput.privateKeyHex))(signBytes) as string
            }
        }))

        return signInfos
    }
}