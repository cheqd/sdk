import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { fromString, toString } from 'uint8arrays';
import { DIDModule } from '../../src';
import { createDefaultCheqdRegistry } from '../../src/registry';
import { CheqdSigningStargateClient } from '../../src/signer';
import { DIDDocument, ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from '../../src/types';
import {
	createDidPayload,
	createDidVerificationMethod,
	createKeyPairBase64,
	createVerificationKeys,
} from '../../src/utils';
import { localnet, faucet, containsAll } from '../testutils.test';
import { CheqdQuerier } from '../../src/querier';
import { setupDidExtension, DidExtension } from '../../src/modules/did';
import { v4 } from 'uuid';

const defaultAsyncTxTimeout = 30000;

(BigInt.prototype as any).toJSON = function () {
	return this.toString();
};

describe('DIDModule', () => {
	describe('constructor', () => {
		it('should instantiate standalone module', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				localnet.network,
				setupDidExtension
			)) as CheqdQuerier & DidExtension;
			const didModule = new DIDModule(signer, querier);
			expect(didModule).toBeInstanceOf(DIDModule);
		});
	});

	describe('createDidDocTx', () => {
		it(
			'should create a new multibase DID - case: Ed25519VerificationKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should create a new multibase DID - case: Ed25519VerificationKey2018',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);
				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should create a new multibase DID - case: JsonWebKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);
				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys]);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);

				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should create a new uuid DID - case: Ed25519VerificationKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);
				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Uuid, 'key-1');
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should create a new uuid DID - case: Ed25519VerificationKey2018',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);
				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Uuid, 'key-1');
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should create a new uuid DID - case: JsonWebKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);
				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Uuid, 'key-1');
				const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys]);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('updateDidDocTx', () => {
		it(
			'should update a DID - case: Ed25519VerificationKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// update the did document
				const updateDidPayload = {
					'@context': didPayload?.['@context'],
					id: didPayload.id,
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
					assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
				} as DIDDocument;

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					signInputs,
					updateDidPayload,
					feePayer,
					feeUpdate
				);

				console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should update a DID - case: Ed25519VerificationKey2018',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// update the did document
				const updateDidPayload = {
					'@context': didPayload?.['@context'],
					id: didPayload.id,
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
					assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
				} as DIDDocument;

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);

				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					signInputs,
					updateDidPayload,
					feePayer,
					feeUpdate
				);

				console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should update a DID - case: JsonWebKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys]);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// update the did document
				const updateDidPayload = {
					'@context': didPayload?.['@context'],
					id: didPayload.id,
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
					assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
				} as DIDDocument;

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);

				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					signInputs,
					updateDidPayload,
					feePayer,
					feeUpdate
				);

				console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('deactivateDidDocTx', () => {
		it(
			'should deactivate a DID - case: Ed25519VerificationKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// deactivate the did document
				const deactivateDidPayload = {
					id: didPayload.id,
					verificationMethod: didPayload.verificationMethod,
				} as DIDDocument;

				const feeDeactivate = await DIDModule.generateDeactivateDidDocFees(feePayer);

				const deactivateDidDocTx: DeliverTxResponse = await didModule.deactivateDidDocTx(
					signInputs,
					deactivateDidPayload,
					feePayer,
					feeDeactivate
				);

				console.warn(`Using payload: ${JSON.stringify(deactivateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(deactivateDidDocTx)}`);

				expect(deactivateDidDocTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should deactivate a DID - case: Ed25519VerificationKey2018',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// deactivate the did document
				const deactivateDidPayload = {
					id: didPayload.id,
					verificationMethod: didPayload.verificationMethod,
				} as DIDDocument;

				const feeDeactivate = await DIDModule.generateDeactivateDidDocFees(feePayer);

				const deactivateDidDocTx: DeliverTxResponse = await didModule.deactivateDidDocTx(
					signInputs,
					deactivateDidPayload,
					feePayer,
					feeDeactivate
				);

				console.warn(`Using payload: ${JSON.stringify(deactivateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(deactivateDidDocTx)}`);

				expect(deactivateDidDocTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should deactivate a DID - case: JsonWebKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys]);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// deactivate the did document
				const deactivateDidPayload = {
					id: didPayload.id,
					verificationMethod: didPayload.verificationMethod,
				} as DIDDocument;

				const feeDeactivate = await DIDModule.generateDeactivateDidDocFees(feePayer);

				const deactivateDidDocTx: DeliverTxResponse = await didModule.deactivateDidDocTx(
					signInputs,
					deactivateDidPayload,
					feePayer,
					feeDeactivate
				);

				console.warn(`Using payload: ${JSON.stringify(deactivateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(deactivateDidDocTx)}`);

				expect(deactivateDidDocTx.code).toBe(0);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryDidDoc', () => {
		it(
			'should query a DID document - case: Ed25519VerificationKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				const didDoc = await didModule.queryDidDoc(didPayload.id);

				expect(didDoc.didDocument!.id).toEqual(didPayload.id);
				expect(didDoc.didDocument!.controller).toEqual(didPayload.controller);
				expect(didDoc.didDocument!.verificationMethod).toEqual(didPayload.verificationMethod);

				// we keep 1-1 relationship of omitempty fields in proto and spec compliant json
				// while converting from proto to spec compliant json, we remove omitempty fields
				// as in a resolved did document
				expect(didDoc.didDocument?.authentication).toEqual(didPayload?.authentication);
				expect(didDoc.didDocument?.assertionMethod).toEqual(didPayload?.assertionMethod);
				expect(didDoc.didDocument?.capabilityInvocation).toEqual(didPayload?.capabilityInvocation);
				expect(didDoc.didDocument?.capabilityDelegation).toEqual(didPayload?.capabilityDelegation);
				expect(didDoc.didDocument?.keyAgreement).toEqual(didPayload?.keyAgreement);
				expect(didDoc.didDocument?.service).toEqual(didPayload?.service);
				expect(didDoc.didDocument?.alsoKnownAs).toEqual(didPayload?.alsoKnownAs);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query a DID document - case: Ed25519VerificationKey2018',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				const didDoc = await didModule.queryDidDoc(didPayload.id);

				expect(didDoc.didDocument!.id).toEqual(didPayload.id);
				expect(didDoc.didDocument!.controller).toEqual(didPayload.controller);
				expect(didDoc.didDocument!.verificationMethod).toEqual(didPayload.verificationMethod);

				// we keep 1-1 relationship of omitempty fields in proto and spec compliant json
				// while converting from proto to spec compliant json, we remove omitempty fields
				// as in a resolved did document
				expect(didDoc.didDocument?.authentication).toEqual(didPayload?.authentication);
				expect(didDoc.didDocument?.assertionMethod).toEqual(didPayload?.assertionMethod);
				expect(didDoc.didDocument?.capabilityInvocation).toEqual(didPayload?.capabilityInvocation);
				expect(didDoc.didDocument?.capabilityDelegation).toEqual(didPayload?.capabilityDelegation);
				expect(didDoc.didDocument?.keyAgreement).toEqual(didPayload?.keyAgreement);
				expect(didDoc.didDocument?.service).toEqual(didPayload?.service);
				expect(didDoc.didDocument?.alsoKnownAs).toEqual(didPayload?.alsoKnownAs);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query a DID document - case: JsonWebKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys]);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(signInputs, didPayload, feePayer, fee);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				const didDoc = await didModule.queryDidDoc(didPayload.id);

				expect(didDoc.didDocument!.id).toEqual(didPayload.id);
				expect(didDoc.didDocument!.controller).toEqual(didPayload.controller);
				expect(didDoc.didDocument!.verificationMethod).toEqual(didPayload.verificationMethod);

				// we keep 1-1 relationship of omitempty fields in proto and spec compliant json
				// while converting from proto to spec compliant json, we remove omitempty fields
				// as in a resolved did document
				expect(didDoc.didDocument?.authentication).toEqual(didPayload?.authentication);
				expect(didDoc.didDocument?.assertionMethod).toEqual(didPayload?.assertionMethod);
				expect(didDoc.didDocument?.capabilityInvocation).toEqual(didPayload?.capabilityInvocation);
				expect(didDoc.didDocument?.capabilityDelegation).toEqual(didPayload?.capabilityDelegation);
				expect(didDoc.didDocument?.keyAgreement).toEqual(didPayload?.keyAgreement);
				expect(didDoc.didDocument?.service).toEqual(didPayload?.service);
				expect(didDoc.didDocument?.alsoKnownAs).toEqual(didPayload?.alsoKnownAs);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryDidDocVersion', () => {
		it(
			'should query a DID document version - case: Ed25519VerificationKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const versionId = v4();
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(
					signInputs,
					didPayload,
					feePayer,
					fee,
					undefined,
					versionId
				);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				const didDocVersion = await didModule.queryDidDocVersion(didPayload.id, versionId);

				expect(didDocVersion.didDocument!.id).toEqual(didPayload.id);
				expect(didDocVersion.didDocument!.controller).toEqual(didPayload.controller);
				expect(didDocVersion.didDocument!.verificationMethod).toEqual(didPayload.verificationMethod);

				// we keep 1-1 relationship of omitempty fields in proto and spec compliant json
				// while converting from proto to spec compliant json, we remove omitempty fields
				// as in a resolved did document
				expect(didDocVersion.didDocument?.authentication).toEqual(didPayload?.authentication);
				expect(didDocVersion.didDocument?.assertionMethod).toEqual(didPayload?.assertionMethod);
				expect(didDocVersion.didDocument?.capabilityInvocation).toEqual(didPayload?.capabilityInvocation);
				expect(didDocVersion.didDocument?.capabilityDelegation).toEqual(didPayload?.capabilityDelegation);
				expect(didDocVersion.didDocument?.keyAgreement).toEqual(didPayload?.keyAgreement);
				expect(didDocVersion.didDocument?.service).toEqual(didPayload?.service);
				expect(didDocVersion.didDocument?.alsoKnownAs).toEqual(didPayload?.alsoKnownAs);

				expect(didDocVersion.didDocumentMetadata.versionId).toEqual(versionId);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('queryAllDidDocVersionsMetadata', () => {
		it(
			'should query all DID document versions metadata - case: Ed25519VerificationKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
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
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const versionId = v4();
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(
					signInputs,
					didPayload,
					feePayer,
					fee,
					undefined,
					versionId
				);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// update the did document
				const updateVersionId = v4();
				const updateDidPayload = {
					'@context': didPayload?.['@context'],
					id: didPayload.id,
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
					assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
				} as DIDDocument;

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					signInputs,
					updateDidPayload,
					feePayer,
					feeUpdate,
					undefined,
					updateVersionId
				);

				console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);

				const didDocVersionsMetadata = await didModule.queryAllDidDocVersionsMetadata(didPayload.id);

				expect(didDocVersionsMetadata.didDocumentVersionsMetadata).toHaveLength(2);
				expect(
					containsAll(
						[
							didDocVersionsMetadata.didDocumentVersionsMetadata[0].versionId,
							didDocVersionsMetadata.didDocumentVersionsMetadata[1].versionId,
						],
						[versionId, updateVersionId]
					)
				).toBe(true);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[1].created).toBeDefined();
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[0].created).toBeDefined();
				expect(
					containsAll(
						[
							didDocVersionsMetadata.didDocumentVersionsMetadata[0]?.updated,
							didDocVersionsMetadata.didDocumentVersionsMetadata[1]?.updated,
						],
						[undefined]
					)
				).toBe(true);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[1].deactivated).toBe(false);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[0].deactivated).toBe(false);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query all DID document versions metadata - case: JsonWebKey2020',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys]);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const versionId = v4();
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(
					signInputs,
					didPayload,
					feePayer,
					fee,
					undefined,
					versionId
				);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// update the did document
				const updateVersionId = v4();
				const updateDidPayload = {
					'@context': didPayload?.['@context'],
					id: didPayload.id,
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
					assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
				} as DIDDocument;

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					signInputs,
					updateDidPayload,
					feePayer,
					feeUpdate,
					undefined,
					updateVersionId
				);

				console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);

				const didDocVersionsMetadata = await didModule.queryAllDidDocVersionsMetadata(didPayload.id);

				expect(didDocVersionsMetadata.didDocumentVersionsMetadata).toHaveLength(2);
				expect(
					containsAll(
						[
							didDocVersionsMetadata.didDocumentVersionsMetadata[0].versionId,
							didDocVersionsMetadata.didDocumentVersionsMetadata[1].versionId,
						],
						[versionId, updateVersionId]
					)
				).toBe(true);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[1].created).toBeDefined();
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[0].created).toBeDefined();
				expect(
					containsAll(
						[
							didDocVersionsMetadata.didDocumentVersionsMetadata[0]?.updated,
							didDocVersionsMetadata.didDocumentVersionsMetadata[1]?.updated,
						],
						[undefined]
					)
				).toBe(true);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[1].deactivated).toBe(false);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[0].deactivated).toBe(false);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should query all DID document versions metadata - case: Ed25519VerificationKey2018',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					localnet.network,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;
				const didModule = new DIDModule(signer, querier);

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods = createDidVerificationMethod([VerificationMethods.JWK], [verificationKeys]);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const fee = await DIDModule.generateCreateDidDocFees(feePayer);
				const versionId = v4();
				const didTx: DeliverTxResponse = await didModule.createDidDocTx(
					signInputs,
					didPayload,
					feePayer,
					fee,
					undefined,
					versionId
				);

				console.warn(`Using payload: ${JSON.stringify(didPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(didTx)}`);

				expect(didTx.code).toBe(0);

				// update the did document
				const updateVersionId = v4();
				const updateDidPayload = {
					'@context': didPayload?.['@context'],
					id: didPayload.id,
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
					assertionMethod: [didPayload.verificationMethod![0].id], // <-- This is the only difference
				} as DIDDocument;

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					signInputs,
					updateDidPayload,
					feePayer,
					feeUpdate,
					undefined,
					updateVersionId
				);

				console.warn(`Using payload: ${JSON.stringify(updateDidPayload)}`);
				console.warn(`DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);

				const didDocVersionsMetadata = await didModule.queryAllDidDocVersionsMetadata(didPayload.id);

				expect(didDocVersionsMetadata.didDocumentVersionsMetadata).toHaveLength(2);
				expect(
					containsAll(
						[
							didDocVersionsMetadata.didDocumentVersionsMetadata[0].versionId,
							didDocVersionsMetadata.didDocumentVersionsMetadata[1].versionId,
						],
						[versionId, updateVersionId]
					)
				).toBe(true);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[1].created).toBeDefined();
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[0].created).toBeDefined();
				expect(
					containsAll(
						[
							didDocVersionsMetadata.didDocumentVersionsMetadata[0]?.updated,
							didDocVersionsMetadata.didDocumentVersionsMetadata[1]?.updated,
						],
						[undefined]
					)
				).toBe(true);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[1].deactivated).toBe(false);
				expect(didDocVersionsMetadata.didDocumentVersionsMetadata[0].deactivated).toBe(false);
			},
			defaultAsyncTxTimeout
		);
	});
});
