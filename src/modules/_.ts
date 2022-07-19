import { GeneratedType, Registry } from "@cosmjs/proto-signing"
import { QueryClient } from "@cosmjs/stargate"
import { CheqdSigningStargateClient } from '../signer'
import { IModuleMethodMap } from "../types"
import { setupDidExtension } from './did'

export abstract class AbstractCheqdSDKModule {
	_signer: CheqdSigningStargateClient
	methods: IModuleMethodMap = {}
	readonly _protectedMethods: string[] = ['constructor', 'exportMethods', 'registryTypes']

	constructor(signer: CheqdSigningStargateClient) {
		if (!signer) {
			throw new Error("signer is required")
		}
		this._signer = signer
	}

	public registryTypes(): Iterable<[string, GeneratedType]> {
		return []
	}
}

export type MinimalImportableCheqdSDKModule<T extends AbstractCheqdSDKModule> = Omit<T, '_signer' | '_protectedMethods'>

export function instantiateCheqdSDKModule<T extends new (...args: any[]) => T>(module: T, ...args: ConstructorParameters<T>): T {
	return new module(...args)
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

export type CheqdExtensions = CheqdExtension<'did' | 'resources', any>

export const setupCheqdExtensions = (base: QueryClient): CheqdExtensions => {
	return {
		...setupDidExtension(base),
		/** setupResourcesExtension(base) */
	}
}
