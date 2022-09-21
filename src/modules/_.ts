import { GeneratedType, Registry } from "@cosmjs/proto-signing"
import { QueryClient } from "@cosmjs/stargate"
import { CheqdSigningStargateClient } from '../signer'
import { IModuleMethodMap } from "../types"
import { DidExtension, DIDModule, setupDidExtension } from './did'
import { ResourcesExtension, setupResourcesExtension } from "./resource"

export abstract class AbstractCheqdSDKModule {
	_signer: CheqdSigningStargateClient
	_querier: QueryClient & CheqdExtensions | undefined
	methods: IModuleMethodMap = {}
	readonly _protectedMethods: string[] = ['constructor', 'getRegistryTypes']
	static readonly registryTypes: Iterable<[string, GeneratedType]> = []

	constructor(signer: CheqdSigningStargateClient) {
		if (!signer) {
			throw new Error("signer is required")
		}
		this._signer = signer
	}

    abstract getRegistryTypes(): Iterable<[string, GeneratedType]>
}

type ProtectedMethods<T extends AbstractCheqdSDKModule, K extends keyof T> = T[K] extends string[] ? T[K][number] : T[K]

export type MinimalImportableCheqdSDKModule<T extends AbstractCheqdSDKModule> = Omit<T, '_signer' | '_querier' | '_protectedMethods' | 'registryTypes' | 'getRegistryTypes'>

export function instantiateCheqdSDKModule<T extends new (...args: any[]) => T>(module: T, ...args: ConstructorParameters<T>): T {
	return new module(...args)
}

export function instantiateCheqdSDKModuleRegistryTypes(module: any): Iterable<[string, GeneratedType]> {
    return module.registryTypes ?? []
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

export type CheqdExtension<K extends string, V = any> = {
	[P in K]: (Record<P, V> & Partial<Record<Exclude<K, P>, never>>) extends infer O
	? { [Q in keyof O]: O[Q] }
	: never
}[K]

export type CheqdExtensions = DidExtension & ResourcesExtension

export const setupCheqdExtensions = (base: QueryClient): CheqdExtensions => {
	return {
		...setupDidExtension(base),
		...setupResourcesExtension(base)
	}
}
