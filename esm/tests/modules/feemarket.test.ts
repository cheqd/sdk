import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { faucet, localnet } from '../testutils.test';
import { CheqdQuerier, CheqdSigningStargateClient, DIDModule } from '../../src';
import { FeemarketExtension, FeemarketModule, setupFeemarketExtension } from '../../src/modules/feemarket';

const defaultAsyncTxTimeout = 30000;

(BigInt.prototype as any).toJSON = function () {
	return this.toString();
};

describe('FeemarketModule', () => {
	describe('constructor', () => {
		it('should instantiate standalone module', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				setupFeemarketExtension
			)) as CheqdQuerier & FeemarketExtension;
			const feemarketModule = new FeemarketModule(signer, querier);
			expect(feemarketModule).toBeInstanceOf(FeemarketModule);
		});
	});

	describe('queryGasPrice', () => {
		it('should query gas price', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				setupFeemarketExtension
			)) as CheqdQuerier & FeemarketExtension;
			const feemarketModule = new FeemarketModule(signer, querier);
			const gasPrice = await feemarketModule.queryGasPrice('ncheq');

			expect(gasPrice).toBeDefined();
			expect(gasPrice.price).toBeDefined();
			expect(gasPrice.price!.denom).toEqual(DIDModule.baseMinimalDenom);
			expect(Number(gasPrice.price!.amount)).toBeGreaterThan(0);
		});
	});
});
