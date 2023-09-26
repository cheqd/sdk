import { Registry, GeneratedType } from '@cosmjs/proto-signing';

import { defaultRegistryTypes } from '@cosmjs/stargate';

export function createDefaultCheqdRegistry(customTypes?: Iterable<[string, GeneratedType]>): Registry {
	if (!customTypes) customTypes = [];
	return new Registry([...defaultRegistryTypes, ...customTypes]);
}

export const CheqdRegistry = new Registry(defaultRegistryTypes);
