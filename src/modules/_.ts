import { GeneratedType } from "@cosmjs/proto-signing"
import { QueryClient } from "@cosmjs/stargate"
import { CheqdSigningStargateClient } from '../signer'
import {
	IModuleMethodMap,
	QueryExtensionSetup
} from '../types';
import { CheqdQuerier } from "../querier";

export abstract class AbstractCheqdSDKModule {
	_signer: CheqdSigningStargateClient
	methods: IModuleMethodMap = {}
	querier: CheqdQuerier
	readonly _protectedMethods: string[] = ['constructor', 'getRegistryTypes', 'getQuerierExtensionSetup']
	static readonly registryTypes: Iterable<[string, GeneratedType]> = []
	static readonly querierExtensionSetup: QueryExtensionSetup<any> = (base: QueryClient) => ({})

	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier) {
		if (!signer) {
			throw new Error("signer is required")
		}
		if (!querier) {
			throw new Error("querier is required")
		}
		this._signer = signer
		this.querier = querier
	}

    abstract getRegistryTypes(): Iterable<[string, GeneratedType]>
}

type ProtectedMethods<T extends AbstractCheqdSDKModule, K extends keyof T> = T[K] extends string[] ? T[K][number] : T[K]

export type MinimalImportableCheqdSDKModule<T extends AbstractCheqdSDKModule> = Omit<T, '_signer' | '_protectedMethods' | 'registryTypes' | 'querierExtensionSetup' | 'getRegistryTypes' | 'getQuerierExtensionSetup'>

export function instantiateCheqdSDKModule<T extends new (...args: any[]) => T>(module: T, ...args: ConstructorParameters<T>): T {
	return new module(...args)
}

export function instantiateCheqdSDKModuleRegistryTypes(module: any): Iterable<[string, GeneratedType]> {
    return module.registryTypes ?? []
}

export function instantiateCheqdSDKModuleQuerierExtensionSetup(module: any): QueryExtensionSetup<any> {
	return module.querierExtensionSetup ?? {}
}

export function applyMixins(derivedCtor: any, constructors: any[]): IModuleMethodMap {
	let methods: IModuleMethodMap = {}

	constructors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			const property = baseCtor.prototype[name]
			if (typeof property !== 'function' || derivedCtor.hasOwnProperty(name) || derivedCtor?.protectedMethods.includes(name) || baseCtor.prototype?._protectedMethods?.includes(name)) return

			methods = { ...methods, [name]: property }
		});
	});

	return methods
}
