import {
	IKeyPair,
	IKeyValuePair,
	ISignInputs,
	VerificationMethods,
	TMethodSpecificId,
	MethodSpecificIdAlgo,
	TVerificationKey,
	TVerificationKeyPrefix,
	CheqdNetwork,
	IVerificationKeys,
	VerificationMethod,
	DIDDocument,
	SpecValidationResult,
	JsonWebKey,
	ServiceType,
	Service,
} from './types';
import { fromString, toString } from 'uint8arrays-cjs';
import { bases } from 'multiformats-cjs/basics';
import { base64ToBytes } from 'did-jwt-cjs';
import { generateKeyPair, generateKeyPairFromSeed, KeyPair } from '@stablelib/ed25519-cjs';
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing-cjs';
import { EnglishMnemonic as _, sha256 } from '@cosmjs/crypto-cjs';
import { rawSecp256k1PubkeyToRawAddress } from '@cosmjs/amino-cjs';
import pkg from 'secp256k1-cjs';
import { v4 } from 'uuid-cjs';
import {
	VerificationMethod as ProtoVerificationMethod,
	Service as ProtoService,
	MsgCreateDidDocPayload,
	MsgDeactivateDidDocPayload,
	DidDoc,
} from '@cheqd/ts-proto-cjs/cheqd/did/v2';
import { contexts, DIDModule } from './modules/did';
import { MsgCreateResourcePayload } from '@cheqd/ts-proto-cjs/cheqd/resource/v2';
import { toBech32 } from '@cosmjs/encoding-cjs';
import { StargateClient } from '@cosmjs/stargate-cjs';
import { Coin } from 'cosmjs-types-cjs/cosmos/base/v1beta1/coin';
import { backOff, BackoffOptions } from 'exponential-backoff-cjs';

/**
 * Represents an importable Ed25519 key with hexadecimal encoding.
 * This type ensures type safety for Ed25519 key operations.
 */
export type TImportableEd25519Key = {
	/** Public key in hexadecimal format */
	publicKeyHex: string;
	/** Private key in hexadecimal format */
	privateKeyHex: string;
	/** Key identifier */
	kid: string;
	/** Key type, must be 'Ed25519' */
	type: 'Ed25519';
};

/**
 * Utility object for validating TImportableEd25519Key objects.
 * Provides type guard functionality to ensure key structure integrity.
 */
export const TImportableEd25519Key = {
	/**
	 * Type guard to validate if an object is a valid TImportableEd25519Key.
	 *
	 * @param key - Object to validate
	 * @returns True if the object is a valid TImportableEd25519Key
	 */
	isValid(key: any): key is TImportableEd25519Key {
		return (
			typeof key === 'object' &&
			key !== null &&
			typeof key.publicKeyHex === 'string' &&
			isHex(key.publicKeyHex) &&
			typeof key.privateKeyHex === 'string' &&
			isHex(key.privateKeyHex) &&
			typeof key.kid === 'string' &&
			key.type === 'Ed25519'
		);
	},
};

/** Multicodec header for Ed25519 public keys */
const MULTICODEC_ED25519_HEADER = new Uint8Array([0xed, 0x01]);

/**
 * Compares two arrays of key-value pairs for equality.
 *
 * @param kv1 - First array of key-value pairs
 * @param kv2 - Second array of key-value pairs
 * @returns True if both arrays contain identical key-value pairs in the same order
 */
export function isEqualKeyValuePair(kv1: IKeyValuePair[], kv2: IKeyValuePair[]): boolean {
	return kv1.every((item, index) => item.key === kv2[index].key && item.value === kv2[index].value);
}

/**
 * Extended English mnemonic class with additional validation patterns.
 * Provides regex pattern matching for mnemonic phrase validation.
 */
export class EnglishMnemonic extends _ {
	/** Regular expression pattern for validating English mnemonic phrases */
	public static readonly _mnemonicMatcher = /^[a-z]+( [a-z]+)*$/;
}

