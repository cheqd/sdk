import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { GeneratedType } from "@cosmjs/proto-signing"


export class ResourcesModule extends AbstractCheqdSDKModule {
	registryTypes: Iterable<[string, GeneratedType]> = []

	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return []
	}
}

export type MinimalImportableResourcesModule = MinimalImportableCheqdSDKModule<ResourcesModule>
