import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { faucet, getEventByType, getEventByTypeAndAttributeKey, localnet } from '../testutils.test';
import { CheqdQuerier, CheqdSigningStargateClient, DIDModule } from '../../src';
import { FeemarketExtension, FeemarketModule, setupFeemarketExtension } from '../../src/modules/feemarket';

const defaultAsyncTxTimeout = 30000;

(BigInt.prototype as any).toJSON = function () {
	return this.toString();
};

describe('FeemarketModule', () => {
	describe('constructor', () => {
		it(
			'should instantiate standalone module',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupFeemarketExtension
				)) as CheqdQuerier & FeemarketExtension;
				const feemarketModule = new FeemarketModule(signer, querier);
				expect(feemarketModule).toBeInstanceOf(FeemarketModule);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryGasPrice', () => {
		it(
			'should query gas price',
			async () => {
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
			},
			defaultAsyncTxTimeout
		);

		it(
			'should burn fees, if applicable',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: 'cheqd' });
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupFeemarketExtension
				)) as CheqdQuerier & FeemarketExtension;
				const feemarketModule = new FeemarketModule(signer, querier);
				const gasPrice = await feemarketModule.generateGasPrice(DIDModule.baseMinimalDenom);
				const coins = [{ denom: 'ncheq', amount: '100000' }];
				const fees = FeemarketModule.generateFeesFromGasPrice(gasPrice, faucet.address);

				const transferTxResponse = await signer.sendTokens(
					faucet.address,
					faucet.address,
					coins,
					fees,
					'burn fees test'
				);

				console.warn('feemarket: events:', JSON.stringify(transferTxResponse.events, null, 2));

				console.warn('feemarket: raw log:', JSON.stringify(transferTxResponse.rawLog, null, 2));

				expect(transferTxResponse).toBeDefined();
				expect(transferTxResponse.code).toBe(0);
				expect(
					getEventByTypeAndAttributeKey(
						transferTxResponse.events,
						'transfer',
						'recipient',
						FeemarketModule.feeCollectorAddress
					)
				).toBeDefined();

				const feePayEvent = getEventByType(transferTxResponse.events, 'fee_pay');

				expect(feePayEvent).toBeDefined();
			},
			defaultAsyncTxTimeout
		);
	});
});