/**
 * Creates signing inputs from an importable Ed25519 key by matching it with verification methods.
 * Supports multiple verification method types and key formats.
 *
 * @param key - The Ed25519 key to create signing inputs from
 * @param verificationMethod - Array of verification methods to match against
 * @returns Signing inputs containing verification method ID and private key
 * @throws Error if key validation fails or no matching verification method is found
 */
export function createSignInputsFromImportableEd25519Key(
	key: TImportableEd25519Key,
	verificationMethod: VerificationMethod[]
): ISignInputs {
	if (!TImportableEd25519Key.isValid(key))
		throw new Error(`Key validation failed. Expected ${Object.values(TImportableEd25519Key).join(', ')}`);

	const publicKey = fromString(key.publicKeyHex, 'hex');

	for (const method of verificationMethod) {
		switch (method.type) {
			case VerificationMethods.Ed255192020:
				const publicKeyMultibase = toMultibaseRaw(publicKey);
				if (method.publicKeyMultibase === publicKeyMultibase) {
					return {
						verificationMethodId: method.id,
						privateKeyHex: key.privateKeyHex,
					};
				}
			case VerificationMethods.Ed255192018:
				const publicKeyBase58 = bases['base58btc'].encode(publicKey).slice(1);
				if (method.publicKeyBase58 === publicKeyBase58) {
					return {
						verificationMethodId: method.id,
						privateKeyHex: key.privateKeyHex,
					};
				}
			case VerificationMethods.JWK:
				const publicKeyJwk: JsonWebKey = {
					crv: 'Ed25519',
					kty: 'OKP',
					x: toString(publicKey, 'base64url'),
				};
				if (JSON.stringify(method.publicKeyJwk) === JSON.stringify(publicKeyJwk)) {
					return {
						verificationMethodId: method.id,
						privateKeyHex: key.privateKeyHex,
					};
				}
		}
		throw new Error(
			`Unsupported verification method type: ${method.type}. Expected one of: ${Object.values(VerificationMethods).join(', ')}`
		);
	}
	throw new Error(
		`No verification method type provided. Expected one of: ${Object.values(VerificationMethods).join(', ')}`
	);
}

/**
 * Creates a raw Ed25519 key pair using the StableLib library.
 *
 * @param seed - Optional seed string for deterministic key generation
 * @returns Raw KeyPair object with publicKey and secretKey as Uint8Arrays
 */
export function createKeyPairRaw(seed?: string): KeyPair {
	return seed ? generateKeyPairFromSeed(fromString(seed)) : generateKeyPair();
}

/**
 * Creates an Ed25519 key pair with Base64-encoded keys.
 *
 * @param seed - Optional seed string for deterministic key generation
 * @returns Key pair with Base64-encoded public and private keys
 */
export function createKeyPairBase64(seed?: string): IKeyPair {
	const keyPair = seed ? generateKeyPairFromSeed(fromString(seed)) : generateKeyPair();
	return {
		publicKey: toString(keyPair.publicKey, 'base64'),
		privateKey: toString(keyPair.secretKey, 'base64'),
	};
}

/**
 * Creates an Ed25519 key pair with hexadecimal-encoded keys.
 *
 * @param seed - Optional seed string for deterministic key generation
 * @returns Key pair with hexadecimal-encoded public and private keys
 */
export function createKeyPairHex(seed?: string): IKeyPair {
	const keyPair = createKeyPairRaw(seed);
	return {
		publicKey: toString(keyPair.publicKey, 'hex'),
		privateKey: toString(keyPair.secretKey, 'hex'),
	};
}

/**
 * Creates verification keys structure with DID URLs and key identifiers.
 * Supports multiple algorithm types and network configurations.
 *
 * @param publicKey - Public key in base64 or hex format
 * @param algo - Algorithm for method-specific ID generation
 * @param keyFragment - Key fragment for the verification key identifier
 * @param network - Cheqd network (defaults to Testnet)
 * @param methodSpecificId - Optional pre-computed method-specific ID
 * @param didUrl - Optional pre-computed DID URL
 * @returns Verification keys structure with all identifiers
 * @throws Error if public key format is invalid
 */
