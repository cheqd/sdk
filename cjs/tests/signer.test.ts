import { MsgCreateDidDoc, MsgCreateDidDocPayload, VerificationMethod } from '@cheqd/ts-proto-cjs/cheqd/did/v2';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing-cjs';
import { EdDSASigner } from 'did-jwt-cjs';
import { DIDModule, MsgCreateDidDocEncodeObject, typeUrlMsgCreateDidDoc } from '../src/modules/did';
import { CheqdSigningStargateClient } from '../src/signer';
import { ISignInputs, MethodSpecificIdAlgo, VerificationMethods } from '../src/types';
import { fromString, toString } from 'uint8arrays-cjs';
import {
	createDidPayload,
	createDidVerificationMethod,
	createKeyPairBase64,
	createVerificationKeys,
	validateSpecCompliantPayload,
} from '../src/utils';
import { localnet, faucet, testnet_rpc } from './testutils.test';
import { verify } from '@stablelib/ed25519-cjs';
import { v4 } from 'uuid-cjs';
import { CheqdQuerier, createDefaultCheqdRegistry } from '../src';

const nonExistingDid = 'did:cHeQd:fantasticnet:123';
const nonExistingKeyId = 'did:cHeQd:fantasticnet:123#key-678';
const nonExistingPublicKeyMultibase = '1234567890';
const nonExistingVerificationMethod = 'ExtraTerrestrialVerificationKey2045';
const nonExistingVerificationDidDocument = {
	authentication: ['did:cheqd:testnet:z6Jn6NmYkaCepQe2#key-1'],
	controller: ['did:cheqd:testnet:z6Jn6NmYkaCepQe2'],
	id: 'did:cheqd:testnet:z6Jn6NmYkaCepQe2',
	verificationMethod: [
		{
			controller: 'did:cheqd:testnet:z6Jn6NmYkaCepQe2',
			id: 'did:cheqd:testnet:z6Jn6NmYkaCepQe2#key-1',
			publicKeyMultibase: 'z6Jn6NmYkaCepQe29vgCZQhFfRkN3YpEPiu14F8HbbmqW',
			type: nonExistingVerificationMethod,
		},
	],
};

const defaultAsyncTxTimeout = 30000;

