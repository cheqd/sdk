import { jest } from '@jest/globals';
import type { GetNodeInfoResponse } from 'cosmjs-types/cosmos/base/tendermint/v1beta1/query.js';
import { CheqdQuerier } from '../src/querier.js';
import { CheqdNetwork } from '../src/types.js';
import { DeepPartial } from 'cosmjs-types';

const makeNodeInfo = (partial: DeepPartial<GetNodeInfoResponse>): GetNodeInfoResponse => partial as GetNodeInfoResponse;

describe('CheqdQuerier network resolution', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('resolves mainnet from defaultNodeInfo.network', () => {
		const nodeInfo = makeNodeInfo({
			defaultNodeInfo: { network: 'cheqd-mainnet-1' },
		});

		expect(CheqdQuerier.resolveNetworkFromNodeInfo(nodeInfo)).toBe(CheqdNetwork.Mainnet);
	});

	it('resolves testnet from defaultNodeInfo.network', () => {
		const nodeInfo = makeNodeInfo({
			defaultNodeInfo: { network: 'cheqd-testnet-6' },
		});

		expect(CheqdQuerier.resolveNetworkFromNodeInfo(nodeInfo)).toBe(CheqdNetwork.Testnet);
	});

	it('falls back to applicationVersion when network is missing', () => {
		const nodeInfo = makeNodeInfo({
			defaultNodeInfo: undefined,
			applicationVersion: { appName: 'cheqd-mainnet-binary' },
		});

		expect(CheqdQuerier.resolveNetworkFromNodeInfo(nodeInfo)).toBe(CheqdNetwork.Mainnet);
	});

	it('detectNetwork defaults to testnet when resolution fails', async () => {
		const spy = jest.spyOn(CheqdQuerier, 'getNodeInfo').mockResolvedValue(makeNodeInfo({}));
		const network = await CheqdQuerier.detectNetwork('https://rpc.unknown');

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('https://rpc.unknown');
		expect(network).toBe(CheqdNetwork.Testnet);
	});
});
