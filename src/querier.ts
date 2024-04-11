import { QueryClient } from '@cosmjs/stargate';
import { Tendermint34Client, Tendermint37Client } from '@cosmjs/tendermint-rpc';
import { QueryExtensionSetup, CheqdExtensions, CheqdNetwork } from './types';

export class CheqdQuerier extends QueryClient {
	constructor(tmClient: Tendermint37Client | Tendermint34Client) {
		super(tmClient);
	}

	static async connect(url: string, network: CheqdNetwork = CheqdNetwork.Testnet): Promise<CheqdQuerier> {
		const tmClient =
			network === CheqdNetwork.Testnet
				? await Tendermint37Client.connect(url)
				: await Tendermint34Client.connect(url);
		return new CheqdQuerier(tmClient);
	}

	static async fromClient(client: Tendermint34Client | Tendermint37Client): Promise<CheqdQuerier> {
		return new CheqdQuerier(client);
	}

	static async connectWithExtension(
		url: string,
		network: CheqdNetwork,
		extension: QueryExtensionSetup<CheqdExtensions>
	): Promise<CheqdQuerier & CheqdExtensions> {
		const tmClient =
			network === CheqdNetwork.Testnet
				? await Tendermint37Client.connect(url)
				: await Tendermint34Client.connect(url);
		return CheqdQuerier.withExtensions(tmClient, extension);
	}

	static async connectWithExtensions(
		url: string,
		network: CheqdNetwork,
		...extensions: QueryExtensionSetup<CheqdExtensions>[]
	): Promise<CheqdQuerier & CheqdExtensions> {
		if (extensions.length === 1) {
			return CheqdQuerier.connectWithExtension(url, network, extensions[0]);
		}

		const tmClient =
			network === CheqdNetwork.Testnet
				? await Tendermint37Client.connect(url)
				: await Tendermint34Client.connect(url);
		const tupleLike = extensions as [QueryExtensionSetup<CheqdExtensions>, QueryExtensionSetup<CheqdExtensions>];
		return CheqdQuerier.withExtensions(tmClient, ...tupleLike);
	}
}
