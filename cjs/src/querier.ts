import { QueryClient } from '@cosmjs/stargate-cjs';
import { Tendermint34Client, Tendermint37Client, ConsensusParams } from '@cosmjs/tendermint-rpc-cjs';
import { QueryExtensionSetup, CheqdExtensions } from './types';

/**
 * Extended QueryClient specifically designed for the Cheqd blockchain network.
 * Provides enhanced querying capabilities with support for custom extensions
 * and consensus parameter retrieval.
 */
export class CheqdQuerier extends QueryClient {
	/**
	 * Constructs a new CheqdQuerier instance with the provided Tendermint client.
	 *
	 * @param tmClient - Tendermint client (v34 or v37) for blockchain communication
	 */
	constructor(tmClient: Tendermint37Client | Tendermint34Client) {
		super(tmClient);
	}

	/**
	 * Retrieves the consensus parameters from the blockchain network.
	 * This method creates a temporary connection to fetch the latest block results
	 * and extract consensus update information.
	 *
	 * @param url - RPC URL of the blockchain node
	 * @returns Promise resolving to consensus parameters or undefined if not available
	 */
	static async getConsensusParameters(url: string): Promise<ConsensusParams | undefined> {
		// connect to comet rpc
		const cometClient = await Tendermint37Client.connect(url);

		// get block results
		const result = await cometClient.blockResults();

		// disconnect comet client
		cometClient.disconnect();

		// return consensus parameters
		return result.consensusUpdates;
	}

	/**
	 * Creates a new CheqdQuerier instance by establishing a connection to the specified RPC URL.
	 * This is the primary method for creating a querier instance for blockchain communication.
	 *
	 * @param url - RPC URL of the blockchain node to connect to
	 * @returns Promise resolving to a connected CheqdQuerier instance
	 */
	static async connect(url: string): Promise<CheqdQuerier> {
		const tmClient = await Tendermint37Client.connect(url);
		return new CheqdQuerier(tmClient);
	}

	/**
	 * Creates a CheqdQuerier instance from an existing Tendermint client.
	 * Useful when you already have an established client connection.
	 *
	 * @param client - Existing Tendermint client (v34 or v37)
	 * @returns Promise resolving to a CheqdQuerier instance using the provided client
	 */
	static async fromClient(client: Tendermint34Client | Tendermint37Client): Promise<CheqdQuerier> {
		return new CheqdQuerier(client);
	}

	/**
	 * Creates a CheqdQuerier instance with a single query extension.
	 * Extensions provide specialized query capabilities for specific blockchain modules.
	 *
	 * @param url - RPC URL of the blockchain node to connect to
	 * @param extension - Query extension setup to add specialized query functionality
	 * @returns Promise resolving to a CheqdQuerier instance with the specified extension
	 */
	static async connectWithExtension(
		url: string,
		extension: QueryExtensionSetup<CheqdExtensions>
	): Promise<CheqdQuerier & CheqdExtensions> {
		const tmClient = await Tendermint37Client.connect(url);
		return CheqdQuerier.withExtensions(tmClient, extension);
	}

	/**
	 * Creates a CheqdQuerier instance with multiple query extensions.
	 * This method supports adding multiple specialized query capabilities for different
	 * blockchain modules in a single operation. For single extensions, it delegates
	 * to connectWithExtension for efficiency.
	 *
	 * @param url - RPC URL of the blockchain node to connect to
	 * @param extensions - Variable number of query extension setups to add functionality
	 * @returns Promise resolving to a CheqdQuerier instance with all specified extensions
	 */
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
