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

				didPayload.service = [
					{
						id: `${didPayload.id}#service-1`,
						serviceEndpoint: 'endpoint1',
						type: 'didcomm',
						accept: ['application/didcomm-plain+json'],
						priority: 0,
					},
					{
						id: `${didPayload.id}#service-2`,
						serviceEndpoint: 'endpoint2',
						type: 'website',
					},
				];

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

				didPayload.service = [
					{
						id: `${didPayload.id}#service-1`,
						serviceEndpoint: 'endpoint1',
						type: 'didcomm',
						accept: ['application/didcomm-plain+json'],
						priority: 0,
					},
					{
						id: `${didPayload.id}#service-2`,
						serviceEndpoint: 'endpoint2',
						type: 'website',
					},
				];

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
		it(
			'should update a DID with key rotation - case: Ed25519VerificationKey2020',
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

				// Create initial DID with first key pair
				const initialKeyPair = createKeyPairBase64();
				const initialVerificationKeys = createVerificationKeys(
					initialKeyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const initialVerificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[initialVerificationKeys]
				);
				const initialDidPayload = createDidPayload(initialVerificationMethods, [initialVerificationKeys]);

				const initialSignInputs: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(initialKeyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const createFee = await DIDModule.generateCreateDidDocFees(feePayer);
				const createDidTx: DeliverTxResponse = await didModule.createDidDocTx(
					initialSignInputs,
					initialDidPayload,
					feePayer,
					createFee
				);

				console.warn(`Initial DID payload: ${JSON.stringify(initialDidPayload)}`);
				console.warn(`Create DID Tx: ${JSON.stringify(createDidTx)}`);
				expect(createDidTx.code).toBe(0);

				// Create new key pair for rotation
				const newKeyPair = createKeyPairBase64();
				const newVerificationKeys = createVerificationKeys(
					newKeyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1', // Same key ID but different key material
					CheqdNetwork.Testnet,
					initialVerificationKeys.methodSpecificId, // Keep same DID
					initialVerificationKeys.didUrl
				);
				const newVerificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[newVerificationKeys]
				);
				// Create updated DID payload with rotated key
				const updatedDidPayload = {
					'@context': initialDidPayload?.['@context'],
					id: initialDidPayload.id,
					controller: initialDidPayload.controller,
					verificationMethod: [...newVerificationMethods], // <-- Include only new verification method
					authentication: [newVerificationKeys.keyId], // <-- Updated authentication with new key
				} as DIDDocument;

				// Sign update with BOTH old and new keys (key rotation pattern)
				const updateSignInputs: ISignInputs[] = [
					// Original key signature (to authorize the update)
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(initialKeyPair.privateKey, 'base64'), 'hex'),
					},
					// New key signature (to establish the new key)
					{
						verificationMethodId: newVerificationMethods[0].id,
						privateKeyHex: toString(fromString(newKeyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const updateFee = await DIDModule.generateUpdateDidDocFees(feePayer);
				console.warn(`Updated DID payload: ${JSON.stringify(updatedDidPayload)}`);
				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					updateSignInputs,
					updatedDidPayload,
					feePayer,
					updateFee
				);
				console.warn(`Update DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);

				// Query the updated DID to verify key rotation
				const updatedDidDoc = await didModule.queryDidDoc(initialDidPayload.id);

				expect(updatedDidDoc.didDocument!.id).toEqual(initialDidPayload.id);
				expect(updatedDidDoc.didDocument!.controller).toEqual(initialDidPayload.controller);

				// Verify the verification method has been rotated
				expect(updatedDidDoc.didDocument!.verificationMethod).toHaveLength(1);
				expect(updatedDidDoc.didDocument!.verificationMethod!.map((vm) => vm.id)).toContain(
					newVerificationMethods[0].id
				);
				// Verify authentication point to the new key
				expect(updatedDidDoc.didDocument!.authentication).toEqual([newVerificationKeys.keyId]);
				console.warn(`Verified rotated DID document: ${JSON.stringify(updatedDidDoc.didDocument)}`);
			},
			defaultAsyncTxTimeout
		);
		it(
			'should update a DID with new key - case: Ed25519VerificationKey2020',
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
				// Create initial DID with first key pair
				const initialKeyPair = createKeyPairBase64();
				const initialVerificationKeys = createVerificationKeys(
					initialKeyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-1'
				);
				const initialVerificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[initialVerificationKeys]
				);
				const initialDidPayload = createDidPayload(initialVerificationMethods, [initialVerificationKeys]);

				const initialSignInputs: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(initialKeyPair.privateKey, 'base64'), 'hex'),
					},
				];
				const feePayer = (await wallet.getAccounts())[0].address;
				const createFee = await DIDModule.generateCreateDidDocFees(feePayer);
				const createDidTx: DeliverTxResponse = await didModule.createDidDocTx(
					initialSignInputs,
					initialDidPayload,
					feePayer,
					createFee
				);

				console.warn(`Initial DID payload: ${JSON.stringify(initialDidPayload)}`);
				console.warn(`Create DID Tx: ${JSON.stringify(createDidTx)}`);
				expect(createDidTx.code).toBe(0);

				// Create new key pair for rotation
				const newKeyPair = createKeyPairBase64();
				const newVerificationKeys = createVerificationKeys(
					newKeyPair.publicKey,
					MethodSpecificIdAlgo.Base58,
					'key-2', // new key ID
					CheqdNetwork.Testnet,
					initialVerificationKeys.methodSpecificId, // Keep same DID
					initialVerificationKeys.didUrl
				);
				const newVerificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192020],
					[newVerificationKeys]
				);
				// Create updated DID payload with rotated key
				const updatedDidPayload = {
					'@context': initialDidPayload?.['@context'],
					id: initialDidPayload.id,
					controller: initialDidPayload.controller,
					verificationMethod: [...initialVerificationMethods, ...newVerificationMethods], // <-- Include both verification methods
					authentication: [newVerificationKeys.keyId], // <-- Updated authentication with new key
				} as DIDDocument;

				// Sign update with BOTH old and new keys (key rotation pattern)
				const updateSignInputs: ISignInputs[] = [
					// Original key signature (to authorize the update)
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(initialKeyPair.privateKey, 'base64'), 'hex'),
					},
					// New key signature (to establish the new key)
					{
						verificationMethodId: newVerificationMethods[0].id,
						privateKeyHex: toString(fromString(newKeyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const updateFee = await DIDModule.generateUpdateDidDocFees(feePayer);
				console.warn(`Updated DID payload: ${JSON.stringify(updatedDidPayload)}`);
				const updateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					updateSignInputs,
					updatedDidPayload,
					feePayer,
					updateFee
				);
				console.warn(`Update DID Tx: ${JSON.stringify(updateDidDocTx)}`);

				expect(updateDidDocTx.code).toBe(0);

				// Query the updated DID to verify key rotation
				const updatedDidDoc = await didModule.queryDidDoc(initialDidPayload.id);

				expect(updatedDidDoc.didDocument!.id).toEqual(initialDidPayload.id);
				expect(updatedDidDoc.didDocument!.controller).toEqual(initialDidPayload.controller);

				// Verify the verification method has been rotated
				expect(updatedDidDoc.didDocument!.verificationMethod).toHaveLength(2);
				expect(updatedDidDoc.didDocument!.verificationMethod!.map((vm) => vm.id)).toContain(
					initialVerificationMethods[0].id
				);
				expect(updatedDidDoc.didDocument!.verificationMethod!.map((vm) => vm.id)).toContain(
					newVerificationMethods[0].id
				);

				// Verify authentication and assertionMethod point to the new key
				expect(updatedDidDoc.didDocument!.authentication).toEqual([newVerificationKeys.keyId]);

				console.warn(`Verified rotated DID document: ${JSON.stringify(updatedDidDoc.didDocument)}`);
				// Optional: Second update to remove the old key completely
				const finalDidPayload = {
					'@context': initialDidPayload?.['@context'],
					id: initialDidPayload.id,
					controller: initialDidPayload.controller,
					verificationMethod: newVerificationMethods, // <-- Only new key now
					authentication: [newVerificationKeys.keyId],
				} as DIDDocument;

				// Sign second update with only the new key (old key is being removed)
				const finalSignInputs: ISignInputs[] = [
					{
						verificationMethodId: newVerificationMethods[0].id,
						privateKeyHex: toString(fromString(newKeyPair.privateKey, 'base64'), 'hex'),
					},
				];

				const finalUpdateFee = await DIDModule.generateUpdateDidDocFees(feePayer);
				const finalUpdateDidDocTx: DeliverTxResponse = await didModule.updateDidDocTx(
					finalSignInputs,
					finalDidPayload,
					feePayer,
					finalUpdateFee
				);

				console.warn(`Final DID payload (old key removed): ${JSON.stringify(finalDidPayload)}`);
				console.warn(`Final Update DID Tx: ${JSON.stringify(finalUpdateDidDocTx)}`);

				expect(finalUpdateDidDocTx.code).toBe(0);

				// Query the final DID to verify complete key replacement
				const finalDidDoc = await didModule.queryDidDoc(initialDidPayload.id);

				// Verify only the new key remains
				expect(finalDidDoc.didDocument!.verificationMethod).toHaveLength(1);
				expect(finalDidDoc.didDocument!.verificationMethod![0].id).toEqual(newVerificationMethods[0].id);
				expect(finalDidDoc.didDocument!.verificationMethod![0].publicKeyMultibase).toEqual(
					newVerificationMethods[0].publicKeyMultibase
				);

				console.warn(
					`Final DID document (complete key replacement): ${JSON.stringify(finalDidDoc.didDocument)}`
				);
			},
			defaultAsyncTxTimeout
		);
	});

	// Tests for controller changes, including self-controller to external controller transitions
	// and switching between different external controllers.
	describe('Controller Switch Scenarios', () => {
		let didModuleA: DIDModule;
		let didModuleB: DIDModule;
		let didModuleC: DIDModule;
		let didPayloadA: DIDDocument;
		let didPayloadB: DIDDocument;
		let didPayloadC: DIDDocument;
		let keyPairA: any;
		let keyPairB: any;
		let keyPairC: any;
		let signInputsA: ISignInputs[];
		let signInputsB: ISignInputs[];
		let signInputsC: ISignInputs[];
		let wallet: DirectSecp256k1HdWallet;
		let feePayer: string;

		beforeAll(async () => {
			// Setup common test infrastructure
			wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
			const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
				registry,
			});
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				setupDidExtension
			)) as CheqdQuerier & DidExtension;

			didModuleA = new DIDModule(signer, querier);
			didModuleB = new DIDModule(signer, querier);
			didModuleC = new DIDModule(signer, querier);
			feePayer = (await wallet.getAccounts())[0].address;

			// Create key pairs for all DIDs
			keyPairA = createKeyPairBase64();
			keyPairB = createKeyPairBase64();
			keyPairC = createKeyPairBase64();

			// Create DID A (will be the target DID for controller changes)
			const verificationKeysA = createVerificationKeys(keyPairA.publicKey, MethodSpecificIdAlgo.Uuid, 'Akey-1');
			const verificationMethodsA = createDidVerificationMethod(
				[VerificationMethods.Ed255192018],
				[verificationKeysA]
			);
			didPayloadA = createDidPayload(verificationMethodsA, [verificationKeysA]);
			signInputsA = [
				{
					verificationMethodId: didPayloadA.verificationMethod![0].id,
					privateKeyHex: toString(fromString(keyPairA.privateKey, 'base64'), 'hex'),
				},
			];

			// Create DID B (will be used as external controller)
			const verificationKeysB = createVerificationKeys(keyPairB.publicKey, MethodSpecificIdAlgo.Uuid, 'Bkey-1');
			const verificationMethodsB = createDidVerificationMethod(
				[VerificationMethods.Ed255192018],
				[verificationKeysB]
			);
			didPayloadB = createDidPayload(verificationMethodsB, [verificationKeysB]);
			signInputsB = [
				{
					verificationMethodId: didPayloadB.verificationMethod![0].id,
					privateKeyHex: toString(fromString(keyPairB.privateKey, 'base64'), 'hex'),
				},
			];

			// Create DID C (will be used as another external controller)
			const verificationKeysC = createVerificationKeys(keyPairC.publicKey, MethodSpecificIdAlgo.Uuid, 'Ckey-1');
			const verificationMethodsC = createDidVerificationMethod(
				[VerificationMethods.Ed255192018],
				[verificationKeysC]
			);
			didPayloadC = createDidPayload(verificationMethodsC, [verificationKeysC]);
			signInputsC = [
				{
					verificationMethodId: didPayloadC.verificationMethod![0].id,
					privateKeyHex: toString(fromString(keyPairC.privateKey, 'base64'), 'hex'),
				},
			];

			// Create all DIDs on blockchain
			const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);

			await didModuleA.createDidDocTx(signInputsA, didPayloadA, feePayer, feeCreate);
			await didModuleB.createDidDocTx(signInputsB, didPayloadB, feePayer, feeCreate);
			await didModuleC.createDidDocTx(signInputsC, didPayloadC, feePayer, feeCreate);

			// Add short delay to ensure DIDs are available
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}, defaultAsyncTxTimeout);

		it(
			'should add external controller to existing self-controlled DID',
			async () => {
				// Test case: Add external controller B to DID A
				// Before: DID A controller = [DID A]
				// After: DID A controller = [DID A, DID B]

				const updatedDidPayloadA = {
					...didPayloadA,
					controller: [didPayloadA.id, didPayloadB.id], // Add external controller
				};

				// Need signatures from both DID A and DID B
				const combinedSignInputs = [...signInputsA, ...signInputsB];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModuleA.updateDidDocTx(
					combinedSignInputs,
					updatedDidPayloadA,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify the DID was updated correctly
				const queryResult = await didModuleA.queryDidDoc(didPayloadA.id);
				expect(queryResult.didDocument?.controller).toEqual([didPayloadA.id, didPayloadB.id]);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should remove self-controller leaving only external controller',
			async () => {
				// Test case: Remove DID A as controller, leaving only DID B
				// Before: DID A controller = [DID A, DID B]
				// After: DID A controller = [DID B]

				const updatedDidPayloadA = {
					...didPayloadA,
					controller: [didPayloadB.id], // Remove self, keep only external controller
				};

				// Need signatures from both current controllers (A and B)
				const combinedSignInputs = [...signInputsA, ...signInputsB];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModuleA.updateDidDocTx(
					combinedSignInputs,
					updatedDidPayloadA,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify the DID was updated correctly - should only have external controller now
				const queryResult = await didModuleA.queryDidDoc(didPayloadA.id);
				expect(queryResult.didDocument?.controller).toEqual([didPayloadB.id]);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should switch from one external controller to another',
			async () => {
				// Test case: Switch from controller B to controller C
				// Before: DID A controller = [DID B]
				// After: DID A controller = [DID C]

				const updatedDidPayloadA = {
					...didPayloadA,
					controller: [didPayloadC.id], // Switch to controller C
				};

				// Need signatures from current controller (B) and new controller (C)
				const combinedSignInputs = [...signInputsB, ...signInputsC];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModuleA.updateDidDocTx(
					combinedSignInputs,
					updatedDidPayloadA,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify the controller switched correctly
				const queryResult = await didModuleA.queryDidDoc(didPayloadA.id);
				expect(queryResult.didDocument?.controller).toEqual([didPayloadC.id]);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should add multiple external controllers simultaneously',
			async () => {
				// Test case: Add multiple controllers at once
				// Before: DID A controller = [DID C]
				// After: DID A controller = [DID B, DID C]

				const updatedDidPayloadA = {
					...didPayloadA,
					controller: [didPayloadB.id, didPayloadC.id], // Multiple external controllers
				};

				// Need signatures from current controller (C) and new controller (B)
				const combinedSignInputs = [...signInputsB, ...signInputsC];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModuleA.updateDidDocTx(
					combinedSignInputs,
					updatedDidPayloadA,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify multiple controllers were set
				const queryResult = await didModuleA.queryDidDoc(didPayloadA.id);
				expect(queryResult.didDocument?.controller).toEqual([didPayloadB.id, didPayloadC.id]);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should restore self-control from external controllers',
			async () => {
				// Test case: Return to self-controlled DID
				// Before: DID A controller = [DID B, DID C]
				// After: DID A controller = [DID A]

				const updatedDidPayloadA = {
					...didPayloadA,
					controller: [didPayloadA.id], // Back to self-controlled
				};

				// Need signatures from current controllers (B and C) and the DID itself (A)
				const combinedSignInputs = [...signInputsA, ...signInputsB, ...signInputsC];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModuleA.updateDidDocTx(
					combinedSignInputs,
					updatedDidPayloadA,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify back to self-controlled
				const queryResult = await didModuleA.queryDidDoc(didPayloadA.id);
				expect(queryResult.didDocument?.controller).toEqual([didPayloadA.id]);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should fail when missing required controller signature during switch',
			async () => {
				// Test case: Try to add controller without proper signatures
				// This should fail validation

				const updatedDidPayloadA = {
					...didPayloadA,
					controller: [didPayloadA.id, didPayloadB.id], // Add external controller
				};

				// Only provide signature from DID A, missing signature from DID B
				const incompleteSignInputs = [...signInputsA]; // Missing signInputsB

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);

				// This should fail due to missing signature
				const updateTx = await didModuleA.updateDidDocTx(
					incompleteSignInputs,
					updatedDidPayloadA,
					feePayer,
					feeUpdate
				);

				// Should return a failed transaction with error code
				expect(updateTx.code).not.toBe(0);
				expect(updateTx.rawLog).toMatch(/signature is required but not found/);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should handle DID with default assertionMethod during controller rotation',
			async () => {
				// Test case: Ensure the fix works with assertionMethod populated
				// This specifically tests the scenario that was failing before the fix

				const updatedDidPayloadA = {
					...didPayloadA,
					controller: [didPayloadB.id], // Switch to external controller only
					// Ensure assertionMethod is populated
					assertionMethod: didPayloadA.verificationMethod!.map((vm) => vm.id),
				};

				// Need signatures from both current controller (A) and new controller (B)
				const combinedSignInputs = [...signInputsA, ...signInputsB];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModuleA.updateDidDocTx(
					combinedSignInputs,
					updatedDidPayloadA,
					feePayer,
					feeUpdate
				);

				// This should succeed with our fix (previously would fail)
				expect(updateTx.code).toBe(0);

				// Verify the update worked correctly
				const queryResult = await didModuleA.queryDidDoc(didPayloadA.id);
				expect(queryResult.didDocument?.controller).toEqual([didPayloadB.id]);
				expect(queryResult.didDocument?.assertionMethod).toEqual(
					didPayloadA.verificationMethod!.map((vm) => vm.id)
				);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should fail when trying to update DID with empty verificationMethod list',
			async () => {
				// Test case: Try to send updated DID Document with empty verificationMethod list
				const updatedDidPayloadA = {
					...didPayloadA,
					verificationMethod: [], // Empty verification methods - should be invalid
					authentication: [], // Also clear authentication to avoid client-side validation error
					assertionMethod: [], // Clear assertion method as well
				};

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);

				// This should throw an error during client-side validation
				await expect(
					didModuleA.updateDidDocTx(
						signInputsB, // Current controller B signature
						updatedDidPayloadA,
						feePayer,
						feeUpdate
					)
				).rejects.toThrow(/authentication.*not valid|invalid key reference|No verification methods provided/i);
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
