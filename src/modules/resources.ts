import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { GeneratedType } from "@cosmjs/proto-signing"


export class ResourcesModule extends AbstractCheqdSDKModule {
	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
	}

	registryTypes = (): Iterable<[string, GeneratedType]> => {
		return []
	}
}

export type MinimalImportableResourcesModule = MinimalImportableCheqdSDKModule<ResourcesModule>
