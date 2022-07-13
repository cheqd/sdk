import { AbstractCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"


export class ResourcesModule extends AbstractCheqdSDKModule {
    constructor(signer: CheqdSigningStargateClient) {
        super(signer)
    }
}