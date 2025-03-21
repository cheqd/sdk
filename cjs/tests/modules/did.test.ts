import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing-cjs';
import { DeliverTxResponse } from '@cosmjs/stargate-cjs';
import { fromString, toString } from 'uint8arrays-cjs';
import { DIDModule } from '../../src';
import { createDefaultCheqdRegistry } from '../../src/registry';
import { CheqdSigningStargateClient } from '../../src/signer';
import { CheqdNetwork, DIDDocument, ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from '../../src/types';
import {
	createDidPayload,
	createDidVerificationMethod,
	createKeyPairBase64,
	createVerificationKeys,
} from '../../src/utils';
import { localnet, faucet, containsAll } from '../testutils.test';
import { CheqdQuerier } from '../../src/querier';
import { setupDidExtension, DidExtension } from '../../src/modules/did';
import { v4 } from 'uuid-cjs';

const defaultAsyncTxTimeout = 30000;

describe('DIDModule', () => {
	describe('constructor', () => {
		it('should instantiate standalone module', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
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
				const didPayload = createDidPayload(verificationMethods, [verificationKeys], [verificationKeys.didUrl]);
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
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
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
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
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
					controller: didPayload.controller,
					verificationMethod: didPayload.verificationMethod,
					authentication: didPayload.authentication,
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

		it(
			'should query a DID document - case: JSON unescaped AssertionMethod',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
					registry,
				});
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
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
				const [assertionMethod] = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
				didPayload.assertionMethod = [JSON.stringify(JSON.stringify(assertionMethod))];
				const expectedAssertionMethod = [assertionMethod];
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
				expect(didDoc.didDocument?.assertionMethod).toEqual(expectedAssertionMethod);
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

	describe('validateAuthenticationAgainstSignatures', () => {
		it(
			'should accept valid signatures necessary as per the authentication field - no external controller',
			async () => {
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const keyPair2 = createKeyPairBase64();
				const verificationKeys2 = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-2',
					CheqdNetwork.Testnet,
					verificationKeys.methodSpecificId,
					verificationKeys.didUrl
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018, VerificationMethods.Ed255192020],
					[verificationKeys, verificationKeys2]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys, verificationKeys2]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
					{
						verificationMethodId: didPayload.verificationMethod![1].id,
						privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
					},
				];

				// shallow validate on client
				const { valid, error } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signInputs.map((signInput) => {
						return {
							verificationMethodId: signInput.verificationMethodId,
							signature: new Uint8Array(), // empty signature, no interest
						};
					}),
					querier
				);

				expect(valid).toBe(true);
				expect(error).toBeUndefined();

				// pop the last signature
				const lastSignature = signInputs.pop();

				// shallow validate on client
				const { valid: valid2, error: error2 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signInputs.map((signInput) => {
						return {
							verificationMethodId: signInput.verificationMethodId,
							signature: new Uint8Array(), // empty signature, no interest
						};
					}),
					querier
				);

				expect(valid2).toBe(false);
				expect(error2).toBeDefined();
				expect(error2).toContain(
					`authentication does not match signatures: signature from key ${verificationKeys2.keyId} is missing`
				);

				// push back the last signature
				signInputs.push(lastSignature!);

				// create additional verification method
				const keyPair3 = createKeyPairBase64();
				const verificationKeys3 = createVerificationKeys(
					keyPair3.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-3',
					CheqdNetwork.Testnet,
					verificationKeys.methodSpecificId,
					verificationKeys.didUrl
				);
				const [verificationMethod3] = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys3]
				);

				// add the additional verification method
				didPayload.verificationMethod?.push(verificationMethod3);

				// add the excessive signature
				signInputs.push({
					verificationMethodId: verificationMethod3.id,
					privateKeyHex: toString(fromString(keyPair3.privateKey, 'base64'), 'hex'),
				});

				// shallow validate on client
				const { valid: valid3, error: error3 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signInputs.map((signInput) => {
						return {
							verificationMethodId: signInput.verificationMethodId,
							signature: new Uint8Array(), // empty signature, no interest
						};
					}),
					querier
				);

				expect(valid3).toBe(false);
				expect(error3).toBeDefined();
				expect(error3).toContain(
					`authentication does not match signatures: signature from key ${verificationKeys3.keyId} is not required`
				);

				// remove the excessive signature
				signInputs.pop();

				// define did url component literals
				const [didLiteral, methodLiteral, methodNameLiteral, namespaceLiteral] = didPayload.id.split(':');

				// generate invalid authentication key reference
				const invalidAuthenticationKeyReference = `${didLiteral}:${methodLiteral}:${methodNameLiteral}:${namespaceLiteral}:${v4()}#key-1`;

				// push	invalid authentication key reference
				didPayload.authentication!.push(invalidAuthenticationKeyReference);

				// shallow validate on client
				const { valid: valid4, error: error4 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signInputs.map((signInput) => {
						return {
							verificationMethodId: signInput.verificationMethodId,
							signature: new Uint8Array(), // empty signature, no interest
						};
					}),
					querier
				);

				expect(valid4).toBe(false);
				expect(error4).toBeDefined();
				expect(error4).toContain(
					`authentication contains invalid key references: invalid key reference ${invalidAuthenticationKeyReference}`
				);

				// pop the invalid authentication key reference
				didPayload.authentication!.pop();

				// push authentication key reference duplicate
				didPayload.authentication!.push(didPayload.authentication![0]);

				// shallow validate on client
				const { valid: valid5, error: error5 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signInputs.map((signInput) => {
						return {
							verificationMethodId: signInput.verificationMethodId,
							signature: new Uint8Array(), // empty signature, no interest
						};
					}),
					querier
				);

				expect(valid5).toBe(false);
				expect(error5).toBeDefined();
				expect(error5).toContain(
					`authentication contains duplicate key references: duplicate key reference ${didPayload.authentication![0]}`
				);

				// pop the duplicate authentication key reference
				didPayload.authentication!.pop();

				// push signature duplicate
				signInputs.push(signInputs[0]);

				// shallow validate on client
				const { valid: valid6, error: error6 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signInputs.map((signInput) => {
						return {
							verificationMethodId: signInput.verificationMethodId,
							signature: new Uint8Array(), // empty signature, no interest
						};
					}),
					querier
				);

				expect(valid6).toBe(false);
				expect(error6).toBeDefined();
				expect(error6).toContain(
					`signatures contain duplicates: duplicate signature for key reference ${verificationKeys.keyId}`
				);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should accept valid signatures necessary as per the authentication field - with external controller',
			async () => {
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;

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
				const keyPair2 = createKeyPairBase64();
				const verificationKeys2 = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const verificationMethods2 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys2]
				);
				const didPayload2 = createDidPayload(verificationMethods2, [verificationKeys2]);
				const signInputs2: ISignInputs[] = [
					{
						verificationMethodId: didPayload2.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
					},
				];

				// push external controller
				(didPayload.controller as string[]).push(verificationKeys2.didUrl);

				// define signatures
				const signatures = signInputs.concat(signInputs2).map((signInput) => {
					return {
						verificationMethodId: signInput.verificationMethodId,
						signature: new Uint8Array(), // empty signature, no interest
					};
				});

				// shallow validate on client
				const { valid, error } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signatures,
					querier,
					[didPayload2]
				);

				expect(valid).toBe(true);
				expect(error).toBeUndefined();

				// pop the last signature
				const lastSignature = signatures.pop();

				// shallow validate on client
				const { valid: valid2, error: error2 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signatures,
					querier,
					[didPayload2]
				);

				expect(valid2).toBe(false);
				expect(error2).toBeDefined();
				expect(error2).toContain(
					`authentication does not match signatures: signature from key ${verificationKeys2.keyId} is missing`
				);

				// push back the last signature
				signatures.push(lastSignature!);

				// create additional verification method
				const keyPair3 = createKeyPairBase64();
				const verificationKeys3 = createVerificationKeys(
					keyPair3.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-3',
					CheqdNetwork.Testnet,
					verificationKeys2.methodSpecificId,
					verificationKeys2.didUrl
				);
				const [verificationMethod3] = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys3]
				);

				// add the additional verification method
				didPayload2.verificationMethod?.push(verificationMethod3);

				// add the excessive signature
				signatures.push({
					verificationMethodId: verificationMethod3.id,
					signature: new Uint8Array(), // empty signature, no interest
				});

				// shallow validate on client
				const { valid: valid3, error: error3 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signatures,
					querier,
					[didPayload2]
				);

				expect(valid3).toBe(false);
				expect(error3).toBeDefined();
				expect(error3).toContain(
					`authentication does not match signatures: signature from key ${verificationKeys3.keyId} is not required`
				);

				// remove the excessive signature
				signatures.pop();

				// define did url component literals
				const [didLiteral, methodLiteral, methodNameLiteral, namespaceLiteral] = didPayload.id.split(':');

				// generate invalid authentication key reference
				const invalidAuthenticationKeyReference = `${didLiteral}:${methodLiteral}:${methodNameLiteral}:${namespaceLiteral}:${v4()}#key-1`;

				// push	invalid authentication key reference
				didPayload.authentication!.push(invalidAuthenticationKeyReference);

				// shallow validate on client
				const { valid: valid4, error: error4 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signatures,
					querier,
					[didPayload2]
				);

				expect(valid4).toBe(false);
				expect(error4).toBeDefined();
				expect(error4).toContain(
					`authentication contains invalid key references: invalid key reference ${invalidAuthenticationKeyReference}`
				);

				// pop the invalid authentication key reference
				didPayload.authentication!.pop();

				// push authentication key reference duplicate
				didPayload.authentication!.push(didPayload.authentication![0]);

				// shallow validate on client
				const { valid: valid5, error: error5 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signatures,
					querier,
					[didPayload2]
				);

				expect(valid5).toBe(false);
				expect(error5).toBeDefined();
				expect(error5).toContain(
					`authentication contains duplicate key references: duplicate key reference ${didPayload.authentication![0]}`
				);

				// pop the duplicate authentication key reference
				didPayload.authentication!.pop();

				// push signature duplicate, intentionally use the external controller signature
				signatures.push(lastSignature!);

				// shallow validate on client
				const { valid: valid6, error: error6 } = await DIDModule.validateAuthenticationAgainstSignatures(
					didPayload,
					signatures,
					querier,
					[didPayload2]
				);

				expect(valid6).toBe(false);
				expect(error6).toBeDefined();
				expect(error6).toContain(
					`signatures contain duplicates: duplicate signature for key reference ${verificationKeys2.keyId}`
				);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should accept valid signatures necessary as per the authentication field - no external controller, with key rotation',
			async () => {
				const querier = (await CheqdQuerier.connectWithExtension(
					localnet.rpcUrl,
					setupDidExtension
				)) as CheqdQuerier & DidExtension;

				const keyPair = createKeyPairBase64();
				const verificationKeys = createVerificationKeys(
					keyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const keyPair2 = createKeyPairBase64();
				const verificationKeys2 = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-2',
					CheqdNetwork.Testnet,
					verificationKeys.methodSpecificId,
					verificationKeys.didUrl
				);
				const verificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018, VerificationMethods.Ed255192020],
					[verificationKeys, verificationKeys2]
				);
				const didPayload = createDidPayload(verificationMethods, [verificationKeys, verificationKeys2]);
				const signInputs: ISignInputs[] = [
					{
						verificationMethodId: didPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair.privateKey, 'base64'), 'hex'),
					},
					{
						verificationMethodId: didPayload.verificationMethod![1].id,
						privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
					},
				];
				const keyPair3 = createKeyPairBase64();
				const verificationKeys3 = createVerificationKeys(
					keyPair3.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1',
					CheqdNetwork.Testnet,
					verificationKeys.methodSpecificId,
					verificationKeys.didUrl
				);
				const [verificationMethod3] = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys3]
				);

				const signInputs3 = {
					verificationMethodId: verificationMethod3.id,
					privateKeyHex: toString(fromString(keyPair3.privateKey, 'base64'), 'hex'),
				};

				// define rotated document, deep clone initial
				const rotatedDidPayload = JSON.parse(JSON.stringify(didPayload)) as DIDDocument;

				// rotate the verification method
				rotatedDidPayload.verificationMethod![0] = verificationMethod3;

				// rotate the authentication
				rotatedDidPayload.authentication![0] = verificationKeys3.keyId;

				// define signatures
				const signatures = signInputs.concat(signInputs3).map((signInput, i) => {
					return {
						verificationMethodId: signInput.verificationMethodId,
						signature: new Uint8Array(), // empty signature, no interest
					};
				});

				// shallow validate on client
				const { valid, error } = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
					rotatedDidPayload,
					signatures,
					querier,
					didPayload
				);

				expect(valid).toBe(true);
				expect(error).toBeUndefined();

				// pop the last signature
				const lastSignature = signatures.pop();

				// shallow validate on client
				const { valid: valid2, error: error2 } =
					await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
						rotatedDidPayload,
						signatures,
						querier,
						didPayload
					);

				expect(valid2).toBe(false);
				expect(error2).toBeDefined();
				expect(error2).toContain(
					`authentication does not match signatures: signature from key ${verificationKeys3.keyId} is missing`
				);

				// push back the last signature
				signatures.push(lastSignature!);

				// create additional verification method
				const keyPair4 = createKeyPairBase64();
				const verificationKeys4 = createVerificationKeys(
					keyPair4.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-3',
					CheqdNetwork.Testnet,
					verificationKeys.methodSpecificId,
					verificationKeys.didUrl
				);
				const [verificationMethod4] = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[verificationKeys4]
				);

				// add the additional verification method
				rotatedDidPayload.verificationMethod?.push(verificationMethod4);

				// add the excessive signature
				signatures.push({
					verificationMethodId: verificationMethod4.id,
					signature: new Uint8Array(), // empty signature, no interest
				});

				// shallow validate on client
				const { valid: valid3, error: error3 } =
					await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
						rotatedDidPayload,
						signatures,
						querier,
						didPayload
					);

				expect(valid3).toBe(false);
				expect(error3).toBeDefined();
				expect(error3).toContain(
					`authentication does not match signatures: signature from key ${verificationKeys4.keyId} is not required`
				);

				// remove the excessive signature
				signatures.pop();

				// define did url component literals
				const [didLiteral, methodLiteral, methodNameLiteral, namespaceLiteral] =
					rotatedDidPayload.id.split(':');

				// generate invalid authentication key reference
				const invalidAuthenticationKeyReference = `${didLiteral}:${methodLiteral}:${methodNameLiteral}:${namespaceLiteral}:${v4()}#key-1`;

				// push	invalid authentication key reference
				rotatedDidPayload.authentication!.push(invalidAuthenticationKeyReference);

				// shallow validate on client
				const { valid: valid4, error: error4 } =
					await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
						rotatedDidPayload,
						signatures,
						querier,
						didPayload
					);

				expect(valid4).toBe(false);
				expect(error4).toBeDefined();
				expect(error4).toContain(
					`authentication contains invalid key references: invalid key reference ${invalidAuthenticationKeyReference}`
				);

				// pop the invalid authentication key reference
				rotatedDidPayload.authentication!.pop();

				// push authentication key reference duplicate
				rotatedDidPayload.authentication!.push(rotatedDidPayload.authentication![0]);

				// shallow validate on client
				const { valid: valid5, error: error5 } =
					await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
						rotatedDidPayload,
						signatures,
						querier,
						didPayload
					);

				expect(valid5).toBe(false);
				expect(error5).toBeDefined();
				expect(error5).toContain(
					`authentication contains duplicate key references: duplicate key reference ${rotatedDidPayload.authentication![0]}`
				);

				// pop the duplicate authentication key reference
				rotatedDidPayload.authentication!.pop();

				// push signature duplicate
				signatures.push(lastSignature!);

				// shallow validate on client
				const { valid: valid6, error: error6 } =
					await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
						rotatedDidPayload,
						signatures,
						querier,
						didPayload
					);

				expect(valid6).toBe(false);
				expect(error6).toBeDefined();
				expect(error6).toContain(
					`authentication does not match signatures: signature from key ${verificationKeys.keyId} is not required`
				);
			},
			defaultAsyncTxTimeout
		);

		it('should accept valid signatures necessary as per the authentication field - with external controller, with key rotation', async () => {
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				setupDidExtension
			)) as CheqdQuerier & DidExtension;

			const keyPair = createKeyPairBase64();
			const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1');
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
			const keyPair2 = createKeyPairBase64();
			const verificationKeys2 = createVerificationKeys(keyPair2.publicKey, MethodSpecificIdAlgo.Base58, 'key-1');
			const verificationMethods2 = createDidVerificationMethod(
				[VerificationMethods.Ed255192018],
				[verificationKeys2]
			);
			const didPayload2 = createDidPayload(verificationMethods2, [verificationKeys2]);
			const signInputs2: ISignInputs[] = [
				{
					verificationMethodId: didPayload2.verificationMethod![0].id,
					privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
				},
			];

			// create additional verification method
			const keyPair3 = createKeyPairBase64();
			const verificationKeys3 = createVerificationKeys(
				keyPair3.publicKey,
				MethodSpecificIdAlgo.Base58,
				'key-1',
				CheqdNetwork.Testnet,
				verificationKeys.methodSpecificId,
				verificationKeys.didUrl
			);
			const [verificationMethod3] = createDidVerificationMethod(
				[VerificationMethods.Ed255192020],
				[verificationKeys3]
			);
			const signInputs3 = {
				verificationMethodId: verificationMethod3.id,
				privateKeyHex: toString(fromString(keyPair3.privateKey, 'base64'), 'hex'),
			};

			// push external controller
			(didPayload.controller as string[]).push(verificationKeys2.didUrl);

			// define rotated document, deep clone initial
			const rotatedDidPayload = JSON.parse(JSON.stringify(didPayload)) as DIDDocument;

			// rotate the verification method
			rotatedDidPayload.verificationMethod![0] = verificationMethod3;

			// rotate the authentication
			rotatedDidPayload.authentication![0] = verificationKeys3.keyId;

			// define signatures
			const signatures = signInputs
				.concat(signInputs2)
				.concat(signInputs3)
				.map((signInput, i) => {
					return {
						verificationMethodId: signInput.verificationMethodId,
						signature: new Uint8Array(), // empty signature, no interest
					};
				});

			// shallow validate on client
			const { valid, error } = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
				rotatedDidPayload,
				signatures,
				querier,
				didPayload,
				[didPayload2]
			);

			expect(valid).toBe(true);
			expect(error).toBeUndefined();

			// pop the last signature
			const lastSignature = signatures.pop();

			// shallow validate on client
			const { valid: valid2, error: error2 } = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
				rotatedDidPayload,
				signatures,
				querier,
				didPayload,
				[didPayload2]
			);

			expect(valid2).toBe(false);
			expect(error2).toBeDefined();
			expect(error2).toContain(
				`authentication does not match signatures: signature from key ${verificationKeys3.keyId} is missing`
			);

			// push back the last signature
			signatures.push(lastSignature!);

			// create additional verification method
			const keyPair4 = createKeyPairBase64();
			const verificationKeys4 = createVerificationKeys(
				keyPair4.publicKey,
				MethodSpecificIdAlgo.Base58,
				'key-3',
				CheqdNetwork.Testnet,
				verificationKeys.methodSpecificId,
				verificationKeys.didUrl
			);
			const [verificationMethod4] = createDidVerificationMethod(
				[VerificationMethods.Ed255192020],
				[verificationKeys4]
			);

			// add the additional verification method
			rotatedDidPayload.verificationMethod?.push(verificationMethod4);

			// add the excessive signature
			signatures.push({
				verificationMethodId: verificationMethod4.id,
				signature: new Uint8Array(), // empty signature, no interest
			});

			// shallow validate on client
			const { valid: valid3, error: error3 } = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
				rotatedDidPayload,
				signatures,
				querier,
				didPayload,
				[didPayload2]
			);

			expect(valid3).toBe(false);
			expect(error3).toBeDefined();
			expect(error3).toContain(
				`authentication does not match signatures: signature from key ${verificationKeys4.keyId} is not required`
			);

			// remove the excessive signature
			signatures.pop();

			// define did url component literals
			const [didLiteral, methodLiteral, methodNameLiteral, namespaceLiteral] = rotatedDidPayload.id.split(':');

			// generate invalid authentication key reference
			const invalidAuthenticationKeyReference = `${didLiteral}:${methodLiteral}:${methodNameLiteral}:${namespaceLiteral}:${v4()}#key-1`;

			// push	invalid authentication key reference
			rotatedDidPayload.authentication!.push(invalidAuthenticationKeyReference);

			// shallow validate on client
			const { valid: valid4, error: error4 } = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
				rotatedDidPayload,
				signatures,
				querier,
				didPayload,
				[didPayload2]
			);

			expect(valid4).toBe(false);
			expect(error4).toBeDefined();
			expect(error4).toContain(
				`authentication contains invalid key references: invalid key reference ${invalidAuthenticationKeyReference}`
			);

			// pop the invalid authentication key reference
			rotatedDidPayload.authentication!.pop();

			// push authentication key reference duplicate
			rotatedDidPayload.authentication!.push(rotatedDidPayload.authentication![0]);

			// shallow validate on client
			const { valid: valid5, error: error5 } = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
				rotatedDidPayload,
				signatures,
				querier,
				didPayload,
				[didPayload2]
			);

			expect(valid5).toBe(false);
			expect(error5).toBeDefined();
			expect(error5).toContain(
				`authentication contains duplicate key references: duplicate key reference ${rotatedDidPayload.authentication![0]}`
			);

			// pop the duplicate authentication key reference
			rotatedDidPayload.authentication!.pop();

			// push signature duplicate
			signatures.push(lastSignature!);

			// shallow validate on client
			const { valid: valid6, error: error6 } = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
				rotatedDidPayload,
				signatures,
				querier,
				didPayload,
				[didPayload2]
			);

			expect(valid6).toBe(false);
			expect(error6).toBeDefined();
			expect(error6).toContain(
				`authentication does not match signatures: signature from key ${verificationKeys3.keyId} is not required`
			);
		});
	});
});
