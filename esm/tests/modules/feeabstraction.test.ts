import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { faucet, localnet } from '../testutils.test';
import { CheqdQuerier, CheqdSigningStargateClient } from '../../src';
import {
	FeeabstractionExtension,
	FeeabstractionModule,
	setupFeeabstractionExtension,
} from '../../src/modules/feeabstraction';

const defaultAsyncTxTimeout = 30000;

(BigInt.prototype as any).toJSON = function () {
	return this.toString();
};

describe('FeeabstractionModule', () => {
	describe('constructor', () => {
		it('should instantiate standalone module', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				setupFeeabstractionExtension
			)) as CheqdQuerier & FeeabstractionExtension;
			const feeabstractionModule = new FeeabstractionModule(signer, querier);
			expect(feeabstractionModule).toBeInstanceOf(FeeabstractionModule);
		});
	});
});
