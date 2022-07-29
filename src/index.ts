import { GeneratedType, OfflineSigner, Registry } from '@cosmjs/proto-signing'
import { DIDModule, MinimalImportableDIDModule } from './modules/did'
import { MinimalImportableResourcesModule, ResourcesModule } from './modules/resources'
import { AbstractCheqdSDKModule, applyMixins, instantiateCheqdSDKModule, } from './modules/_'
import { createDefaultCheqdRegistry } from './registry'
import { CheqdSigningStargateClient } from './signer'
import { CheqdNetwork, IContext, IModuleMethodMap } from './types'

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
	private protectedMethods: string[] = ['constructor', 'build', 'loadModules']

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

		let registryTypes: Iterable<[string, GeneratedType]> = [];
		this.options.modules.forEach((module: AbstractCheqdSDKModule) => {
			registryTypes = [...registryTypes, ...module.registryTypes]
		})
		for (const registryType of registryTypes) {
			this.signer.registry.register(registryType[0], registryType[1])
		}

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

	async build() {
		this.signer = await CheqdSigningStargateClient.connectWithSigner(
			this.options.rpcUrl,
			this.options.wallet,
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

export { DIDModule, ResourcesModule }
