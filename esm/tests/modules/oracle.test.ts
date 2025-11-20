import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { faucet, localnet } from '../testutils.test';
import { CheqdSigningStargateClient } from '../../src';
import { CheqdQuerier } from '../../src';
import {
	OracleExtension,
	OracleModule,
	setupOracleExtension,
	WMAStrategies,
	WMAStrategy,
} from '../../src/modules/oracle';

const defaultAsyncTxTimeout = 30000;

describe('OracleModule', () => {
	describe('constructor', () => {
		it(
			'should instantiate standalone module',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupOracleExtension
				)) as CheqdQuerier & OracleExtension;
				const oracleModule = new OracleModule(signer, querier);
				expect(oracleModule).toBeInstanceOf(OracleModule);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryEMA', () => {
		it(
			'should query EMA',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupOracleExtension
				)) as CheqdQuerier & OracleExtension;
				const oracleModule = new OracleModule(signer, querier);
				const ema = await oracleModule.queryEMA(OracleModule.baseDenomTickers.CHEQ);

				console.warn(`EMA Price: CHEQ: ${ema.price}`);

				expect(ema).toBeDefined();
				expect(ema.price).toBeDefined();
				expect(Number(ema.price)).toBeGreaterThan(0);

				const emaUSDC = await oracleModule.queryEMA(OracleModule.baseDenomTickers.USDC);

				console.warn(`EMA Price: USDC: ${emaUSDC.price}`);

				expect(emaUSDC).toBeDefined();
				expect(emaUSDC.price).toBeDefined();
				expect(Number(emaUSDC.price)).toBeGreaterThan(0);

				const emaUSDT = await oracleModule.queryEMA(OracleModule.baseDenomTickers.USDT);

				console.warn(`EMA Price: USDT: ${emaUSDT.price}`);

				expect(emaUSDT).toBeDefined();
				expect(emaUSDT.price).toBeDefined();
				expect(Number(emaUSDT.price)).toBeGreaterThan(0);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryWMA', () => {
		it(
			'should query WMA - case: BALANCED strategy',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupOracleExtension
				)) as CheqdQuerier & OracleExtension;
				const oracleModule = new OracleModule(signer, querier);
				const wma = await oracleModule.queryWMA(OracleModule.baseDenomTickers.CHEQ, WMAStrategies.BALANCED);

				console.warn(`WMA Price (BALANCED): CHEQ: ${wma.price}`);

				expect(wma).toBeDefined();
				expect(wma.price).toBeDefined();
				expect(Number(wma.price)).toBeGreaterThan(0);

				const wmaUSDC = await oracleModule.queryWMA(OracleModule.baseDenomTickers.USDC, WMAStrategies.BALANCED);

				console.warn(`WMA Price (BALANCED): USDC: ${wmaUSDC.price}`);

				expect(wmaUSDC).toBeDefined();
				expect(wmaUSDC.price).toBeDefined();
				expect(Number(wmaUSDC.price)).toBeGreaterThan(0);

				const wmaUSDT = await oracleModule.queryWMA(OracleModule.baseDenomTickers.USDT, WMAStrategies.BALANCED);

				console.warn(`WMA Price (BALANCED): USDT: ${wmaUSDT.price}`);

				expect(wmaUSDT).toBeDefined();
				expect(wmaUSDT.price).toBeDefined();
				expect(Number(wmaUSDT.price)).toBeGreaterThan(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query WMA - case: RECENT strategy',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupOracleExtension
				)) as CheqdQuerier & OracleExtension;
				const oracleModule = new OracleModule(signer, querier);
				const wma = await oracleModule.queryWMA(OracleModule.baseDenomTickers.CHEQ, WMAStrategies.RECENT);

				console.warn(`WMA Price (RECENT): CHEQ: ${wma.price}`);

				expect(wma).toBeDefined();
				expect(wma.price).toBeDefined();
				expect(Number(wma.price)).toBeGreaterThan(0);

				const wmaUSDC = await oracleModule.queryWMA(OracleModule.baseDenomTickers.USDC, WMAStrategies.RECENT);

				console.warn(`WMA Price (RECENT): USDC: ${wmaUSDC.price}`);

				expect(wmaUSDC).toBeDefined();
				expect(wmaUSDC.price).toBeDefined();
				expect(Number(wmaUSDC.price)).toBeGreaterThan(0);

				const wmaUSDT = await oracleModule.queryWMA(OracleModule.baseDenomTickers.USDT, WMAStrategies.RECENT);

				console.warn(`WMA Price (RECENT): USDT: ${wmaUSDT.price}`);

				expect(wmaUSDT).toBeDefined();
				expect(wmaUSDT.price).toBeDefined();
				expect(Number(wmaUSDT.price)).toBeGreaterThan(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query WMA - case: OLDEST strategy',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupOracleExtension
				)) as CheqdQuerier & OracleExtension;
				const oracleModule = new OracleModule(signer, querier);
				const wma = await oracleModule.queryWMA(OracleModule.baseDenomTickers.CHEQ, WMAStrategies.OLDEST);

				console.warn(`WMA Price (OLDEST): CHEQ: ${wma.price}`);

				expect(wma).toBeDefined();
				expect(wma.price).toBeDefined();
				expect(Number(wma.price)).toBeGreaterThan(0);

				const wmaUSDC = await oracleModule.queryWMA(OracleModule.baseDenomTickers.USDC, WMAStrategies.OLDEST);

				console.warn(`WMA Price (OLDEST): USDC: ${wmaUSDC.price}`);

				expect(wmaUSDC).toBeDefined();
				expect(wmaUSDC.price).toBeDefined();
				expect(Number(wmaUSDC.price)).toBeGreaterThan(0);

				const wmaUSDT = await oracleModule.queryWMA(OracleModule.baseDenomTickers.USDT, WMAStrategies.OLDEST);

				console.warn(`WMA Price (OLDEST): USDT: ${wmaUSDT.price}`);

				expect(wmaUSDT).toBeDefined();
				expect(wmaUSDT.price).toBeDefined();
				expect(Number(wmaUSDT.price)).toBeGreaterThan(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query WMA - case: CUSTOM strategy',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupOracleExtension
				)) as CheqdQuerier & OracleExtension;
				const oracleModule = new OracleModule(signer, querier);
				const customWeights: number[] = [1, 2, 3];
				const wma = await oracleModule.queryWMA(
					OracleModule.baseDenomTickers.CHEQ,
					WMAStrategies.CUSTOM,
					customWeights
				);

				console.warn(`WMA Price (CUSTOM): CHEQ: ${wma.price}`);

				expect(wma).toBeDefined();
				expect(wma.price).toBeDefined();
				expect(Number(wma.price)).toBeGreaterThan(0);

				const wmaUSDC = await oracleModule.queryWMA(
					OracleModule.baseDenomTickers.USDC,
					WMAStrategies.CUSTOM,
					customWeights
				);

				console.warn(`WMA Price (CUSTOM): USDC: ${wmaUSDC.price}`);

				expect(wmaUSDC).toBeDefined();
				expect(wmaUSDC.price).toBeDefined();
				expect(Number(wmaUSDC.price)).toBeGreaterThan(0);

				const wmaUSDT = await oracleModule.queryWMA(
					OracleModule.baseDenomTickers.USDT,
					WMAStrategies.CUSTOM,
					customWeights
				);

				console.warn(`WMA Price (CUSTOM): USDT: ${wmaUSDT.price}`);

				expect(wmaUSDT).toBeDefined();
				expect(wmaUSDT.price).toBeDefined();
				expect(Number(wmaUSDT.price)).toBeGreaterThan(0);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('querySMA', () => {
		it('should query SMA', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				setupOracleExtension
			)) as CheqdQuerier & OracleExtension;
			const oracleModule = new OracleModule(signer, querier);
			const sma = await oracleModule.querySMA(OracleModule.baseDenomTickers.CHEQ);

			console.warn(`SMA Price: CHEQ: ${sma.price}`);

			expect(sma).toBeDefined();
			expect(sma.price).toBeDefined();
			expect(Number(sma.price)).toBeGreaterThan(0);

			const smaUSDC = await oracleModule.querySMA(OracleModule.baseDenomTickers.USDC);

			console.warn(`SMA Price: USDC: ${smaUSDC.price}`);

			expect(smaUSDC).toBeDefined();
			expect(smaUSDC.price).toBeDefined();
			expect(Number(smaUSDC.price)).toBeGreaterThan(0);

			const smaUSDT = await oracleModule.querySMA(OracleModule.baseDenomTickers.USDT);

			console.warn(`SMA Price: USDT: ${smaUSDT.price}`);

			expect(smaUSDT).toBeDefined();
			expect(smaUSDT.price).toBeDefined();
			expect(Number(smaUSDT.price)).toBeGreaterThan(0);
		});
	});
});
