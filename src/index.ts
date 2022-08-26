import { OfflineSigner, Registry } from '@cosmjs/proto-signing'
import { DIDModule, MinimalImportableDIDModule } from './modules/did'
import { MinimalImportableResourcesModule, ResourceModule } from './modules/resource'
import { AbstractCheqdSDKModule, applyMixins, instantiateCheqdSDKModule, instantiateCheqdSDKModuleRegistryTypes, } from './modules/_'
import { createDefaultCheqdRegistry } from './registry'
import { CheqdSigningStargateClient } from './signer'
import { CheqdNetwork, IContext, IModuleMethodMap } from './types'
import { createSignInputsFromImportableEd25519Key } from './utils'

export interface ICheqdSDKOptions {
	modules: AbstractCheqdSDKModule[]
	authorizedMethods?: string[]
	network?: CheqdNetwork
	rpcUrl: string
	readonly wallet: OfflineSigner
}

export type DefaultCheqdSDKModules = MinimalImportableDIDModule & MinimalImportableResourcesModule

export interface CheqdSDK extends DefaultCheqdSDKModules { }

export class CheqdSDK {
	methods: IModuleMethodMap
	signer: CheqdSigningStargateClient
	options: ICheqdSDKOptions
	private protectedMethods: string[] = ['constructor', 'build', 'loadModules', 'loadRegistry']

	constructor(options: ICheqdSDKOptions) {
		if (!options?.wallet) {
			throw new Error('No wallet provided')
		}

		this.options = {
			authorizedMethods: [],
			network: CheqdNetwork.Testnet,
			...options
		}

		this.methods = {}
		this.signer = new CheqdSigningStargateClient(undefined, this.options.wallet, {})
	}

	async execute<P = any, R = any>(method: string, ...params: P[]): Promise<R> {
		if (!Object.keys(this.methods).includes(method)) {
			throw new Error(`Method ${method} is not authorized`)
		}
		return await this.methods[method](...params, { sdk: this } as IContext)
	}

	private loadModules(modules: AbstractCheqdSDKModule[]): CheqdSDK {
		this.options.modules = this.options.modules.map((module: any) => instantiateCheqdSDKModule(module, this.signer, { sdk: this } as IContext) as unknown as AbstractCheqdSDKModule)

		const methods = applyMixins(this, modules)
		this.methods = { ...this.methods, ...filterUnauthorizedMethods(methods, this.options.authorizedMethods || [], this.protectedMethods) }

		for (const method of Object.keys(this.methods)) {
			// @ts-ignore
			this[method] = async (...params: any[]) => {
				return await this.execute(method, ...params)
			}
		}

		return this
	}

    private loadRegistry(): Registry {
        const registryTypes = this.options.modules.map((module: any) => instantiateCheqdSDKModuleRegistryTypes(module)).reduce((acc, types) => {
            return [...acc, ...types]
        })
        return createDefaultCheqdRegistry(registryTypes)
    }

	async build(): Promise<CheqdSDK> {
        const registry = this.loadRegistry()

		this.signer = await CheqdSigningStargateClient.connectWithSigner(
			this.options.rpcUrl,
			this.options.wallet,
            {
                registry,
            }
		)

		return this.loadModules(this.options.modules)
	}
}

export function filterUnauthorizedMethods(methods: IModuleMethodMap, authorizedMethods: string[], protectedMethods: string[]): IModuleMethodMap {
	let _methods = Object.keys(methods)
	if (authorizedMethods.length === 0)
		return _methods
			.filter(method => !protectedMethods.includes(method))
			.reduce((acc, method) => ({ ...acc, [method]: methods[method] }), {})

	return _methods
		.filter(method => authorizedMethods.includes(method) && !protectedMethods.includes(method))
		.reduce((acc, method) => ({ ...acc, [method]: methods[method] }), {})
}

export async function createCheqdSDK(options: ICheqdSDKOptions): Promise<CheqdSDK> {
	return await (new CheqdSDK(options)).build()
}

export { DIDModule, ResourceModule as ResourcesModule }
export { createSignInputsFromImportableEd25519Key }
export {
	createKeyPairRaw, 
	createKeyPairBase64,
	createKeyPairHex,
	createVerificationKeys,
	createDidVerificationMethod,
	createDidPayload
} from './utils'
