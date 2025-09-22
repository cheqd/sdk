import { GeneratedType } from '@cosmjs/proto-signing';
import { QueryClient } from '@cosmjs/stargate';
import { CheqdSigningStargateClient } from '../signer.js';
import { IModuleMethodMap, QueryExtensionSetup } from '../types.js';
import { CheqdQuerier } from '../querier.js';

/**
 * Abstract base class for all Cheqd SDK modules.
 * Provides common functionality and enforces implementation of required methods.
 */
export abstract class AbstractCheqdSDKModule {
	/** Signing client for blockchain transactions */
	_signer: CheqdSigningStargateClient;
	/** Module methods registry */
	methods: IModuleMethodMap = {};
	/** Querier client for data retrieval */
	querier: CheqdQuerier;
	/** List of methods that should not be exposed externally */
	readonly _protectedMethods: string[] = ['constructor', 'getRegistryTypes', 'getQuerierExtensionSetup'];
	/** Static registry of protobuf message types */
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [];
	/** Static querier extension setup function */
	static readonly querierExtensionSetup: QueryExtensionSetup<any> = (base: QueryClient) => ({});

	/**
	 * Creates a new SDK module instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client for data retrieval
	 * @throws Error if signer or querier is not provided
	 */
	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier) {
		if (!signer) {
			throw new Error('signer is required');
		}
		if (!querier) {
			throw new Error('querier is required');
		}
		this._signer = signer;
		this.querier = querier;
	}

	/**
	 * Gets the registry types for message encoding/decoding.
	 * Must be implemented by each module to provide its specific message types.
	 *
	 * @returns Iterable of [typeUrl, GeneratedType] pairs for the registry
	 */
	abstract getRegistryTypes(): Iterable<[string, GeneratedType]>;
}

/** Utility type for extracting protected method names from modules */

/** Utility type for extracting protected method names from modules */
type ProtectedMethods<T extends AbstractCheqdSDKModule, K extends keyof T> = T[K] extends string[]
	? T[K][number]
	: T[K];

/**
 * Minimal importable interface for SDK modules.
 * Excludes internal implementation details and protected methods for clean external APIs.
 */
export type MinimalImportableCheqdSDKModule<T extends AbstractCheqdSDKModule> = Omit<
	T,
	| '_signer'
	| '_protectedMethods'
	| 'registryTypes'
	| 'querierExtensionSetup'
	| 'getRegistryTypes'
	| 'getQuerierExtensionSetup'
>;

/**
 * Creates a new instance of a Cheqd SDK module.
 * Generic factory function for instantiating any module type.
 *
 * @param module - Module constructor class
 * @param args - Constructor arguments for the module
 * @returns New instance of the specified module
 */
export function instantiateCheqdSDKModule<T extends new (...args: any[]) => T>(
	module: T,
	...args: ConstructorParameters<T>
): T {
	return new module(...args);
}

/**
 * Extracts registry types from a module instance.
 * Safely retrieves protobuf message types with fallback to empty array.
 *
 * @param module - Module instance to extract registry types from
 * @returns Iterable of [typeUrl, GeneratedType] pairs for protobuf messages
 */

export function instantiateCheqdSDKModuleRegistryTypes(module: any): Iterable<[string, GeneratedType]> {
	return module.registryTypes ?? [];
}

export function instantiateCheqdSDKModuleQuerierExtensionSetup(module: any): QueryExtensionSetup<any> {
	return module.querierExtensionSetup ?? {};
}

export function applyMixins(derivedCtor: any, constructors: any[]): IModuleMethodMap {
	let methods: IModuleMethodMap = {};

	constructors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			const property = baseCtor.prototype[name];
			if (
				typeof property !== 'function' ||
				derivedCtor.hasOwnProperty(name) ||
				derivedCtor?.protectedMethods.includes(name) ||
				baseCtor.prototype?._protectedMethods?.includes(name)
			)
				return;

			methods = { ...methods, [name]: property };
		});
	});

	return methods;
}