export function createVerificationKeys(
	publicKey: string,
	algo: MethodSpecificIdAlgo,
	keyFragment: TVerificationKey<TVerificationKeyPrefix, number>,
	network: CheqdNetwork = CheqdNetwork.Testnet,
	methodSpecificId?: TMethodSpecificId,
	didUrl?: string
): IVerificationKeys {
	if (isHex(publicKey)) {
		publicKey = toString(fromString(publicKey, 'hex'), 'base64');
	} else if (!isBase64(publicKey)) {
		throw new Error('publicKey validation failed. PublicKey should be in base64 or hex format');
	}

	switch (algo) {
		case MethodSpecificIdAlgo.Base58:
			methodSpecificId ||= bases['base58btc'].encode(base64ToBytes(publicKey));
			didUrl ||= `did:cheqd:${network}:${bases['base58btc']
				.encode(sha256(base64ToBytes(publicKey)).slice(0, 16))
				.slice(1)}`;
			return {
				methodSpecificId,
				didUrl,
				keyId: `${didUrl}#${keyFragment}`,
				publicKey,
			};
		case MethodSpecificIdAlgo.Uuid:
			methodSpecificId ||= v4();
			didUrl ||= `did:cheqd:${network}:${methodSpecificId}`;
			return {
				methodSpecificId,
				didUrl,
				keyId: `${didUrl}#${keyFragment}`,
				publicKey,
			};
	}
}

/**
 * Creates DID verification methods from verification method types and keys.
 * Supports Ed25519 keys in multiple formats (multibase, base58, JWK).
 *
 * @param verificationMethodTypes - Array of verification method types to create
 * @param verificationKeys - Array of verification keys corresponding to each type
 * @returns Array of formatted verification methods for DID documents
 */
export function createDidVerificationMethod(
	verificationMethodTypes: VerificationMethods[],
	verificationKeys: IVerificationKeys[]
): VerificationMethod[] {
	return (
		verificationMethodTypes.map((type, _) => {
			switch (type) {
				case VerificationMethods.Ed255192020:
					return {
						id: verificationKeys[_].keyId,
						type,
						controller: verificationKeys[_].didUrl,
						publicKeyMultibase: toMultibaseRaw(base64ToBytes(verificationKeys[_].publicKey)),
					} as VerificationMethod;
				case VerificationMethods.Ed255192018:
					return {
						id: verificationKeys[_].keyId,
						type,
						controller: verificationKeys[_].didUrl,
						publicKeyBase58: bases['base58btc']
							.encode(base64ToBytes(verificationKeys[_].publicKey))
							.slice(1),
					} as VerificationMethod;
				case VerificationMethods.JWK:
					return {
						id: verificationKeys[_].keyId,
						type,
						controller: verificationKeys[_].didUrl,
						publicKeyJwk: {
							crv: 'Ed25519',
							kty: 'OKP',
							x: toString(fromString(verificationKeys[_].publicKey, 'base64pad'), 'base64url'),
						},
					} as VerificationMethod;
			}
		}) ?? []
	);
}

/**
 * Creates a complete DID document payload with verification methods and controllers.
 *
 * @param verificationMethods - Array of verification methods for the DID
 * @param verificationKeys - Array of verification keys for authentication
 * @param controller - Optional array of controller DIDs (defaults to self-controlled)
 * @returns Complete DID document with all required fields
 * @throws Error if verification methods or keys are missing
 */
export function createDidPayload(
	verificationMethods: VerificationMethod[],
	verificationKeys: IVerificationKeys[],
	controller: string[] = []
): DIDDocument {
	if (!verificationMethods || verificationMethods.length === 0) throw new Error('No verification methods provided');
	if (!verificationKeys || verificationKeys.length === 0) throw new Error('No verification keys provided');

	const did = verificationKeys[0].didUrl;
	return {
		id: did,
		controller: controller.length ? controller : Array.from(new Set(verificationKeys.map((key) => key.didUrl))),
		verificationMethod: verificationMethods,
		authentication: verificationKeys.map((key) => key.keyId),
		assertionMethod: verificationKeys.map((key) => key.keyId),
	} as DIDDocument;
}

