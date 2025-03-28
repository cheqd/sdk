import { QueryClient } from '@cosmjs/stargate';
import { CometClient, connectComet, ConsensusParams } from '@cosmjs/tendermint-rpc';
import { QueryExtensionSetup, CheqdExtensions } from './types.js';

export class CheqdQuerier extends QueryClient {
	constructor(cometClient: CometClient) {
		super(cometClient);
	}

	static async getConsensusParameters(url: string): Promise<ConsensusParams | undefined> {
		// connect to comet rpc
		const cometClient = await connectComet(url);

		// get block results
		const result = await cometClient.blockResults();

		// disconnect comet client
		cometClient.disconnect();

		// return consensus parameters
		return result.consensusUpdates;
	}

	static async connect(url: string): Promise<CheqdQuerier> {
		const cometClient = await connectComet(url);
		return new CheqdQuerier(cometClient);
	}

	static async fromClient(client: CometClient): Promise<CheqdQuerier> {
		return new CheqdQuerier(client);
	}

	static async connectWithExtension(
		url: string,
		extension: QueryExtensionSetup<CheqdExtensions>
	): Promise<CheqdQuerier & CheqdExtensions> {
		const cometClient = await connectComet(url);
		return CheqdQuerier.withExtensions(cometClient, extension);
	}

	static async connectWithExtensions(
		url: string,
		...extensions: QueryExtensionSetup<CheqdExtensions>[]
	): Promise<CheqdQuerier & CheqdExtensions> {
		if (extensions.length === 1) return CheqdQuerier.connectWithExtension(url, extensions[0]);

		const cometClient = await connectComet(url);
		const tupleLike = extensions as [
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
		];
		return CheqdQuerier.withExtensions(cometClient, ...tupleLike);
	}
}
