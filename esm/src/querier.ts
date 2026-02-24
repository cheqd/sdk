import { QueryClient, createProtobufRpcClient } from '@cosmjs/stargate';
import { CometClient, connectComet, ConsensusParams } from '@cosmjs/tendermint-rpc';
import { QueryExtensionSetup, CheqdExtensions } from './types.js';
import { ServiceClientImpl, type GetNodeInfoResponse } from 'cosmjs-types/cosmos/base/tendermint/v1beta1/query.js';
import { CheqdNetwork } from './types.js';

/**
 * Extended QueryClient specifically designed for the Cheqd blockchain network.
 * Provides enhanced querying capabilities with support for custom extensions
 * and consensus parameter retrieval.
 */
export class CheqdQuerier extends QueryClient {
	/**
	 * Constructs a new CheqdQuerier instance with the provided Comet client.
	 *
	 * @param cometClient - Comet client for blockchain communication
	 */
	constructor(cometClient: CometClient) {
		super(cometClient);
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
		const cometClient = await connectComet(url);

		// get block results
		const result = await cometClient.blockResults();

		// disconnect comet client
		cometClient.disconnect();

		// return consensus parameters
		return result.consensusUpdates;
	}

	/**
	 * Queries the node information over RPC to retrieve binary (application) version details.
	 * Uses the Cosmos base tendermint service which returns both application and consensus versions.
	 *
	 * @param url - RPC URL of the blockchain node
	 * @returns Promise resolving to GetNodeInfoResponse containing version info
	 */
	static async getNodeInfo(url: string): Promise<GetNodeInfoResponse> {
		const cometClient = await connectComet(url);
		try {
			const baseQuerier = new QueryClient(cometClient);
			const rpcClient = createProtobufRpcClient(baseQuerier);
			const tendermintService = new ServiceClientImpl(rpcClient);

			return await tendermintService.GetNodeInfo({});
		} finally {
			cometClient.disconnect();
		}
	}

	/**
	 * Uses the active connection to retrieve node info without creating a new client.
	 * @returns Promise resolving to GetNodeInfoResponse containing version info
	 */
	/* async getNodeInfo(): Promise<GetNodeInfoResponse> {
		const rpcClient = createProtobufRpcClient(this);
		const tendermintService = new ServiceClientImpl(rpcClient);
		return tendermintService.GetNodeInfo({});
	} */

	/**
	 * Resolves the Cheqd network (mainnet/testnet) from the node info response.
	 * @param nodeInfo - Node info response to inspect
	 * @returns Detected network or undefined if it cannot be inferred
	 */
	static resolveNetworkFromNodeInfo(nodeInfo: GetNodeInfoResponse): CheqdNetwork | undefined {
		const chainId =
			nodeInfo.defaultNodeInfo?.network ||
			nodeInfo.applicationVersion?.appName ||
			nodeInfo.applicationVersion?.name ||
			nodeInfo.applicationVersion?.version;
		if (!chainId) return undefined;

		const chainIdLower = chainId.toLowerCase();
		if (chainIdLower.includes(CheqdNetwork.Mainnet)) {
			return CheqdNetwork.Mainnet;
		}
		if (chainIdLower.includes(CheqdNetwork.Testnet)) {
			return CheqdNetwork.Testnet;
		}
		return undefined;
	}

	/**
	 * Detects the network (mainnet/testnet) by querying the node info over RPC.
	 * @param url - RPC URL of the blockchain node
	 * @returns Resolved CheqdNetwork value
	 */
	static async detectNetwork(url: string): Promise<CheqdNetwork> {
		const nodeInfo = await CheqdQuerier.getNodeInfo(url);
		return CheqdQuerier.resolveNetworkFromNodeInfo(nodeInfo) ?? CheqdNetwork.Testnet;
	}

	/**
	 * Detects the network using the existing querier connection.
	 * @returns Resolved CheqdNetwork value
	 */
	/* async detectNetwork(): Promise<CheqdNetwork> {
		const nodeInfo = await this.getNodeInfo();
		return CheqdQuerier.resolveNetworkFromNodeInfo(nodeInfo) ?? CheqdNetwork.Testnet;
	} */

	/**
	 * Creates a new CheqdQuerier instance by establishing a connection to the specified RPC URL.
	 * This is the primary method for creating a querier instance for blockchain communication.
	 *
	 * @param url - RPC URL of the blockchain node to connect to
	 * @returns Promise resolving to a connected CheqdQuerier instance
	 */
	static async connect(url: string): Promise<CheqdQuerier> {
		const cometClient = await connectComet(url);
		return new CheqdQuerier(cometClient);
	}

	/**
	 * Creates a CheqdQuerier instance from an existing Comet client.
	 * Useful when you already have an established client connection.
	 *
	 * @param client - Existing Comet client
	 * @returns Promise resolving to a CheqdQuerier instance using the provided client
	 */
	static async fromClient(client: CometClient): Promise<CheqdQuerier> {
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
	static async connectWithExtension<E extends CheqdExtensions>(
		url: string,
		extension: QueryExtensionSetup<E>
	): Promise<CheqdQuerier & E> {
		const cometClient = await connectComet(url);
		return CheqdQuerier.withExtensions(cometClient, extension);
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
		if (extensions.length === 1) return CheqdQuerier.connectWithExtension(url, extensions[0]);

		const cometClient = await connectComet(url);
		const tupleLike = extensions as [
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
			QueryExtensionSetup<CheqdExtensions>,
		];
		return CheqdQuerier.withExtensions(cometClient, ...tupleLike);
	}
}
