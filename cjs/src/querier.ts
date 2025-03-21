import { QueryClient } from '@cosmjs/stargate-cjs';
import { Tendermint34Client, Tendermint37Client } from '@cosmjs/tendermint-rpc-cjs';
import { QueryExtensionSetup, CheqdExtensions } from './types';

export class CheqdQuerier extends QueryClient {
	constructor(tmClient: Tendermint37Client | Tendermint34Client) {
		super(tmClient);
	}

	static async connect(url: string): Promise<CheqdQuerier> {
		const tmClient = await Tendermint37Client.connect(url);
		return new CheqdQuerier(tmClient);
	}

	static async fromClient(client: Tendermint34Client | Tendermint37Client): Promise<CheqdQuerier> {
		return new CheqdQuerier(client);
	}

	static async connectWithExtension(
		url: string,
		extension: QueryExtensionSetup<CheqdExtensions>
	): Promise<CheqdQuerier & CheqdExtensions> {
		const tmClient = await Tendermint37Client.connect(url);
		return CheqdQuerier.withExtensions(tmClient, extension);
	}

	static async connectWithExtensions(
		url: string,
		...extensions: QueryExtensionSetup<CheqdExtensions>[]
	): Promise<CheqdQuerier & CheqdExtensions> {
		if (extensions.length === 1) {
			return CheqdQuerier.connectWithExtension(url, extensions[0]);
		}

		const tmClient = await Tendermint37Client.connect(url);
		const tupleLike = extensions as [
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
		];
		return CheqdQuerier.withExtensions(tmClient, ...tupleLike);
	}
}