/**
 * Validates a DID document against the Cheqd specification and converts to protobuf format.
 * Ensures all required fields are present and verification methods are supported.
 *
 * @param didDocument - DID document to validate
 * @returns Validation result with protobuf conversion or error details
 */
export function validateSpecCompliantPayload(didDocument: DIDDocument): SpecValidationResult {
	// id is required, validated on both compile and runtime
	if (!didDocument?.id) return { valid: false, error: 'id is required' };

	// verificationMethod is required
	if (!didDocument?.verificationMethod) return { valid: false, error: 'verificationMethod is required' };

	// verificationMethod must be an array
	if (!Array.isArray(didDocument?.verificationMethod))
		return { valid: false, error: 'verificationMethod must be an array' };

	// verificationMethod types must be supported
	const protoVerificationMethod = didDocument.verificationMethod.map((vm) => {
		switch (vm?.type) {
			case VerificationMethods.Ed255192020:
				if (!vm.publicKeyMultibase) throw new Error('publicKeyMultibase is required');

				return ProtoVerificationMethod.fromPartial({
					id: vm.id,
					controller: vm.controller,
					verificationMethodType: VerificationMethods.Ed255192020,
					verificationMaterial: vm.publicKeyMultibase,
				});
			case VerificationMethods.JWK:
				if (!vm.publicKeyJwk) throw new Error('publicKeyJwk is required');

				return ProtoVerificationMethod.fromPartial({
					id: vm.id,
					controller: vm.controller,
					verificationMethodType: VerificationMethods.JWK,
					verificationMaterial: JSON.stringify(vm.publicKeyJwk),
				});
			case VerificationMethods.Ed255192018:
				if (!vm.publicKeyBase58) throw new Error('publicKeyBase58 is required');

				return ProtoVerificationMethod.fromPartial({
					id: vm.id,
					controller: vm.controller,
					verificationMethodType: VerificationMethods.Ed255192018,
					verificationMaterial: vm.publicKeyBase58,
				});
			default:
				throw new Error(`Unsupported verificationMethod type: ${vm?.type}`);
		}
	});

	const protoService = normalizeService(didDocument);

	return {
		valid: true,
		protobufVerificationMethod: protoVerificationMethod,
		protobufService: protoService,
	};
}

/**
 * Creates a Cosmos wallet from a seed phrase or private key.
 * Automatically detects whether the input is a mnemonic phrase or hex-encoded private key.
 *
 * @param cosmosPayerSeed - Mnemonic phrase or hexadecimal private key
 * @returns Promise resolving to DirectSecp256k1HdWallet or DirectSecp256k1Wallet
 */
export function createCosmosPayerWallet(
	cosmosPayerSeed: string
): Promise<DirectSecp256k1HdWallet | DirectSecp256k1Wallet> {
	return EnglishMnemonic._mnemonicMatcher.test(cosmosPayerSeed)
		? DirectSecp256k1HdWallet.fromMnemonic(cosmosPayerSeed, { prefix: 'cheqd' })
		: DirectSecp256k1Wallet.fromKey(fromString(cosmosPayerSeed.replace(/^0x/, ''), 'hex'), 'cheqd');
}

/**
 * Converts a raw Ed25519 public key to multibase format with proper multicodec header.
 *
 * @param key - Raw Ed25519 public key as Uint8Array
 * @returns Multibase-encoded string with Ed25519 multicodec prefix
 */
export function toMultibaseRaw(key: Uint8Array) {
	const multibase = new Uint8Array(MULTICODEC_ED25519_HEADER.length + key.length);

	multibase.set(MULTICODEC_ED25519_HEADER);
	multibase.set(key, MULTICODEC_ED25519_HEADER.length);

	return bases['base58btc'].encode(multibase);
}

/**
 * Creates a MsgCreateDidDoc payload ready for signing.
 * Validates the DID document and converts it to protobuf format.
 *
 * @param didPayload - DID document to create message payload from
 * @param versionId - Version identifier for the DID document
 * @returns Encoded message payload bytes ready for signing
 */
