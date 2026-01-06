import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { fromString, toString } from 'uint8arrays';
import { DIDModule, ResourceModule } from '../../src';
import { createDefaultCheqdRegistry } from '../../src/registry';
import { CheqdSigningStargateClient } from '../../src/signer';
import {
	ISignInputs,
	MethodSpecificIdAlgo,
	QueryExtensionSetup,
	VerificationMethods,
	CheqdExtensions,
	CheqdNetwork,
	IContext,
} from '../../src/types';
import {
	createDidPayload,
	createDidVerificationMethod,
	createKeyPairBase64,
	createVerificationKeys,
} from '../../src/utils';
import {
	localnet,
	faucet,
	image_content,
	default_content,
	json_content,
	containsAllButOmittedFields,
} from '../testutils.test';
import { AlternativeUri, Metadata, MsgCreateResourcePayload } from '@cheqd/ts-proto/cheqd/resource/v2';
import { v4 } from 'uuid';
import { CheqdQuerier } from '../../src/querier';
import { setupResourceExtension, ResourceExtension, defaultResourceExtensionKey } from '../../src/modules/resource';
import { DidExtension, setupDidExtension } from '../../src/modules/did';
import { sha256 } from '@cosmjs/crypto';
import {
	defaultOracleExtensionKey,
	MovingAverage,
	MovingAverages,
	OracleExtension,
	setupOracleExtension,
	WMAStrategies,
	WMAStrategy,
} from '../../src/modules/oracle';

const defaultAsyncTxTimeout = 30000;

(BigInt.prototype as any).toJSON = function () {
	return this.toString();
};

