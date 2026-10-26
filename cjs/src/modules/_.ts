import { GeneratedType } from '@cosmjs/proto-signing-cjs';
import { QueryClient } from '@cosmjs/stargate-cjs';
import { CheqdSigningStargateClient } from '../signer';
import { IContext, IModuleMethodMap, QueryExtensionSetup } from '../types';
import { CheqdQuerier } from '../querier';

/**
 * Abstract base class for all Cheqd SDK modules.
 * Provides common functionality for module initialization, registry types,
 * and querier extensions. All SDK modules must extend this class.
 */
export abstract class AbstractCheqdSDKModule {
	/** Signing client instance for transaction operations */
	_signer: CheqdSigningStargateClient;
	/** Map of methods exposed by this module */
	methods: IModuleMethodMap = {};
	/** Querier instance for blockchain data retrieval */
	querier: CheqdQuerier;
	/** List of method names protected from external access */
	readonly _protectedMethods: string[] = ['constructor', 'getRegistryTypes', 'getQuerierExtensionSetup'];
	/** Static registry types for message encoding/decoding */
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [];
	/** Static querier extension setup function */
	static readonly querierExtensionSetup: QueryExtensionSetup<any> = (base: QueryClient) => ({});

	/**
	 * Constructs a new AbstractCheqdSDKModule instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client for blockchain data retrieval
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
	 * Abstract method to get registry types for message encoding/decoding.
	 * Must be implemented by concrete module classes.
	 *
	 * @returns Iterable of [typeUrl, GeneratedType] pairs for the registry
	 */
	abstract getRegistryTypes(): Iterable<[string, GeneratedType]>;
}

/**
 * Utility type for extracting protected methods from a module class.
 * Ensures type safety when working with protected method arrays.
 */
type ProtectedMethods<T extends AbstractCheqdSDKModule, K extends keyof T> = T[K] extends string[]
	? T[K][number]
	: T[K];

/**
 * Type that creates a minimal importable version of a Cheqd SDK module.
 * Removes internal implementation details while preserving public methods and properties.
 * Used for creating clean interfaces for module consumption.
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
 * Factory function for instantiating Cheqd SDK modules.
 * Creates a new instance of the specified module class with the provided arguments.
 *
 * @template T - Type of the module constructor
 * @param module - Module constructor class
 * @param args - Constructor arguments for the module
 * @returns New instance of the module
 */
export function instantiateCheqdSDKModule<T extends new (...args: any[]) => T>(
	module: T,
	...args: ConstructorParameters<T>
): T {
	return new module(...args);
}

/**
 * Extracts registry types from a module for message encoding/decoding.
 * Safely retrieves the registryTypes static property with fallback to empty array.
 *
 * @param module - Module instance or class to extract registry types from
 * @returns Iterable of [typeUrl, GeneratedType] pairs
 */
export function instantiateCheqdSDKModuleRegistryTypes(module: any): Iterable<[string, GeneratedType]> {
	return module.registryTypes ?? [];
}

/**
 * Extracts querier extension setup from a module.
 * Safely retrieves the querierExtensionSetup static property with fallback to empty object.
 *
 * @param module - Module instance or class to extract querier extension setup from
 * @returns Query extension setup function
 */
export function instantiateCheqdSDKModuleQuerierExtensionSetup(module: any): QueryExtensionSetup<any> {
	return module.querierExtensionSetup ?? {};
}

/**
 * Applies mixin pattern to combine methods from multiple module constructors.
 * Extracts public methods from module prototypes while respecting protected method lists.
 * This enables composition of functionality from multiple modules into a single interface.
 *
 * @param derivedCtor - Target constructor to apply mixins to
 * @param constructors - Array of constructor functions to extract methods from
 * @returns Map of method names to their implementations
 */
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

/**
 * Finds where a module method takes its SDK `context`, by reading the method's own parameter list. Module methods have
 * optional parameters before `context` (and some after it), so appending the context to whatever the caller passed puts
 * it in the wrong parameter whenever optional arguments are left out.
 *
 * @param fn - Module method
 * @returns Index of the parameter named `context`, or -1 if there is none
 */
export function contextParameterIndex(fn: Function): number {
	const source = Function.prototype.toString.call(fn);
	const start = source.indexOf('(');
	if (start < 0) return -1;
	const names: string[] = [];
	let depth = 0;
	let quote: string | null = null;
	let current = '';
	for (let i = start + 1; i < source.length; i++) {
		const char = source[i];
		if (quote) {
			if (char === quote && source[i - 1] !== '\\') quote = null;
			current += char;
			continue;
		}
		if (char === "'" || char === '"' || char === '`') {
			quote = char;
		} else if (char === '(' || char === '[' || char === '{') {
			depth++;
		} else if (char === ')' || char === ']' || char === '}') {
			if (depth === 0) {
				names.push(current);
				break;
			}
			depth--;
		} else if (char === ',' && depth === 0) {
			names.push(current);
			current = '';
			continue;
		}
		current += char;
	}
	return names.map((param) => param.split('=')[0].trim()).indexOf('context');
}

/**
 * Places the SDK context in a method's `context` parameter, padding any optional arguments the caller left out. If the
 * caller already passed a value in that position it is kept. Without a known position the context is appended, as
 * before.
 *
 * @param params - Arguments the caller passed
 * @param contextIndex - Index of the method's `context` parameter, from {@link contextParameterIndex}
 * @param context - SDK context to supply
 * @returns Arguments to call the method with
 */
export function argumentsWithContext(params: unknown[], contextIndex: number, context: IContext): unknown[] {
	if (contextIndex < 0) return [...params, context];
	const args = [...params];
	while (args.length <= contextIndex) args.push(undefined);
	args[contextIndex] = args[contextIndex] ?? context;
	return args;
}