export async function createMsgCreateDidDocPayloadToSign(didPayload: DIDDocument, versionId: string) {
	const { protobufVerificationMethod, protobufService } = await DIDModule.validateSpecCompliantPayload(didPayload);
	return MsgCreateDidDocPayload.encode(
		MsgCreateDidDocPayload.fromPartial({
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
			versionId,
		})
	).finish();
}

/** Alias for createMsgCreateDidDocPayloadToSign - used for DID document updates */
export const createMsgUpdateDidDocPayloadToSign = createMsgCreateDidDocPayloadToSign;

/**
 * Creates a MsgDeactivateDidDoc payload ready for signing.
 *
 * @param didPayload - DID document containing the ID to deactivate
 * @param versionId - Optional version identifier for the deactivation
 * @returns Encoded deactivation message payload bytes ready for signing
 */
export function createMsgDeactivateDidDocPayloadToSign(didPayload: DIDDocument, versionId?: string) {
	return MsgDeactivateDidDocPayload.encode(
		MsgDeactivateDidDocPayload.fromPartial({
			id: didPayload.id,
			versionId,
		})
	).finish();
}

/**
 * Creates a MsgCreateResource payload ready for signing.
 *
 * @param payload - Resource creation payload (partial or complete)
 * @returns Encoded resource creation message payload bytes ready for signing
 */
export function createMsgResourcePayloadToSign(payload: Partial<MsgCreateResourcePayload> | MsgCreateResourcePayload) {
	return MsgCreateResourcePayload.encode(MsgCreateResourcePayload.fromPartial(payload)).finish();
}

/**
 * Derives a Cosmos account address from a hexadecimal public key.
 * Converts the public key to the appropriate format and generates a bech32 address.
 *
 * @param publicKeyHex - Secp256k1 public key in hexadecimal format
 * @returns Bech32-encoded Cheqd account address
 */
export function getCosmosAccount(publicKeyHex: string): string {
	const { publicKeyConvert } = pkg;

	return toBech32('cheqd', rawSecp256k1PubkeyToRawAddress(publicKeyConvert(fromString(publicKeyHex, 'hex'), true)));
}

/**
 * Checks the balance of all coins for a given address on the blockchain.
 *
 * @param address - Bech32-encoded account address to check balance for
 * @param rpcAddress - RPC endpoint URL of the blockchain node
 * @returns Promise resolving to array of coin balances
 */
export async function checkBalance(address: string, rpcAddress: string): Promise<readonly Coin[]> {
	const client = await StargateClient.connect(rpcAddress);

	return await client.getAllBalances(address);
}

/**
 * Checks if a given input is valid JSON.
 *
 * @param input - Input to validate as JSON
 * @returns True if the input is a valid JSON string
 */
export function isJSON(input: any): boolean {
	if (typeof input !== 'string') return false;
	try {
		JSON.parse(input);
		return true;
	} catch (e) {
		return false;
	}
}

/** Default configuration options for exponential backoff retry logic */
export const DefaultBackoffOptions: BackoffOptions = {
	jitter: 'full',
	timeMultiple: 1,
	delayFirstAttempt: false,
	maxDelay: 100,
	startingDelay: 100,
	numOfAttempts: 3,
} as const;

/**
 * Retries a function with exponential backoff strategy.
 * Provides configurable retry logic with jitter and delay options.
 *
 * @template T - Return type of the function being retried
 * @param fn - Async function to retry
 * @param options - Optional backoff configuration (uses defaults if not provided)
 * @returns Promise resolving to the function result or undefined if all retries fail
 */
export async function retry<T>(fn: () => Promise<T>, options?: BackoffOptions): Promise<T | undefined> {
	// set default options
	if (!options) {
		options = DefaultBackoffOptions;
	} else {
		// overwrite defaults with user supplied options
		options = { ...DefaultBackoffOptions, ...options };
	}

	let result: T | undefined;

	try {
		result = await backOff(fn, options);
	} catch (e) {
		console.error(e);
	}

	return result;
}

/**
 * Validates if a string is properly formatted Base64.
 * Performs pattern matching and encoding validation.
 *
 * @param str - String to validate as Base64
 * @returns True if the string is valid Base64
 */