describe('ResourceModule', () => {
	describe('constructor', () => {
		it('should instantiate standalone module', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtensions(
				localnet.rpcUrl,
				setupResourceExtension,
				setupOracleExtension
			)) as CheqdQuerier & ResourceExtension & OracleExtension;
			const resourceModule = new ResourceModule(signer, querier);
			expect(resourceModule).toBeInstanceOf(ResourceModule);
		});
	});

	describe('createLinkedResourceTx', () => {
		it(
			'should create a new Resource - case: json',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: didPayload.id.split(':').reverse()[0],
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceJson = await resourceModule.generateCreateResourceJsonFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should create a new Resource - case: image',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: didPayload.id.split(':').reverse()[0],
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: fromString(image_content, 'base64'),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceImage = await resourceModule.generateCreateResourceImageFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceImage
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should create a new Resource - case: default',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: didPayload.id.split(':').reverse()[0],
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(default_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceDefault = await resourceModule.generateCreateResourceDefaultFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceDefault
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it('should generate dynamic fees transacting on testnet - case: json', async () => {
			const feeRange = {
				denom: ResourceModule.baseUsdDenom,
				minAmount: '400000000000000000',
				maxAmount: '400000000000000000',
			};
			const paramsResponse = {
				params: {
					json: [feeRange],
				},
			};

			let paramsCallCount = 0;
			const params = async () => {
				paramsCallCount += 1;
				return paramsResponse;
			};

			let convertArgs: unknown[] | undefined;
			const convertUSDtoCHEQ = async (
				usdAmount: string,
				movingAverage: MovingAverage,
				wmaStrategy?: WMAStrategy,
				weights?: bigint[]
			) => {
				convertArgs = [usdAmount, movingAverage, wmaStrategy, weights];
				return { amount: '50000000000ncheq' };
			};

			const mockQuerier = {
				[defaultResourceExtensionKey]: { params },
				[defaultOracleExtensionKey]: { convertUSDtoCHEQ },
			} as unknown as CheqdQuerier & ResourceExtension & OracleExtension;

			const resourceModule = new ResourceModule({} as CheqdSigningStargateClient, mockQuerier);
			const fee = await resourceModule.generateCreateResourceJsonFees(faucet.address, undefined, {
				slippageBps: 100,
			});

			expect(paramsCallCount).toBe(1);
			expect(convertArgs).toEqual([feeRange.minAmount, MovingAverages.WMA, WMAStrategies.BALANCED, undefined]);

			expect(fee.amount).toEqual([{ amount: '50500000000', denom: 'ncheq' }]);
			expect(fee.gas).toBe(ResourceModule.gasLimits.CreateLinkedResourceJsonGasLimit);
			expect(fee.payer).toBe(faucet.address);
			expect(fee.amount[0].amount).not.toBe(ResourceModule.fees.DefaultCreateResourceJsonFee.amount);
		});

		it('should generate dynamic fees transacting on testnet - case: image', async () => {
			const feeRange = {
				denom: ResourceModule.baseUsdDenom,
				minAmount: '100000000000000000',
				maxAmount: '100000000000000000',
			};
			const paramsResponse = {
				params: {
					image: [feeRange],
				},
			};

			let paramsCallCount = 0;
			const params = async () => {
				paramsCallCount += 1;
				return paramsResponse;
			};

			let convertArgs: unknown[] | undefined;
			const convertUSDtoCHEQ = async (
				usdAmount: string,
				movingAverage: MovingAverage,
				wmaStrategy?: WMAStrategy,
				weights?: bigint[]
			) => {
				convertArgs = [usdAmount, movingAverage, wmaStrategy, weights];
				return { amount: '20000000000ncheq' };
			};

			const mockQuerier = {
				[defaultResourceExtensionKey]: { params },
				[defaultOracleExtensionKey]: { convertUSDtoCHEQ },
			} as unknown as CheqdQuerier & ResourceExtension & OracleExtension;

			const resourceModule = new ResourceModule({} as CheqdSigningStargateClient, mockQuerier);
			const fee = await resourceModule.generateCreateResourceImageFees(faucet.address, undefined, {
				slippageBps: 100,
			});

			expect(paramsCallCount).toBe(1);
			expect(convertArgs).toEqual([feeRange.minAmount, MovingAverages.WMA, WMAStrategies.BALANCED, undefined]);

			expect(fee.amount).toEqual([{ amount: '20200000000', denom: 'ncheq' }]);
			expect(fee.gas).toBe(ResourceModule.gasLimits.CreateLinkedResourceImageGasLimit);
			expect(fee.payer).toBe(faucet.address);
			expect(fee.amount[0].amount).not.toBe(ResourceModule.fees.DefaultCreateResourceImageFee.amount);
		});

		it('should generate dynamic fees transacting on testnet - case: default', async () => {
			const feeRange = {
				denom: ResourceModule.baseUsdDenom,
				minAmount: '50000000000000000',
				maxAmount: '50000000000000000',
			};
			const paramsResponse = {
				params: {
					default: [feeRange],
				},
			};

			let paramsCallCount = 0;
			const params = async () => {
				paramsCallCount += 1;
				return paramsResponse;
			};

			let convertArgs: unknown[] | undefined;
			const convertUSDtoCHEQ = async (
				usdAmount: string,
				movingAverage: MovingAverage,
				wmaStrategy?: WMAStrategy,
				weights?: bigint[]
			) => {
				convertArgs = [usdAmount, movingAverage, wmaStrategy, weights];
				return { amount: '10000000000ncheq' };
			};

			const mockQuerier = {
				[defaultResourceExtensionKey]: { params },
				[defaultOracleExtensionKey]: { convertUSDtoCHEQ },
			} as unknown as CheqdQuerier & ResourceExtension & OracleExtension;

			const resourceModule = new ResourceModule({} as CheqdSigningStargateClient, mockQuerier);
			const fee = await resourceModule.generateCreateResourceDefaultFees(faucet.address, undefined, {
				slippageBps: 100,
			});

			expect(paramsCallCount).toBe(1);
			expect(convertArgs).toEqual([feeRange.minAmount, MovingAverages.WMA, WMAStrategies.BALANCED, undefined]);

			expect(fee.amount).toEqual([{ amount: '10100000000', denom: 'ncheq' }]);
			expect(fee.gas).toBe(ResourceModule.gasLimits.CreateLinkedResourceDefaultGasLimit);
			expect(fee.payer).toBe(faucet.address);
			expect(fee.amount[0].amount).not.toBe(ResourceModule.fees.DefaultCreateResourceDefaultFee.amount);
		});

		it('should generate static fees transacting on mainnet - case: json', async () => {
			let paramsCallCount = 0;
			const params = async () => {
				paramsCallCount += 1;
				return { params: {} };
			};

			let convertCallCount = 0;
			const convertUSDtoCHEQ = async () => {
				convertCallCount += 1;
				return { amount: '0ncheq' };
			};

			const mockQuerier = {
				[defaultResourceExtensionKey]: { params },
				[defaultOracleExtensionKey]: { convertUSDtoCHEQ },
			} as unknown as CheqdQuerier & ResourceExtension & OracleExtension;

			const context = {
				sdk: { options: { network: CheqdNetwork.Mainnet } },
			} as unknown as IContext;

			const resourceModule = new ResourceModule({} as CheqdSigningStargateClient, mockQuerier);
			const fee = await resourceModule.generateCreateResourceJsonFees(
				faucet.address,
				undefined,
				{ slippageBps: 100 },
				context
			);

			expect(paramsCallCount).toBe(0);
			expect(convertCallCount).toBe(0);
			expect(fee.amount).toEqual([ResourceModule.fees.DefaultCreateResourceJsonFee]);
			expect(fee.gas).toBe(ResourceModule.gasLimits.CreateLinkedResourceJsonGasLimit);
			expect(fee.payer).toBe(faucet.address);
		});

		it('should generate static fees transacting on mainnet - case: image', async () => {
			let paramsCallCount = 0;
			const params = async () => {
				paramsCallCount += 1;
				return { params: {} };
			};

			let convertCallCount = 0;
			const convertUSDtoCHEQ = async () => {
				convertCallCount += 1;
				return { amount: '0ncheq' };
			};

			const mockQuerier = {
				[defaultResourceExtensionKey]: { params },
				[defaultOracleExtensionKey]: { convertUSDtoCHEQ },
			} as unknown as CheqdQuerier & ResourceExtension & OracleExtension;

			const context = {
				sdk: { options: { network: CheqdNetwork.Mainnet } },
			} as unknown as IContext;

			const resourceModule = new ResourceModule({} as CheqdSigningStargateClient, mockQuerier);
			const fee = await resourceModule.generateCreateResourceImageFees(
				faucet.address,
				undefined,
				{ slippageBps: 100 },
				context
			);

			expect(paramsCallCount).toBe(0);
			expect(convertCallCount).toBe(0);
			expect(fee.amount).toEqual([ResourceModule.fees.DefaultCreateResourceImageFee]);
			expect(fee.gas).toBe(ResourceModule.gasLimits.CreateLinkedResourceImageGasLimit);
			expect(fee.payer).toBe(faucet.address);
		});

		it('should generate static fees transacting on mainnet - case: default', async () => {
			let paramsCallCount = 0;
			const params = async () => {
				paramsCallCount += 1;
				return { params: {} };
			};

			let convertCallCount = 0;
			const convertUSDtoCHEQ = async () => {
				convertCallCount += 1;
				return { amount: '0ncheq' };
			};

			const mockQuerier = {
				[defaultResourceExtensionKey]: { params },
				[defaultOracleExtensionKey]: { convertUSDtoCHEQ },
			} as unknown as CheqdQuerier & ResourceExtension & OracleExtension;

			const context = {
				sdk: { options: { network: CheqdNetwork.Mainnet } },
			} as unknown as IContext;

			const resourceModule = new ResourceModule({} as CheqdSigningStargateClient, mockQuerier);
			const fee = await resourceModule.generateCreateResourceDefaultFees(
				faucet.address,
				undefined,
				{ slippageBps: 100 },
				context
			);

			expect(paramsCallCount).toBe(0);
			expect(convertCallCount).toBe(0);
			expect(fee.amount).toEqual([ResourceModule.fees.DefaultCreateResourceDefaultFee]);
			expect(fee.gas).toBe(ResourceModule.gasLimits.CreateLinkedResourceDefaultGasLimit);
			expect(fee.payer).toBe(faucet.address);
		});
	});

	describe('queryLinkedResource', () => {
		it(
			'should query a linked resource - case: json',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceJson = await resourceModule.generateCreateResourceJsonFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the resource
				const resourceWithMetadata = await resourceModule.queryLinkedResource(collectionId, resourcePayload.id);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'application/json';

				expect(resourceWithMetadata.metadata?.collectionId).toBe(collectionId);
				expect(resourceWithMetadata.metadata?.id).toBe(resourcePayload.id);
				expect(resourceWithMetadata.metadata?.name).toBe(resourcePayload.name);
				expect(resourceWithMetadata.metadata?.version).toBe(resourcePayload.version);
				expect(resourceWithMetadata.metadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(resourceWithMetadata.metadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(resourceWithMetadata.metadata?.mediaType).toBe(mimeType);
				expect(resourceWithMetadata.metadata?.checksum).toBe(checksum);
				expect(resourceWithMetadata.metadata?.previousVersionId).toBe('');
				expect(resourceWithMetadata.metadata?.nextVersionId).toBe('');
				expect(resourceWithMetadata.resource?.data).toEqual(resourcePayload.data);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query a linked resource - case: image',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: fromString(image_content, 'base64'),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceImage = await resourceModule.generateCreateResourceImageFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceImage
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the resource
				const resourceWithMetadata = await resourceModule.queryLinkedResource(collectionId, resourcePayload.id);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'image/png';

				expect(resourceWithMetadata.metadata?.collectionId).toBe(collectionId);
				expect(resourceWithMetadata.metadata?.id).toBe(resourcePayload.id);
				expect(resourceWithMetadata.metadata?.name).toBe(resourcePayload.name);
				expect(resourceWithMetadata.metadata?.version).toBe(resourcePayload.version);
				expect(resourceWithMetadata.metadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(resourceWithMetadata.metadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(resourceWithMetadata.metadata?.mediaType).toBe(mimeType);
				expect(resourceWithMetadata.metadata?.checksum).toBe(checksum);
				expect(resourceWithMetadata.metadata?.previousVersionId).toBe('');
				expect(resourceWithMetadata.metadata?.nextVersionId).toBe('');
				expect(resourceWithMetadata.resource?.data).toEqual(resourcePayload.data);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query a linked resource - case: default',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(default_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceDefault = await resourceModule.generateCreateResourceDefaultFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceDefault
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the resource
				const resourceWithMetadata = await resourceModule.queryLinkedResource(collectionId, resourcePayload.id);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'text/html; charset=utf-8';

				expect(resourceWithMetadata.metadata?.collectionId).toBe(collectionId);
				expect(resourceWithMetadata.metadata?.id).toBe(resourcePayload.id);
				expect(resourceWithMetadata.metadata?.name).toBe(resourcePayload.name);
				expect(resourceWithMetadata.metadata?.version).toBe(resourcePayload.version);
				expect(resourceWithMetadata.metadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(resourceWithMetadata.metadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(resourceWithMetadata.metadata?.mediaType).toBe(mimeType);
				expect(resourceWithMetadata.metadata?.checksum).toBe(checksum);
				expect(resourceWithMetadata.metadata?.previousVersionId).toBe('');
				expect(resourceWithMetadata.metadata?.nextVersionId).toBe('');
				expect(resourceWithMetadata.resource?.data).toEqual(resourcePayload.data);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryLinkedResourceMetadata', () => {
		it(
			'should query a linked resource metadata - case: json',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceJson = await resourceModule.generateCreateResourceJsonFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the linked resource metadata
				const metadata = await resourceModule.queryLinkedResourceMetadata(collectionId, resourcePayload.id);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'application/json';

				expect(metadata?.collectionId).toBe(collectionId);
				expect(metadata?.id).toBe(resourcePayload.id);
				expect(metadata?.name).toBe(resourcePayload.name);
				expect(metadata?.version).toBe(resourcePayload.version);
				expect(metadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(metadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(metadata?.mediaType).toBe(mimeType);
				expect(metadata?.checksum).toBe(checksum);
				expect(metadata?.previousVersionId).toBe('');
				expect(metadata?.nextVersionId).toBe('');
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query a linked resource metadata - case: image',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: fromString(image_content, 'base64'),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceImage = await resourceModule.generateCreateResourceImageFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceImage
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the linked resource metadata
				const metadata = await resourceModule.queryLinkedResourceMetadata(collectionId, resourcePayload.id);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'image/png';

				expect(metadata?.collectionId).toBe(collectionId);
				expect(metadata?.id).toBe(resourcePayload.id);
				expect(metadata?.name).toBe(resourcePayload.name);
				expect(metadata?.version).toBe(resourcePayload.version);
				expect(metadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(metadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(metadata?.mediaType).toBe(mimeType);
				expect(metadata?.checksum).toBe(checksum);
				expect(metadata?.previousVersionId).toBe('');
				expect(metadata?.nextVersionId).toBe('');
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query a linked resource metadata - case: default',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(default_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceDefault = await resourceModule.generateCreateResourceDefaultFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceDefault
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the linked resource metadata
				const metadata = await resourceModule.queryLinkedResourceMetadata(collectionId, resourcePayload.id);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'text/html; charset=utf-8';

				expect(metadata?.collectionId).toBe(collectionId);
				expect(metadata?.id).toBe(resourcePayload.id);
				expect(metadata?.name).toBe(resourcePayload.name);
				expect(metadata?.version).toBe(resourcePayload.version);
				expect(metadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(metadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(metadata?.mediaType).toBe(mimeType);
				expect(metadata?.checksum).toBe(checksum);
				expect(metadata?.previousVersionId).toBe('');
				expect(metadata?.nextVersionId).toBe('');
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryLinkedResources', () => {
		it(
			'should query linked resource collection',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceJson = await resourceModule.generateCreateResourceJsonFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// create a did linked resource following version
				const resourcePayload2: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '2.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceTx2 = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload2,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx2)}`);

				expect(resourceTx2.code).toBe(0);

				// create a different did linked resource
				const resourcePayload3: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Different Test Resource',
					resourceType: 'different-test-resource-type',
					data: new TextEncoder().encode(json_content), // different regardless of data
				};

				const resourceTx3 = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload3,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx3)}`);

				expect(resourceTx3.code).toBe(0);

				// query the linked resource collection
				const resources = await resourceModule.queryLinkedResources(collectionId);

				console.warn(`Resources: ${JSON.stringify(resources)}`);

				// ledger constructed
				const alsoKnownAs = (resourceId: string): AlternativeUri[] => [
					{ uri: `${didPayload.id}/resources/${resourceId}`, description: 'did-url' },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'application/json';

				// expected unordered
				const expected: Omit<Metadata, 'created'>[] = [
					{
						collectionId: collectionId,
						id: resourcePayload.id,
						name: resourcePayload.name,
						version: resourcePayload.version,
						resourceType: resourcePayload.resourceType,
						alsoKnownAs: alsoKnownAs(resourcePayload.id),
						mediaType: mimeType,
						checksum: checksum,
						previousVersionId: '',
						nextVersionId: resourcePayload2.id,
					},
					{
						collectionId: collectionId,
						id: resourcePayload2.id,
						name: resourcePayload2.name,
						version: resourcePayload2.version,
						resourceType: resourcePayload2.resourceType,
						alsoKnownAs: alsoKnownAs(resourcePayload2.id),
						mediaType: mimeType,
						checksum: checksum,
						previousVersionId: resourcePayload.id,
						nextVersionId: '',
					},
					{
						collectionId: collectionId,
						id: resourcePayload3.id,
						name: resourcePayload3.name,
						version: resourcePayload3.version,
						resourceType: resourcePayload3.resourceType,
						alsoKnownAs: alsoKnownAs(resourcePayload3.id),
						mediaType: mimeType,
						checksum: checksum,
						previousVersionId: '',
						nextVersionId: '',
					},
				];

				expect(resources.resources).toHaveLength(3);
				expect(containsAllButOmittedFields(resources.resources, expected, ['created'])).toBe(true);
			},
			defaultAsyncTxTimeout * 3
		);
	});

	describe('queryLatestLinkedResourceVersion', () => {
		it(
			'should query the latest linked resource version',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
					prefix: faucet.prefix,
				});
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceJson = await resourceModule.generateCreateResourceJsonFees(feePayer, undefined, {
					slippageBps: 1000,
				});
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the latest linked resource version
				const latestResource = await resourceModule.queryLatestLinkedResourceVersion(
					collectionId,
					resourcePayload.name,
					resourcePayload.resourceType
				);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'application/json';

				expect(latestResource.metadata?.collectionId).toBe(collectionId);
				expect(latestResource.metadata?.id).toBe(resourcePayload.id);
				expect(latestResource.metadata?.name).toBe(resourcePayload.name);
				expect(latestResource.metadata?.version).toBe(resourcePayload.version);
				expect(latestResource.metadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(latestResource.metadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(latestResource.metadata?.mediaType).toBe(mimeType);
				expect(latestResource.metadata?.checksum).toBe(checksum);
				expect(latestResource.metadata?.previousVersionId).toBe('');
				expect(latestResource.metadata?.nextVersionId).toBe('');
				expect(latestResource.resource?.data).toEqual(resourcePayload.data);

				// create a did linked resource following version
				const resourcePayload2: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '2.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceTx2 = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload2,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx2)}`);

				expect(resourceTx2.code).toBe(0);

				// query the latest linked resource version again
				const latestResource2 = await resourceModule.queryLatestLinkedResourceVersion(
					collectionId,
					resourcePayload2.name,
					resourcePayload2.resourceType
				);

				// ledger constructed for latest version
				const alsoKnownAs2 = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload2.id}` },
				];

				expect(latestResource2.metadata?.collectionId).toBe(collectionId);
				expect(latestResource2.metadata?.id).toBe(resourcePayload2.id);
				expect(latestResource2.metadata?.name).toBe(resourcePayload2.name);
				expect(latestResource2.metadata?.version).toBe(resourcePayload2.version);
				expect(latestResource2.metadata?.resourceType).toBe(resourcePayload2.resourceType);
				expect(latestResource2.metadata?.alsoKnownAs).toEqual(alsoKnownAs2);
				expect(latestResource2.metadata?.mediaType).toBe(mimeType);
				expect(latestResource2.metadata?.checksum).toBe(checksum);
				expect(latestResource2.metadata?.previousVersionId).toBe(resourcePayload.id);
				expect(latestResource2.metadata?.nextVersionId).toBe('');
				expect(latestResource2.resource?.data).toEqual(resourcePayload2.data);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryLatestLinkedResourceVersionMetadata', () => {
		it(
			'should query the latest linked resource version metadata',
			async () => {
				// create an associated did document
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
					prefix: faucet.prefix,
				});
				const registry = createDefaultCheqdRegistry(
					Array.from(DIDModule.registryTypes).concat(Array.from(ResourceModule.registryTypes))
				);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					setupDidExtension,
					setupResourceExtension,
					setupOracleExtension
				)) as CheqdQuerier & DidExtension & ResourceExtension & OracleExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await didModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier);

				const collectionId = didPayload.id.split(':').reverse()[0];

				const resourcePayload: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '1.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceSignInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						keyType: 'Ed25519',
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const feeResourceJson = await resourceModule.generateCreateResourceJsonFees(feePayer);
				const resourceTx = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx)}`);

				expect(resourceTx.code).toBe(0);

				// query the latest linked resource version metadata
				const latestMetadata = await resourceModule.queryLatestLinkedResourceVersionMetadata(
					collectionId,
					resourcePayload.name,
					resourcePayload.resourceType
				);

				// ledger constructed
				const alsoKnownAs = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload.id}` },
				];
				const checksum = toString(sha256(resourcePayload.data), 'hex');
				const mimeType = 'application/json';

				expect(latestMetadata?.collectionId).toBe(collectionId);
				expect(latestMetadata?.id).toBe(resourcePayload.id);
				expect(latestMetadata?.name).toBe(resourcePayload.name);
				expect(latestMetadata?.version).toBe(resourcePayload.version);
				expect(latestMetadata?.resourceType).toBe(resourcePayload.resourceType);
				expect(latestMetadata?.alsoKnownAs).toEqual(alsoKnownAs);
				expect(latestMetadata?.mediaType).toBe(mimeType);
				expect(latestMetadata?.checksum).toBe(checksum);
				expect(latestMetadata?.previousVersionId).toBe('');
				expect(latestMetadata?.nextVersionId).toBe('');

				// create a did linked resource following version
				const resourcePayload2: MsgCreateResourcePayload = {
					collectionId: collectionId,
					id: v4(),
					version: '2.0',
					alsoKnownAs: [],
					name: 'Test Resource',
					resourceType: 'test-resource-type',
					data: new TextEncoder().encode(json_content),
				};

				const resourceTx2 = await resourceModule.createLinkedResourceTx(
					resourceSignInputs,
					resourcePayload2,
					feePayer,
					feeResourceJson
				);

				console.warn(`Using payload: ${JSON.stringify(resourcePayload)}`);
				console.warn(`Resource Tx: ${JSON.stringify(resourceTx2)}`);

				expect(resourceTx2.code).toBe(0);

				// query the latest linked resource version metadata again
				const latestMetadata2 = await resourceModule.queryLatestLinkedResourceVersionMetadata(
					collectionId,
					resourcePayload2.name,
					resourcePayload2.resourceType
				);

				// ledger constructed for latest version
				const alsoKnownAs2 = [
					{ description: 'did-url', uri: `${didPayload.id}/resources/${resourcePayload2.id}` },
				];

				expect(latestMetadata2?.collectionId).toBe(collectionId);
				expect(latestMetadata2?.id).toBe(resourcePayload2.id);
				expect(latestMetadata2?.name).toBe(resourcePayload2.name);
				expect(latestMetadata2?.version).toBe(resourcePayload2.version);
				expect(latestMetadata2?.resourceType).toBe(resourcePayload2.resourceType);
				expect(latestMetadata2?.alsoKnownAs).toEqual(alsoKnownAs2);
				expect(latestMetadata2?.mediaType).toBe(mimeType);
				expect(latestMetadata2?.checksum).toBe(checksum);
				expect(latestMetadata2?.previousVersionId).toBe(resourcePayload.id);
				expect(latestMetadata2?.nextVersionId).toBe('');
			},
			defaultAsyncTxTimeout
		);
	});
});
