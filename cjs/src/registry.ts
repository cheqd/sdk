import { Registry, GeneratedType } from '@cosmjs/proto-signing-cjs';

import { defaultRegistryTypes } from '@cosmjs/stargate-cjs';

/**
 * Creates a default Cheqd registry with optional custom types.
 * The registry is used for encoding and decoding protobuf messages in blockchain transactions.
 * It includes all default Stargate types and any additional custom types provided.
 *
 * @param customTypes - Optional iterable of custom type mappings to add to the registry.
 *                     Each entry should be a tuple of [typeUrl, GeneratedType].
 * @returns A configured Registry instance with default and custom types
 */
export function createDefaultCheqdRegistry(customTypes?: Iterable<[string, GeneratedType]>): Registry {
	if (!customTypes) customTypes = [];
	return new Registry([...defaultRegistryTypes, ...customTypes]);
}

/**
 * Pre-configured Cheqd registry instance with default Stargate types.
 * This is a ready-to-use registry for basic blockchain operations that don't require
 * custom message types. For applications needing custom types, use createDefaultCheqdRegistry instead.
 */
export const CheqdRegistry = new Registry(defaultRegistryTypes);