describe('CheqdSigningStargateClient', () => {
	describe('constructor', () => {
		it('can be instantiated & works for cheqd networks', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			expect(signer).toBeInstanceOf(CheqdSigningStargateClient);
		});

		it('can be constructed with cheqd custom registry', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const registry = new Registry();
			//@ts-expect-error the underlying type is intentionally wider
			registry.register(typeUrlMsgCreateDidDoc, MsgCreateDidDoc);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet, { registry });
			expect(signer.registry.lookupType(typeUrlMsgCreateDidDoc)).toBe(MsgCreateDidDoc);
		});
	});

	describe('getDidSigner', () => {
		it('can get a signer for a did', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const keyPair = createKeyPairBase64();
			const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1');
			const verificationMethods = createDidVerificationMethod(
				[VerificationMethods.Ed255192020],
				[verificationKeys]
			);
			const didPayload = createDidPayload(verificationMethods, [verificationKeys]);
			const { protobufVerificationMethod } = validateSpecCompliantPayload(didPayload);

			const didSigner = await signer.getDidSigner(
				didPayload.verificationMethod![0].id,
				protobufVerificationMethod!
			);

			expect(didSigner).toBe(EdDSASigner);
		});

		it('should throw for a non-supported verification method', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);

			await expect(
				signer.getDidSigner(
					nonExistingVerificationDidDocument.verificationMethod[0].id,
					nonExistingVerificationDidDocument.verificationMethod
				)
			).rejects.toThrow();
		});

		it('should throw for non-matching verification method id', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const keyPair = createKeyPairBase64();
			const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1');
			const verificationMethods = createDidVerificationMethod(
				[VerificationMethods.Ed255192020],
				[verificationKeys]
			);
			const payload = createDidPayload(verificationMethods, [verificationKeys]);
			const { protobufVerificationMethod } = validateSpecCompliantPayload(payload);

			await expect(signer.getDidSigner(nonExistingKeyId, protobufVerificationMethod!)).rejects.toThrow();
		});
	});

	describe('checkDidSigners', () => {
		it('it should instantiate a signer for a did', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const keyPair = createKeyPairBase64();
			const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1');
			const verificationMethods = createDidVerificationMethod(
				[VerificationMethods.Ed255192020],
				[verificationKeys]
			);
			const payload = createDidPayload(verificationMethods, [verificationKeys]);
			const { protobufVerificationMethod } = validateSpecCompliantPayload(payload);
			const didSigners = await signer.checkDidSigners(protobufVerificationMethod);

			expect(didSigners[VerificationMethods.Ed255192020]).toBe(EdDSASigner);
		});

		it('should instantiate multiple signers for a did with multiple verification methods', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const keyPair1 = createKeyPairBase64();
			const keyPair2 = createKeyPairBase64();
			const keyPair3 = createKeyPairBase64();
			const verificationKeys1 = createVerificationKeys(keyPair1.publicKey, MethodSpecificIdAlgo.Base58, 'key-1');
			const verificationKeys2 = createVerificationKeys(keyPair2.publicKey, MethodSpecificIdAlgo.Base58, 'key-2');
			const verificationKeys3 = createVerificationKeys(keyPair3.publicKey, MethodSpecificIdAlgo.Base58, 'key-3');
			const verificationMethods = createDidVerificationMethod(
				[VerificationMethods.Ed255192020, VerificationMethods.JWK, VerificationMethods.Ed255192018],
				[verificationKeys1, verificationKeys2, verificationKeys3]
			);

			const payload = createDidPayload(verificationMethods, [
				verificationKeys1,
				verificationKeys2,
				verificationKeys3,
			]);
			const { protobufVerificationMethod } = validateSpecCompliantPayload(payload);

			const didSigners = await signer.checkDidSigners(protobufVerificationMethod);

			expect(didSigners[VerificationMethods.Ed255192020]).toBe(EdDSASigner);
			expect(didSigners[VerificationMethods.JWK]).toBe(EdDSASigner);
			expect(didSigners[VerificationMethods.Ed255192018]).toBe(EdDSASigner);
		});

		it('should throw for non-supported verification method', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const verificationMethod: Partial<VerificationMethod> = {
				id: nonExistingKeyId,
				verificationMethodType: nonExistingVerificationMethod,
				controller: nonExistingDid,
				verificationMaterial: JSON.stringify({
					publicKeyMultibase: nonExistingPublicKeyMultibase,
				}),
			};

			await expect(
				signer.checkDidSigners([VerificationMethod.fromPartial(verificationMethod)])
			).rejects.toThrow();
		});
	});

	describe('signCreateDidDocTx', () => {
		it('should sign a did tx with valid signature', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const keyPair = createKeyPairBase64();
			const verificationKeys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1');
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
			const { protobufVerificationMethod, protobufService } = validateSpecCompliantPayload(didPayload);
			const versionId = v4();
			const payload = MsgCreateDidDocPayload.fromPartial({
				context: <string[]>didPayload?.['@context'],
				id: didPayload.id,
				controller: <string[]>didPayload.controller,
				verificationMethod: protobufVerificationMethod,
				authentication: <string[]>didPayload.authentication,
				assertionMethod: <string[]>didPayload.assertionMethod,
				capabilityInvocation: <string[]>didPayload.capabilityInvocation,
				capabilityDelegation: <string[]>didPayload.capabilityDelegation,
				keyAgreement: <string[]>didPayload.keyAgreement,
				service: protobufService,
				alsoKnownAs: <string[]>didPayload.alsoKnownAs,
				versionId: versionId,
			});
			const signInfos = await signer.signCreateDidDocTx(signInputs, payload);
			const publicKeyRaw = fromString(keyPair.publicKey, 'base64');
			const messageRaw = MsgCreateDidDocPayload.encode(payload).finish();

			const verified = verify(publicKeyRaw, messageRaw, signInfos[0].signature);

			expect(verified).toBe(true);
		});
	});

	describe('simulate', () => {
		it(
			'should simulate a did tx',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(testnet_rpc, wallet, {
					registry,
					endpoint: testnet_rpc,
				});
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
				const { protobufVerificationMethod, protobufService } = validateSpecCompliantPayload(didPayload);
				const versionId = v4();
				const payload = MsgCreateDidDocPayload.fromPartial({
					context: <string[]>didPayload?.['@context'],
					id: didPayload.id,
					controller: <string[]>didPayload.controller,
					verificationMethod: protobufVerificationMethod,
					authentication: <string[]>didPayload.authentication,
					assertionMethod: <string[]>didPayload.assertionMethod,
					capabilityInvocation: <string[]>didPayload.capabilityInvocation,
					capabilityDelegation: <string[]>didPayload.capabilityDelegation,
					keyAgreement: <string[]>didPayload.keyAgreement,
					service: protobufService,
					alsoKnownAs: <string[]>didPayload.alsoKnownAs,
					versionId: versionId,
				});
				const signatures = await signer.signCreateDidDocTx(signInputs, payload);
				const createDidDocMsg = MsgCreateDidDoc.fromPartial({
					payload,
					signatures,
				});
				const createDidDocEncodeObject = {
					typeUrl: typeUrlMsgCreateDidDoc,
					value: createDidDocMsg,
				} satisfies MsgCreateDidDocEncodeObject;
				const [signerAccount] = await wallet.getAccounts();
				const simulation = await signer.simulate(signerAccount.address, [createDidDocEncodeObject], undefined);

				console.warn('simulation', simulation);

				expect(simulation).toBeDefined();
				expect(simulation).toBeGreaterThan(0);
			},
			defaultAsyncTxTimeout
		);
	});

	describe('batchMessages', () => {
		it(
			'should batch a did tx',
			async () => {
				const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: faucet.prefix });
				const registry = createDefaultCheqdRegistry(DIDModule.registryTypes);
				const signer = await CheqdSigningStargateClient.connectWithSigner(testnet_rpc, wallet, {
					registry,
					endpoint: testnet_rpc,
				});
				// create 50 messages
				const messages = [];
				for (let i = 0; i < 50; i++) {
					const keyPair = createKeyPairBase64();
					const verificationKeys = createVerificationKeys(
						keyPair.publicKey,
						MethodSpecificIdAlgo.Base58,
						`key-${i}`
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
					const { protobufVerificationMethod, protobufService } = validateSpecCompliantPayload(didPayload);
					const versionId = v4();
					const payload = MsgCreateDidDocPayload.fromPartial({
						context: <string[]>didPayload?.['@context'],
						id: didPayload.id,
						controller: <string[]>didPayload.controller,
						verificationMethod: protobufVerificationMethod,
						authentication: <string[]>didPayload.authentication,
						assertionMethod: <string[]>didPayload.assertionMethod,
						capabilityInvocation: <string[]>didPayload.capabilityInvocation,
						capabilityDelegation: <string[]>didPayload.capabilityDelegation,
						keyAgreement: <string[]>didPayload.keyAgreement,
						service: protobufService,
						alsoKnownAs: <string[]>didPayload.alsoKnownAs,
						versionId: versionId,
					});
					const signatures = await signer.signCreateDidDocTx(signInputs, payload);
					const createDidDocMsg = MsgCreateDidDoc.fromPartial({
						payload,
						signatures,
					});
					const createDidDocEncodeObject = {
						typeUrl: typeUrlMsgCreateDidDoc,
						value: createDidDocMsg,
					} satisfies MsgCreateDidDocEncodeObject;
					messages.push(createDidDocEncodeObject);
				}
				const [signerAccount] = await wallet.getAccounts();
				const maxGasLimit = (await CheqdQuerier.getConsensusParameters(testnet_rpc))!.block.maxGas;
				const batchMessages = await signer.batchMessages(
					messages,
					signerAccount.address,
					undefined,
					maxGasLimit
				);

				console.warn('batchMessages', JSON.stringify(batchMessages, null, 2));

				console.warn('batchMessages.gas', batchMessages.gas);

				expect(batchMessages).toBeDefined();
				expect(batchMessages.batches).toBeDefined();
				expect(batchMessages.batches.length).toBeGreaterThanOrEqual(1);
				expect(batchMessages.gas[0]).toBeDefined();
				expect(batchMessages.gas[0]).toBeLessThanOrEqual(30000000);
				expect(batchMessages.gas.length).toBe(batchMessages.batches.length);
			},
			3 * defaultAsyncTxTimeout
		);
	});
});
