import { jest } from '@jest/globals';
import type { GetNodeInfoResponse } from 'cosmjs-types-cjs/cosmos/base/tendermint/v1beta1/query';
import { CheqdQuerier } from '../src/querier';
import { CheqdNetwork } from '../src/types';

const makeNodeInfo = (partial: Partial<GetNodeInfoResponse>): GetNodeInfoResponse =>
	partial as unknown as GetNodeInfoResponse;

describe('CheqdQuerier network resolution (cjs)', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('resolves mainnet from defaultNodeInfo.network', () => {
		const nodeInfo = makeNodeInfo({
			defaultNodeInfo: { network: 'cheqd-mainnet-1' } as any,
		});

		expect(CheqdQuerier.resolveNetworkFromNodeInfo(nodeInfo)).toBe(CheqdNetwork.Mainnet);
	});

	it('resolves testnet from defaultNodeInfo.network', () => {
		const nodeInfo = makeNodeInfo({
			defaultNodeInfo: { network: 'cheqd-testnet-6' } as any,
		});

		expect(CheqdQuerier.resolveNetworkFromNodeInfo(nodeInfo)).toBe(CheqdNetwork.Testnet);
	});

	it('falls back to applicationVersion when network is missing', () => {
		const nodeInfo = makeNodeInfo({
			defaultNodeInfo: undefined,
			applicationVersion: { appName: 'cheqd-mainnet-binary' } as any,
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
