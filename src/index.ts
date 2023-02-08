import { OfflineSigner, Registry } from '@cosmjs/proto-signing'
import { DIDModule, MinimalImportableDIDModule, DidExtension } from './modules/did';
import { MinimalImportableResourceModule, ResourceModule, ResourceExtension } from './modules/resource';
import { AbstractCheqdSDKModule, applyMixins, instantiateCheqdSDKModule, instantiateCheqdSDKModuleRegistryTypes, instantiateCheqdSDKModuleQuerierExtensionSetup } from './modules/_';
import { createDefaultCheqdRegistry } from './registry'
import { CheqdSigningStargateClient } from './signer'
import { CheqdNetwork, IContext, IModuleMethodMap } from './types';
import { createSignInputsFromImportableEd25519Key } from './utils'
import { GasPrice, QueryClient } from '@cosmjs/stargate'
import { CheqdQuerier } from './querier'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'

export interface ICheqdSDKOptions {
	modules: AbstractCheqdSDKModule[]
	querierExtensions?: Record<string, any>[] 
	rpcUrl: string
	network?: CheqdNetwork
	gasPrice?: GasPrice
	authorizedMethods?: string[]
	readonly wallet: OfflineSigner
}

export type DefaultCheqdSDKModules = MinimalImportableDIDModule & MinimalImportableResourceModule

export interface CheqdSDK extends DefaultCheqdSDKModules {}

export class CheqdSDK {
	methods: IModuleMethodMap
	signer: CheqdSigningStargateClient
	querier: CheqdQuerier & DidExtension & ResourceExtension
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
		this.querier = <any> new QueryClient({} as unknown as Tendermint34Client)
	}

	async execute<P = any, R = any>(method: string, ...params: P[]): Promise<R> {
		if (!Object.keys(this.methods).includes(method)) {
			throw new Error(`Method ${method} is not authorized`)
		}
		return await this.methods[method](...params, { sdk: this } as IContext)
	}

	private async loadModules(modules: AbstractCheqdSDKModule[]): Promise<CheqdSDK> {
		this.options.modules = this.options.modules.map((module: any) => instantiateCheqdSDKModule(module, this.signer, this.querier, { sdk: this } as IContext) as unknown as AbstractCheqdSDKModule)

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

	private async loadQuerierExtensions(): Promise<CheqdQuerier & DidExtension & ResourceExtension> {
		const querierExtensions = this.options.modules.map((module: any) => instantiateCheqdSDKModuleQuerierExtensionSetup(module))
		const querier = await CheqdQuerier.connectWithExtensions(this.options.rpcUrl, ...querierExtensions)
		return <CheqdQuerier & DidExtension & ResourceExtension>querier
	}

	async build(): Promise<CheqdSDK> {
        const registry = this.loadRegistry()

		this.querier = await this.loadQuerierExtensions()
		this.signer = await CheqdSigningStargateClient.connectWithSigner(
			this.options.rpcUrl,
			this.options.wallet,
            {
                registry,
				gasPrice: this.options?.gasPrice,
            }
		)

		return await this.loadModules(this.options.modules)
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

export { DIDModule, ResourceModule }
export { createSignInputsFromImportableEd25519Key }
export {
	createKeyPairRaw, 
	createKeyPairBase64,
	createKeyPairHex,
	createVerificationKeys,
	createDidVerificationMethod,
	createDidPayload
} from './utils'
