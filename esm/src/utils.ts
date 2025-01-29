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
} from './types.js';
import { fromString, toString } from 'uint8arrays';
import { bases } from 'multiformats/basics';
import { base64ToBytes } from 'did-jwt';
import { generateKeyPair, generateKeyPairFromSeed, KeyPair } from '@stablelib/ed25519';
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { EnglishMnemonic as _, sha256 } from '@cosmjs/crypto';
import { rawSecp256k1PubkeyToRawAddress } from '@cosmjs/amino';
import pkg from 'secp256k1';
import { v4 } from 'uuid';
import {
	VerificationMethod as ProtoVerificationMethod,
	Service as ProtoService,
	MsgCreateDidDocPayload,
	MsgDeactivateDidDocPayload,
} from '@cheqd/ts-proto/cheqd/did/v2/index.js';
import { DIDModule } from './modules/did.js';
import { MsgCreateResourcePayload } from '@cheqd/ts-proto/cheqd/resource/v2/index.js';
import { toBech32 } from '@cosmjs/encoding';
import { StargateClient } from '@cosmjs/stargate';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

export type TImportableEd25519Key = {
	publicKeyHex: string;
	privateKeyHex: string;
	kid: string;
	type: 'Ed25519';
};

const MULTICODEC_ED25519_HEADER = new Uint8Array([0xed, 0x01]);

export function isEqualKeyValuePair(kv1: IKeyValuePair[], kv2: IKeyValuePair[]): boolean {
	return kv1.every((item, index) => item.key === kv2[index].key && item.value === kv2[index].value);
}

export class EnglishMnemonic extends _ {
	public static readonly _mnemonicMatcher = /^[a-z]+( [a-z]+)*$/;
}

export function createSignInputsFromImportableEd25519Key(
	key: TImportableEd25519Key,
	verificationMethod: VerificationMethod[]
): ISignInputs {
	if (verificationMethod?.length === 0) throw new Error('No verification methods provided');

	const publicKey = fromString(key.publicKeyHex, 'hex');

	for (const method of verificationMethod) {
		switch (method?.type) {
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
	}

	throw new Error('No verification method type provided');
}

export function createKeyPairRaw(seed?: string): KeyPair {
	return seed ? generateKeyPairFromSeed(fromString(seed)) : generateKeyPair();
}

export function createKeyPairBase64(seed?: string): IKeyPair {
	const keyPair = seed ? generateKeyPairFromSeed(fromString(seed)) : generateKeyPair();
	return {
		publicKey: toString(keyPair.publicKey, 'base64'),
		privateKey: toString(keyPair.secretKey, 'base64'),
	};
}

export function createKeyPairHex(seed?: string): IKeyPair {
	const keyPair = createKeyPairRaw(seed);
	return {
		publicKey: toString(keyPair.publicKey, 'hex'),
		privateKey: toString(keyPair.secretKey, 'hex'),
	};
}

export function createVerificationKeys(
	publicKey: string,
	algo: MethodSpecificIdAlgo,
	key: TVerificationKey<TVerificationKeyPrefix, number>,
	network: CheqdNetwork = CheqdNetwork.Testnet
): IVerificationKeys {
	let methodSpecificId: TMethodSpecificId;
	let didUrl: IVerificationKeys['didUrl'];

	publicKey = publicKey.length == 43 ? publicKey : toString(fromString(publicKey, 'hex'), 'base64');
	switch (algo) {
		case MethodSpecificIdAlgo.Base58:
			methodSpecificId = bases['base58btc'].encode(base64ToBytes(publicKey));
			didUrl = `did:cheqd:${network}:${bases['base58btc']
				.encode(sha256(base64ToBytes(publicKey)).slice(0, 16))
				.slice(1)}`;
			return {
				methodSpecificId,
				didUrl,
				keyId: `${didUrl}#${key}`,
				publicKey,
			};
		case MethodSpecificIdAlgo.Uuid:
			methodSpecificId = bases['base58btc'].encode(base64ToBytes(publicKey));
			didUrl = `did:cheqd:${network}:${v4()}`;
			return {
				methodSpecificId,
				didUrl,
				keyId: `${didUrl}#${key}`,
				publicKey,
			};
	}
}

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
						publicKeyBase58: verificationKeys[_].methodSpecificId.slice(1),
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

export function createDidPayload(
	verificationMethods: VerificationMethod[],
	verificationKeys: IVerificationKeys[]
): DIDDocument {
	if (!verificationMethods || verificationMethods.length === 0) throw new Error('No verification methods provided');
	if (!verificationKeys || verificationKeys.length === 0) throw new Error('No verification keys provided');

	const did = verificationKeys[0].didUrl;
	return {
		id: did,
		controller: verificationKeys.map((key) => key.didUrl),
		verificationMethod: verificationMethods,
		authentication: verificationKeys.map((key) => key.keyId),
	} as DIDDocument;
}

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

	const protoService = didDocument?.service?.map((s) => {
		return ProtoService.fromPartial({
			id: s?.id,
			serviceType: s?.type,
			serviceEndpoint: <string[]>s?.serviceEndpoint,
		});
	});

	return { valid: true, protobufVerificationMethod: protoVerificationMethod, protobufService: protoService };
}

export function createCosmosPayerWallet(
	cosmosPayerSeed: string
): Promise<DirectSecp256k1HdWallet | DirectSecp256k1Wallet> {
	return EnglishMnemonic._mnemonicMatcher.test(cosmosPayerSeed)
		? DirectSecp256k1HdWallet.fromMnemonic(cosmosPayerSeed, { prefix: 'cheqd' })
		: DirectSecp256k1Wallet.fromKey(fromString(cosmosPayerSeed.replace(/^0x/, ''), 'hex'), 'cheqd');
}

export function toMultibaseRaw(key: Uint8Array) {
	const multibase = new Uint8Array(MULTICODEC_ED25519_HEADER.length + key.length);

	multibase.set(MULTICODEC_ED25519_HEADER);
	multibase.set(key, MULTICODEC_ED25519_HEADER.length);

	return bases['base58btc'].encode(multibase);
}

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

export const createMsgUpdateDidDocPayloadToSign = createMsgCreateDidDocPayloadToSign;

export function createMsgDeactivateDidDocPayloadToSign(didPayload: DIDDocument, versionId?: string) {
	return MsgDeactivateDidDocPayload.encode(
		MsgDeactivateDidDocPayload.fromPartial({
			id: didPayload.id,
			versionId,
		})
	).finish();
}

export function createMsgResourcePayloadToSign(payload: Partial<MsgCreateResourcePayload> | MsgCreateResourcePayload) {
	return MsgCreateResourcePayload.encode(MsgCreateResourcePayload.fromPartial(payload)).finish();
}

export function getCosmosAccount(publicKeyHex: string): string {
	const { publicKeyConvert } = pkg;
	return toBech32('cheqd', rawSecp256k1PubkeyToRawAddress(publicKeyConvert(fromString(publicKeyHex, 'hex'), true)));
}

export async function checkBalance(address: string, rpcAddress: string): Promise<readonly Coin[]> {
	const client = await StargateClient.connect(rpcAddress);
	return await client.getAllBalances(address);
}

export function isJSON(input: any): boolean {
	if (typeof input !== 'string') return false;
	try {
		JSON.parse(input);
		return true;
	} catch (e) {
		return false;
	}
}
