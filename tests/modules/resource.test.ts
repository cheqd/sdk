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
import { setupResourceExtension, ResourceExtension } from '../../src/modules/resource';
import { DidExtension, setupDidExtension } from '../../src/modules/did';
import { sha256 } from '@cosmjs/crypto';

const defaultAsyncTxTimeout = 30000;

(BigInt.prototype as any).toJSON = function () {
	return this.toString();
  };

describe('ResourceModule', () => {
	describe('constructor', () => {
		it('should instantiate standalone module', async () => {
			const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
			const signer = await CheqdSigningStargateClient.connectWithSigner(localnet.rpcUrl, wallet);
			const querier = (await CheqdQuerier.connectWithExtension(
				localnet.rpcUrl,
				setupResourceExtension
			)) as CheqdQuerier & ResourceExtension;
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceJson = await ResourceModule.generateCreateResourceJsonFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceImage = await ResourceModule.generateCreateResourceImageFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceDefault = await ResourceModule.generateCreateResourceDefaultFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceJson = await ResourceModule.generateCreateResourceJsonFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceImage = await ResourceModule.generateCreateResourceImageFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceDefault = await ResourceModule.generateCreateResourceDefaultFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceJson = await ResourceModule.generateCreateResourceJsonFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceImage = await ResourceModule.generateCreateResourceImageFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceDefault = await ResourceModule.generateCreateResourceDefaultFees(feePayer);
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
				const querier = await CheqdQuerier.connectWithExtensions(
					localnet.rpcUrl,
					...([
						setupDidExtension,
						setupResourceExtension,
					] as unknown as QueryExtensionSetup<CheqdExtensions>[])
				);
				const didModule = new DIDModule(signer, querier as CheqdQuerier & DidExtension);

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

				// create a did linked resource
				const resourceModule = new ResourceModule(signer, querier as CheqdQuerier & ResourceExtension);

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

				const feeResourceJson = await ResourceModule.generateCreateResourceJsonFees(feePayer);
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
});