function isBase64(str: string): boolean {
	// Quick pattern check to filter obvious non-base64 strings
	const base64Pattern = /^[A-Za-z0-9+/]*={0,3}$/;
	if (!base64Pattern.test(str)) {
		return false;
	}

	try {
		return toString(fromString(str, 'base64'), 'base64') === str;
	} catch (e) {
		return false;
	}
}

/**
 * Validates if a string is properly formatted hexadecimal.
 * Performs pattern matching and encoding validation.
 *
 * @param str - String to validate as hexadecimal
 * @returns True if the string is valid hexadecimal
 */
function isHex(str: string): boolean {
	// Quick pattern check to filter obvious non-hex strings
	const hexPattern = /^[0-9a-fA-F]*$/;
	if (!hexPattern.test(str)) {
		return false;
	}

	try {
		return toString(fromString(str, 'hex'), 'hex') === str;
	} catch {
		return false;
	}
}

/**
 * Normalizes the authentication property of a DID document to an array of strings.
 * Handles both string references and embedded verification method objects.
 *
 * @param didDocument - DID document to normalize authentication for
 * @returns Array of authentication method identifiers
 * @throws Error if authentication section is missing
 */
export function normalizeAuthentication(didDocument: DIDDocument): string[] {
	if (!didDocument.authentication)
		throw new Error('Invalid DID Document: Authentication section is required in DID Document');

	const authArray = Array.isArray(didDocument.authentication)
		? didDocument.authentication
		: [didDocument.authentication];

	return authArray.map((a) => (typeof a === 'string' ? a : a.id));
}

/**
 * Normalizes the controller property of a DID document to an array of strings.
 * Defaults to self-controlled if no controller is specified.
 *
 * @param didDocument - DID document to normalize controller for
 * @returns Array of controller DID identifiers
 */
export function normalizeController(didDocument: DIDDocument): string[] {
	if (!didDocument.controller) return [didDocument.id];

	return Array.isArray(didDocument.controller) ? didDocument.controller : [didDocument.controller];
}

/**
 * Normalizes DID document services to protobuf format.
 * Converts service endpoints to arrays and includes optional properties.
 *
 * @param didDocument - DID document containing services to normalize
 * @returns Array of protobuf-formatted services or undefined if no services
 */
export function normalizeService(didDocument: DIDDocument): ProtoService[] | undefined {
	return didDocument.service?.map((s) => {
		return ProtoService.fromPartial({
			id: s?.id,
			serviceType: s?.type,
			serviceEndpoint: s ? (Array.isArray(s.serviceEndpoint) ? s.serviceEndpoint : [s.serviceEndpoint]) : [],
			...(s?.recipientKeys && { recipientKeys: s.recipientKeys }),
			...(s?.routingKeys && { routingKeys: s.routingKeys }),
			...(s?.accept && { accept: s.accept }),
			...(s?.priority !== undefined && { priority: s.priority }),
		});
	});
}

/**
 * Converts protobuf services back to standard DID document service format.
 * Handles special context requirements for LinkedDomains services.
 *
 * @param didDocument - Protobuf DID document containing services to denormalize
 * @returns Array of standard DID document services
 */
export function denormalizeService(didDocument: DidDoc): Service[] {
	return didDocument.service.map((s) => {
		if (s.serviceType === ServiceType.LinkedDomains) {
			const updatedContext = [...didDocument.context, contexts.LinkedDomainsContext];
			didDocument = { ...didDocument, context: updatedContext };
		}

		return {
			id: s.id,
			type: s.serviceType,
			serviceEndpoint: Array.isArray(s?.serviceEndpoint)
				? s.serviceEndpoint.length === 1
					? s.serviceEndpoint[0]
					: s.serviceEndpoint
				: s?.serviceEndpoint,
			...(s.recipientKeys && { recipientKeys: s.recipientKeys }),
			...(s.routingKeys && { routingKeys: s.routingKeys }),
			...(s.accept && { accept: s.accept }),
			...(s.priority !== undefined && { priority: s.priority }),
		};
	});
}
