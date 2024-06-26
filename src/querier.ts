import { QueryClient } from '@cosmjs/stargate';
import { CometClient, connectComet } from '@cosmjs/tendermint-rpc';
import { QueryExtensionSetup, CheqdExtensions } from './types.js';

export class CheqdQuerier extends QueryClient {
	constructor(tmClient: CometClient) {
		super(tmClient);
	}

	static async connect(url: string): Promise<CheqdQuerier> {
		const tmClient = await connectComet(url);
		return new CheqdQuerier(tmClient);
	}

	static async fromClient(client: CometClient): Promise<CheqdQuerier> {
		return new CheqdQuerier(client);
	}

	static async connectWithExtension(
		url: string,
		extension: QueryExtensionSetup<CheqdExtensions>
	): Promise<CheqdQuerier & CheqdExtensions> {
		const tmClient = await connectComet(url);
		return CheqdQuerier.withExtensions(tmClient, extension);
	}

	static async connectWithExtensions(
		url: string,
		...extensions: QueryExtensionSetup<CheqdExtensions>[]
	): Promise<CheqdQuerier & CheqdExtensions> {
		if (extensions.length === 1) return CheqdQuerier.connectWithExtension(url, extensions[0]);

		const tmClient = await connectComet(url);
		const tupleLike = extensions as [QueryExtensionSetup<CheqdExtensions>, QueryExtensionSetup<CheqdExtensions>];
		return CheqdQuerier.withExtensions(tmClient, ...tupleLike);
	}
}
