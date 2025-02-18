import { DirectSecp256k1HdWallet, GeneratedType } from '@cosmjs/proto-signing-cjs';
import { createCheqdSDK, DIDModule, ICheqdSDKOptions, ResourceModule } from '../src/index';
import { localnet, faucet } from './testutils.test';
import { AbstractCheqdSDKModule } from '../src/modules/_';
import { CheqdSigningStargateClient } from '../src/signer';
import { createDefaultCheqdRegistry } from '../src/registry';
import { CheqdQuerier } from '../src/querier';
import { setupDidExtension, DidExtension, defaultDidExtensionKey } from '../src/modules/did';
import { QueryExtensionSetup } from '../src/types';
import { setupResourceExtension, ResourceExtension, defaultResourceExtensionKey } from '../src/modules/resource';
import {
	FeemarketExtension,
	setupFeemarketExtension,
	FeemarketModule,
	defaultFeemarketExtensionKey,
} from '../src/modules/feemarket';
import { jest } from '@jest/globals';

const defaultAsyncTxTimeout = 30000;

describe('CheqdSDK', () => {
	describe('constructor', () => {
		it(
			'can be instantiated with modules',
			async () => {
				const options = {
					modules: [FeemarketModule as unknown as AbstractCheqdSDKModule],
					rpcUrl: localnet.rpcUrl,
					network: localnet.network,
					wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic),
				} satisfies ICheqdSDKOptions;
				const cheqdSDK = await createCheqdSDK(options);

				const sdkMethods = Object.keys(cheqdSDK.methods);
				const testSigner = await CheqdSigningStargateClient.connectWithSigner(options.rpcUrl, options.wallet);
				const testQuerier = (await CheqdQuerier.connectWithExtension(
					options.rpcUrl,
					setupFeemarketExtension
				)) as CheqdQuerier & FeemarketExtension;
				const moduleMethods = Object.keys(new FeemarketModule(testSigner, testQuerier).methods);

				moduleMethods.forEach((method) => {
					expect(sdkMethods).toContain(method);
				});
			},
			defaultAsyncTxTimeout
		);

		it(
			'should use module methods',
			async () => {
				const rpcUrl = localnet.rpcUrl;
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);

				class TestModule extends AbstractCheqdSDKModule {
					registryTypes: Iterable<[string, GeneratedType]> = [];
					methods = {
						doSomething: this.doSomething.bind(this),
					};
					constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier) {
						super(signer, querier);
					}
					public getRegistryTypes(): Iterable<[string, GeneratedType]> {
						return TestModule.registryTypes;
					}
					public getQuerierExtensionSetup(): QueryExtensionSetup<{}> {
						return () => ({});
					}
					async doSomething(): Promise<string> {
						return 'did something';
					}
				}
				const options = {
					modules: [
						TestModule as unknown as AbstractCheqdSDKModule,
						FeemarketModule as unknown as AbstractCheqdSDKModule,
					],
					rpcUrl,
					wallet,
				} as ICheqdSDKOptions;

				const cheqdSDK = await createCheqdSDK(options);

				//@ts-ignore
				const doSomething = await cheqdSDK.doSomething();
				expect(doSomething).toBe('did something');

				const spy = jest.spyOn(cheqdSDK.methods, 'doSomething');
				//@ts-ignore
				await cheqdSDK.doSomething();
				expect(spy).toHaveBeenCalled();
			},
			defaultAsyncTxTimeout
		);

		it(
			'should instantiate registry from passed modules',
			async () => {
				const options = {
					modules: [FeemarketModule as unknown as AbstractCheqdSDKModule],
					rpcUrl: localnet.rpcUrl,
					wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic),
				} as ICheqdSDKOptions;
				const cheqdSDK = await createCheqdSDK(options);

				const feemarketRegistryTypes = FeemarketModule.registryTypes;
				const cheqdRegistry = createDefaultCheqdRegistry(feemarketRegistryTypes);

				expect(cheqdSDK.signer.registry).toStrictEqual(cheqdRegistry);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should instantiate registry from multiple passed modules',
			async () => {
				const options = {
					modules: [
						DIDModule as unknown as AbstractCheqdSDKModule,
						ResourceModule as unknown as AbstractCheqdSDKModule,
						FeemarketModule as unknown as AbstractCheqdSDKModule,
					],
					rpcUrl: localnet.rpcUrl,
					wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic),
				} as ICheqdSDKOptions;
				const cheqdSDK = await createCheqdSDK(options);

				const didRegistryTypes = DIDModule.registryTypes;
				const resourceRegistryTypes = ResourceModule.registryTypes;
				const feemarketRegistryTypes = FeemarketModule.registryTypes;
				const cheqdRegistry = createDefaultCheqdRegistry([
					...didRegistryTypes,
					...resourceRegistryTypes,
					...feemarketRegistryTypes,
				]);

				expect(cheqdSDK.signer.registry).toStrictEqual(cheqdRegistry);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should instantiate querier extension from passed modules',
			async () => {
				const options = {
					modules: [
						DIDModule as unknown as AbstractCheqdSDKModule,
						FeemarketModule as unknown as AbstractCheqdSDKModule,
					],
					rpcUrl: localnet.rpcUrl,
					network: localnet.network,
					wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic),
				} satisfies ICheqdSDKOptions;
				const cheqdSDK = await createCheqdSDK(options);

				const querier = (await CheqdQuerier.connectWithExtension(
					options.rpcUrl,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;

				// we need to stringify the querier extension because it's a proxy object
				// and the equality check will fail
				expect(JSON.stringify(cheqdSDK.querier[defaultDidExtensionKey])).toStrictEqual(
					JSON.stringify(querier[defaultDidExtensionKey])
				);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should instantiate querier extension from multiple passed modules',
			async () => {
				const options = {
					modules: [
						DIDModule as unknown as AbstractCheqdSDKModule,
						ResourceModule as unknown as AbstractCheqdSDKModule,
						FeemarketModule as unknown as AbstractCheqdSDKModule,
					],
					rpcUrl: localnet.rpcUrl,
					network: localnet.network,
					wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic),
				} satisfies ICheqdSDKOptions;
				const cheqdSDK = await createCheqdSDK(options);

				const didQuerier = (await CheqdQuerier.connectWithExtension(
					options.rpcUrl,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const resourceQuerier = (await CheqdQuerier.connectWithExtension(
					options.rpcUrl,
					setupResourceExtension
				)) as CheqdQuerier & ResourceExtension;
				const feemarketQuerier = (await CheqdQuerier.connectWithExtension(
					options.rpcUrl,
					setupFeemarketExtension
				)) as CheqdQuerier & FeemarketExtension;

				// we need to stringify the querier extension because it's a proxy object
				// and the equality check will fail
				expect(JSON.stringify(cheqdSDK.querier[defaultDidExtensionKey])).toStrictEqual(
					JSON.stringify(didQuerier[defaultDidExtensionKey])
				);
				expect(JSON.stringify(cheqdSDK.querier[defaultResourceExtensionKey])).toStrictEqual(
					JSON.stringify(resourceQuerier[defaultResourceExtensionKey])
				);
				expect(JSON.stringify(cheqdSDK.querier[defaultFeemarketExtensionKey])).toStrictEqual(
					JSON.stringify(feemarketQuerier[defaultFeemarketExtensionKey])
				);
			},
			defaultAsyncTxTimeout
		);
	});
});
