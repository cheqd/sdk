import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing-cjs';
import { DeliverTxResponse } from '@cosmjs/stargate-cjs';
import { fromString, toString } from 'uint8arrays-cjs';
import { DIDModule } from '../../src';
import { createDefaultCheqdRegistry } from '../../src/registry';
import { CheqdSigningStargateClient } from '../../src/signer';
import { CheqdNetwork, ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from '../../src/types';
import {
	createDidPayload,
	createDidVerificationMethod,
	createKeyPairBase64,
	createVerificationKeys,
} from '../../src/utils';
import { localnet, faucet } from '../testutils.test';
import { CheqdQuerier } from '../../src/querier';
import { setupDidExtension, DidExtension } from '../../src/modules/did';

const defaultAsyncTxTimeout = 30000;

describe('DID Key Operations (Rotation, Replacement, and Combined)', () => {
	let didModule: DIDModule;
	let wallet: DirectSecp256k1HdWallet;
	let feePayer: string;

	beforeAll(async () => {
		wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
		const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
		const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, {
			registry,
		});
		const querier = (await CheqdQuerier.connectWithExtension(localnet.rpcUrl, setupDidExtension)) as CheqdQuerier &
			DidExtension;

		didModule = new DIDModule(signer, querier);
		feePayer = (await wallet.getAccounts())[0].address;
	}, defaultAsyncTxTimeout);

	describe('Key Rotation Tests', () => {
		it(
			'should rotate key material while keeping the same key ID',
			async () => {
				// Key rotation: Same verification method ID, different key material

				// Create initial DID with first key
				const keyPair1 = createKeyPairBase64();
				const verificationKeys1 = createVerificationKeys(
					keyPair1.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationMethods1 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys1]
				);
				const initialDidPayload = createDidPayload(verificationMethods1, [verificationKeys1]);

				const signInputs1: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
				];

				// Create the DID
				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				const createTx = await didModule.createDidDocTx(signInputs1, initialDidPayload, feePayer, feeCreate);
				expect(createTx.code).toBe(0);

				// Wait for DID to be available
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Create new key material but keep same key ID
				const keyPair2 = createKeyPairBase64();
				const verificationKeys2 = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				// Use the SAME DID and key ID as before by creating new verification keys
				const verificationKeys2WithSameId = {
					...verificationKeys2,
					didUrl: verificationKeys1.didUrl,
					keyId: verificationKeys1.keyId,
				};

				const verificationMethods2 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys2WithSameId]
				);
				const rotatedDidPayload = {
					...initialDidPayload,
					verificationMethod: verificationMethods2, // Same ID, different public key material
				};

				// For key rotation, need signatures from BOTH old and new keys
				const signInputs2: ISignInputs[] = [
					{
						verificationMethodId: rotatedDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
					},
				];

				const combinedSignInputs = [...signInputs1, ...signInputs2]; // Both old and new key signatures

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModule.updateDidDocTx(
					combinedSignInputs,
					rotatedDidPayload,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify the key was rotated (same ID, different material)
				const queryResult = await didModule.queryDidDoc(initialDidPayload.id);
				expect(queryResult.didDocument?.verificationMethod![0].id).toBe(verificationKeys1.keyId);
				expect(queryResult.didDocument?.verificationMethod![0].publicKeyBase58).not.toBe(
					initialDidPayload.verificationMethod![0].publicKeyBase58
				);
			},
			defaultAsyncTxTimeout
		);

		it(
			'should fail key rotation with only old key signature',
			async () => {
				// Test that key rotation fails if only old key signs (need both old and new)

				const keyPair1 = createKeyPairBase64();
				const verificationKeys1 = createVerificationKeys(
					keyPair1.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationMethods1 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys1]
				);
				const initialDidPayload = createDidPayload(verificationMethods1, [verificationKeys1]);

				const signInputs1: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
				];

				// Create the DID
				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				await didModule.createDidDocTx(signInputs1, initialDidPayload, feePayer, feeCreate);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Try to rotate with new key material
				const keyPair2 = createKeyPairBase64();
				const verificationKeys2 = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationKeys2WithSameId = {
					...verificationKeys2,
					didUrl: verificationKeys1.didUrl,
					keyId: verificationKeys1.keyId,
				};

				const verificationMethods2 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys2WithSameId]
				);
				const rotatedDidPayload = {
					...initialDidPayload,
					verificationMethod: verificationMethods2,
				};

				// Only provide old key signature (missing new key signature)
				const incompleteSignInputs = [...signInputs1]; // Missing new key signature

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);

				await expect(
					didModule.updateDidDocTx(incompleteSignInputs, rotatedDidPayload, feePayer, feeUpdate)
				).rejects.toThrow(/authentication does not match signatures.*is missing/);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('Key Replacement Tests', () => {
		it(
			'should add new key and change authentication (key replacement pattern)',
			async () => {
				// Key replacement pattern: Add new verification method and change authentication to it

				// Create initial DID with first key
				const keyPair1 = createKeyPairBase64();
				const verificationKeys1 = createVerificationKeys(
					keyPair1.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationMethods1 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys1]
				);
				const initialDidPayload = createDidPayload(verificationMethods1, [verificationKeys1]);

				const signInputs1: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
				];

				// Create the DID
				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				const createTx = await didModule.createDidDocTx(signInputs1, initialDidPayload, feePayer, feeCreate);
				expect(createTx.code).toBe(0);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Create completely new key with new ID
				const keyPair2 = createKeyPairBase64();
				// Create new verification keys with the same DID URL but different key fragment
				const verificationKeys2WithSameDid = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-2',
					CheqdNetwork.Testnet,
					verificationKeys1.methodSpecificId, // Same method specific ID
					verificationKeys1.didUrl // Same DID URL
				);

				const verificationMethods2 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys2WithSameDid]
				);
				const replacedDidPayload = {
					...initialDidPayload,
					verificationMethod: [...initialDidPayload.verificationMethod!, ...verificationMethods2], // Include both for signature validation
					authentication: [verificationKeys2WithSameDid.keyId], // Update authentication to new key only
				};

				// For key replacement, need signatures from BOTH old and new keys:
				// 1. Old key signature to authorize the replacement
				// 2. New key signature to prove possession
				const signInputs2: ISignInputs[] = [
					{
						verificationMethodId: verificationKeys2WithSameDid.keyId,
						privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
					},
				];

				const combinedSignInputs = [...signInputs1, ...signInputs2];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModule.updateDidDocTx(
					combinedSignInputs,
					replacedDidPayload,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify the replacement worked - should have both keys but only new one in authentication
				const queryResult = await didModule.queryDidDoc(initialDidPayload.id);
				expect(queryResult.didDocument?.verificationMethod).toHaveLength(2); // Both keys present
				expect(queryResult.didDocument?.authentication).toEqual([verificationKeys2WithSameDid.keyId]); // Only new key in auth

				// Verify both keys are present
				const keyIds = queryResult.didDocument?.verificationMethod!.map((vm) => vm.id);
				expect(keyIds).toContain(verificationKeys1.keyId); // Old key still present
				expect(keyIds).toContain(verificationKeys2WithSameDid.keyId); // New key present
			},
			defaultAsyncTxTimeout
		);

		it(
			'should add additional authentication key (multiple keys scenario)',
			async () => {
				// Key addition: Add new key while keeping existing one

				const keyPair1 = createKeyPairBase64();
				const verificationKeys1 = createVerificationKeys(
					keyPair1.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationMethods1 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys1]
				);
				const initialDidPayload = createDidPayload(verificationMethods1, [verificationKeys1]);

				const signInputs1: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
				];

				// Create the DID
				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				await didModule.createDidDocTx(signInputs1, initialDidPayload, feePayer, feeCreate);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Add second key
				const keyPair2 = createKeyPairBase64();
				// Create new verification keys with the same DID URL but different key fragment
				const verificationKeys2WithSameDid = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-2',
					CheqdNetwork.Testnet,
					verificationKeys1.methodSpecificId, // Same method specific ID
					verificationKeys1.didUrl // Same DID URL
				);

				const verificationMethods2 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys2WithSameDid]
				);
				const expandedDidPayload = {
					...initialDidPayload,
					verificationMethod: [...initialDidPayload.verificationMethod!, ...verificationMethods2], // Both keys
					authentication: [verificationKeys1.keyId, verificationKeys2WithSameDid.keyId], // Both in authentication
				};

				// For adding keys, need signatures from existing key and new key
				const signInputs2: ISignInputs[] = [
					{
						verificationMethodId: verificationKeys2WithSameDid.keyId,
						privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
					},
				];

				const combinedSignInputs = [...signInputs1, ...signInputs2];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModule.updateDidDocTx(
					combinedSignInputs,
					expandedDidPayload,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify both keys are present
				const queryResult = await didModule.queryDidDoc(initialDidPayload.id);
				expect(queryResult.didDocument?.verificationMethod).toHaveLength(2);
				expect(queryResult.didDocument?.authentication).toEqual([
					verificationKeys1.keyId,
					verificationKeys2WithSameDid.keyId,
				]);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('Combined Key Operations', () => {
		it(
			'should handle key rotation and replacement simultaneously',
			async () => {
				// Complex scenario: Rotate one key and replace another in the same transaction

				// Create initial DID with two keys
				const keyPair1 = createKeyPairBase64();
				const keyPair2 = createKeyPairBase64();

				const verificationKeys1 = createVerificationKeys(
					keyPair1.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				// Create new verification keys with the same DID URL but different key fragment
				const verificationKeys2WithSameDid = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-2',
					CheqdNetwork.Testnet,
					verificationKeys1.methodSpecificId, // Same method specific ID
					verificationKeys1.didUrl // Same DID URL
				);

				const verificationMethods = [
					...createDidVerificationMethod([VerificationMethods.Ed255192018], [verificationKeys1]),
					...createDidVerificationMethod([VerificationMethods.Ed255192018], [verificationKeys2WithSameDid]),
				];

				const initialDidPayload = {
					...createDidPayload(verificationMethods, [verificationKeys1, verificationKeys2WithSameDid]),
					authentication: [verificationKeys1.keyId, verificationKeys2WithSameDid.keyId],
				};

				const initialSignInputs: ISignInputs[] = [
					{
						verificationMethodId: verificationKeys1.keyId,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
					{
						verificationMethodId: verificationKeys2WithSameDid.keyId,
						privateKeyHex: toString(fromString(keyPair2.privateKey, 'base64'), 'hex'),
					},
				];

				// Create the DID
				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				await didModule.createDidDocTx(initialSignInputs, initialDidPayload, feePayer, feeCreate);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Now perform combined operations:
				// 1. Rotate key-1 (same ID, new material)
				// 2. Replace key-2 with key-3 (different ID, different material)

				const keyPair1New = createKeyPairBase64(); // New material for key-1 rotation
				const keyPair3 = createKeyPairBase64(); // Completely new key-3

				const rotatedVerificationKeys1 = createVerificationKeys(
					keyPair1New.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const rotatedVerificationKeys1WithSameId = {
					...rotatedVerificationKeys1,
					didUrl: verificationKeys1.didUrl,
					keyId: verificationKeys1.keyId, // Same ID for rotation
				};

				// Create new verification keys with the same DID URL but different key fragment
				const replacementVerificationKeys3WithSameDid = createVerificationKeys(
					keyPair3.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-3',
					CheqdNetwork.Testnet,
					verificationKeys1.methodSpecificId, // Same method specific ID
					verificationKeys1.didUrl // Same DID URL
				);

				const newVerificationMethods = [
					...createDidVerificationMethod(
						[VerificationMethods.Ed255192018],
						[rotatedVerificationKeys1WithSameId]
					), // Rotated key-1
					...createDidVerificationMethod(
						[VerificationMethods.Ed255192018],
						[replacementVerificationKeys3WithSameDid]
					), // New key-3
				];

				const combinedDidPayload = {
					...initialDidPayload,
					verificationMethod: newVerificationMethods,
					// new authentication and assertionMethod: key-1 (rotated) + key-3 (new)
					// must update assertionMethod as well otherwise it will fail validation
					authentication: [
						rotatedVerificationKeys1WithSameId.keyId,
						replacementVerificationKeys3WithSameDid.keyId,
					],
					assertionMethod: [
						rotatedVerificationKeys1WithSameId.keyId,
						replacementVerificationKeys3WithSameDid.keyId,
					],
				};

				// Need signatures from existing keys that can authorize the changes:
				// - Old key-1 (for rotation authorization)
				// - New key-1 (for rotation proof of possession) - same ID as old key-1
				// Note: key-2 signature not needed since it doesn't exist in new DIDDoc
				const combinedSignInputs: ISignInputs[] = [
					// Old key-1 (authorization for rotation)
					{
						verificationMethodId: verificationKeys1.keyId,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
					// New key-1 material (proof of possession) - same ID, different material
					{
						verificationMethodId: rotatedVerificationKeys1WithSameId.keyId, // Same ID as old key-1
						privateKeyHex: toString(fromString(keyPair1New.privateKey, 'base64'), 'hex'),
					},
				];

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);
				const updateTx = await didModule.updateDidDocTx(
					combinedSignInputs,
					combinedDidPayload,
					feePayer,
					feeUpdate
				);

				expect(updateTx.code).toBe(0);

				// Verify the complex operation worked
				const queryResult = await didModule.queryDidDoc(initialDidPayload.id);
				expect(queryResult.didDocument).toBeDefined();
				expect(queryResult.didDocument?.verificationMethod).toHaveLength(2);

				// Check that key-1 was rotated (same ID, different material)
				const rotatedKey = queryResult.didDocument?.verificationMethod!.find(
					(vm) => vm.id === verificationKeys1.keyId
				);
				expect(rotatedKey).toBeDefined();
				expect(rotatedKey!.publicKeyBase58).not.toBe(initialDidPayload.verificationMethod![0].publicKeyBase58);

				// Check that key-2 was replaced with key-3
				const replacedKey = queryResult.didDocument?.verificationMethod!.find(
					(vm) => vm.id === replacementVerificationKeys3WithSameDid.keyId
				);
				expect(replacedKey).toBeDefined();
				expect(
					queryResult.didDocument?.verificationMethod!.find(
						(vm) => vm.id === verificationKeys2WithSameDid.keyId
					)
				).toBeUndefined();

				// Check authentication was updated correctly
				expect(queryResult.didDocument?.authentication).toEqual([
					rotatedVerificationKeys1WithSameId.keyId,
					replacementVerificationKeys3WithSameDid.keyId,
				]);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('Edge Cases and Error Scenarios', () => {
		it(
			'should fail when attempting key rotation with external controllers',
			async () => {
				// Test that key rotation fails when DID has external controllers
				// The blockchain doesn't support simultaneous key changes and controller authorization

				// Create controller DID first
				const controllerKeyPair = createKeyPairBase64();
				const controllerVerificationKeys = createVerificationKeys(
					controllerKeyPair.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1' // Use standard key fragment format
				);
				const controllerVerificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[controllerVerificationKeys]
				);
				const controllerDidPayload = createDidPayload(controllerVerificationMethods, [
					controllerVerificationKeys,
				]);

				const controllerSignInputs: ISignInputs[] = [
					{
						verificationMethodId: controllerDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(controllerKeyPair.privateKey, 'base64'), 'hex'),
					},
				];

				// Create controller DID
				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				await didModule.createDidDocTx(controllerSignInputs, controllerDidPayload, feePayer, feeCreate);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Create target DID with external controller
				const targetKeyPair = createKeyPairBase64();
				const targetVerificationKeys = createVerificationKeys(
					targetKeyPair.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1' // Use standard key fragment format
				);
				const targetVerificationMethods = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[targetVerificationKeys]
				);
				const targetDidPayload = {
					...createDidPayload(targetVerificationMethods, [targetVerificationKeys]),
					controller: [controllerDidPayload.id], // External controller
					verificationMethod: [...targetVerificationMethods, ...controllerVerificationMethods], // Include verification methods
				};

				const targetSignInputs: ISignInputs[] = [
					{
						verificationMethodId: targetDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(targetKeyPair.privateKey, 'base64'), 'hex'),
					},
					{
						verificationMethodId: controllerVerificationKeys.keyId, // Controller must also sign
						privateKeyHex: toString(fromString(controllerKeyPair.privateKey, 'base64'), 'hex'),
					},
				];

				// Create target DID with external controller
				const createSignInputs = [...targetSignInputs];
				try {
					const didTx: DeliverTxResponse = await didModule.createDidDocTx(
						createSignInputs,
						targetDidPayload,
						feePayer,
						feeCreate
					);
				} catch (error: Error | any) {
					// Expect failure due to external controller presence
					expect(error.code).toBe(1205); // cheqd error code
					expect(error.codespace).toBe('cheqd');
					expect(error.log).toContain('payload: (verification_method: (1: (id: must have prefix:');
				}
			},
			defaultAsyncTxTimeout
		);
		it(
			'should fail when trying to rotate non-existent key',
			async () => {
				const keyPair1 = createKeyPairBase64();
				const verificationKeys1 = createVerificationKeys(
					keyPair1.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationMethods1 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys1]
				);
				const initialDidPayload = createDidPayload(verificationMethods1, [verificationKeys1]);

				const signInputs1: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
				];

				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				await didModule.createDidDocTx(signInputs1, initialDidPayload, feePayer, feeCreate);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Try to rotate a key ID that doesn't exist
				const keyPair2 = createKeyPairBase64();
				const verificationKeys2 = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-2' // Different key fragment - simulates non-existent key
				);
				const verificationKeys2WithSameDid = {
					...verificationKeys2,
					didUrl: verificationKeys1.didUrl,
				};

				const verificationMethods2 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys2WithSameDid]
				);
				const invalidDidPayload = {
					...initialDidPayload,
					verificationMethod: verificationMethods2, // Non-existent key ID
				};

				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);

				await expect(
					didModule.updateDidDocTx(signInputs1, invalidDidPayload, feePayer, feeUpdate)
				).rejects.toThrow();
			},
			defaultAsyncTxTimeout
		);

		it(
			'should fail key operations with insufficient signatures',
			async () => {
				const keyPair1 = createKeyPairBase64();
				const verificationKeys1 = createVerificationKeys(
					keyPair1.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationMethods1 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys1]
				);
				const initialDidPayload = createDidPayload(verificationMethods1, [verificationKeys1]);

				const signInputs1: ISignInputs[] = [
					{
						verificationMethodId: initialDidPayload.verificationMethod![0].id,
						privateKeyHex: toString(fromString(keyPair1.privateKey, 'base64'), 'hex'),
					},
				];

				const feeCreate = await DIDModule.generateCreateDidDocFees(feePayer);
				await didModule.createDidDocTx(signInputs1, initialDidPayload, feePayer, feeCreate);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Try rotation with missing new key signature
				const keyPair2 = createKeyPairBase64();
				const verificationKeys2 = createVerificationKeys(
					keyPair2.publicKey,
					MethodSpecificIdAlgo.Uuid,
					'key-1'
				);
				const verificationKeys2WithSameId = {
					...verificationKeys2,
					didUrl: verificationKeys1.didUrl,
					keyId: verificationKeys1.keyId,
				};

				const verificationMethods2 = createDidVerificationMethod(
					[VerificationMethods.Ed255192018],
					[verificationKeys2WithSameId]
				);
				const rotatedDidPayload = {
					...initialDidPayload,
					verificationMethod: verificationMethods2,
				};

				// Only provide old key signature (missing new key)
				const feeUpdate = await DIDModule.generateUpdateDidDocFees(feePayer);

				await expect(
					didModule.updateDidDocTx(signInputs1, rotatedDidPayload, feePayer, feeUpdate)
				).rejects.toThrow(/authentication does not match signatures.*is missing/);
			},
			defaultAsyncTxTimeout
		);
	});
});
