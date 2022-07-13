import { OfflineSigner } from '@cosmjs/proto-signing'
import { DIDModule } from './modules/did'
import { ResourcesModule } from './modules/resources'
import { AbstractCheqdSDKModule, applyMixins, } from './modules/_'
import { CheqdSigningStargateClient } from './signer'
import { CheqdNetwork } from './types'

export interface ICheqdSDKOptions {
    modules: AbstractCheqdSDKModule[]
    authorizedMethods?: string[]
    network?: CheqdNetwork
    rpcUrl: string
    readonly wallet: OfflineSigner
}

export interface CheqdSDK extends DIDModule, ResourcesModule {}

export class CheqdSDK {
    methods: string[]
    signer: CheqdSigningStargateClient
    options: ICheqdSDKOptions
    private protectedMethods: string[] = ['build', 'loadModules']

    constructor(options: ICheqdSDKOptions) {
        if (!options?.wallet) {
            throw new Error('No wallet provided')
        }

        this.options = {
            authorizedMethods: [],
            network: CheqdNetwork.Testnet,
            ...options
        }

        this.methods = this.options.authorizedMethods || []
        this.signer = new CheqdSigningStargateClient(undefined, this.options.wallet, {})
    }

    private loadModules(modules: AbstractCheqdSDKModule[]): CheqdSDK {
        const methods = applyMixins(this, modules)
        this.methods = this.methods.concat(methods)

        return this
    }

    async build() {
        this.signer = await CheqdSigningStargateClient.connectWithSigner(
            this.options.rpcUrl,
            this.options.wallet
        )
        this.options.modules = this.options.modules.map(module => module.constructor(this.signer)) || []

        return this.loadModules(this.options.modules)
    }
}

export async function createCheqdSDK(options: ICheqdSDKOptions): Promise<CheqdSDK> {
    return await (new CheqdSDK(options)).build()
}

export { DIDModule, ResourcesModule }