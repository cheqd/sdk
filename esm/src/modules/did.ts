import { createPagination, createProtobufRpcClient, DeliverTxResponse, QueryClient } from '@cosmjs/stargate';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_.js';
import { CheqdSigningStargateClient } from '../signer.js';
import {
	DIDDocument,
	DidStdFee,
	IContext,
	ISignInputs,
	QueryExtensionSetup,
	SpecValidationResult,
	VerificationMethods,
	DIDDocumentWithMetadata,
	ServiceType,
	AuthenticationValidationResult,
} from '../types.js';
import {
	MsgCreateDidDoc,
	MsgCreateDidDocPayload,
	MsgCreateDidDocResponse,
	MsgDeactivateDidDoc,
	MsgDeactivateDidDocPayload,
	MsgDeactivateDidDocResponse,
	MsgUpdateDidDoc,
	MsgUpdateDidDocPayload,
	MsgUpdateDidDocResponse,
	protobufPackage,
	QueryClientImpl,
	Service,
	SignInfo,
	VerificationMethod,
	QueryAllDidDocVersionsMetadataResponse,
	DidDocWithMetadata,
	DidDoc,
	Metadata,
} from '@cheqd/ts-proto/cheqd/did/v2/index.js';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing';
import { v4 } from 'uuid';
import { assert } from '@cosmjs/utils';
import { PageRequest } from '@cheqd/ts-proto/cosmos/base/query/v1beta1/pagination.js';
import { CheqdQuerier } from '../querier.js';
import { DIDDocumentMetadata } from 'did-resolver';
import { denormalizeService, normalizeAuthentication, normalizeController, normalizeService } from '../utils.js';

export const defaultDidExtensionKey = 'did' as const;

export const contexts = {
	W3CDIDv1: 'https://www.w3.org/ns/did/v1',
	W3CSuiteEd255192020: 'https://w3id.org/security/suites/ed25519-2020/v1',
	W3CSuiteEd255192018: 'https://w3id.org/security/suites/ed25519-2018/v1',
	W3CSuiteJws2020: 'https://w3id.org/security/suites/jws-2020/v1',
	LinkedDomainsContext: 'https://identity.foundation/.well-known/did-configuration/v1',
} as const;

export const protobufLiterals = {
	MsgCreateDidDoc: 'MsgCreateDidDoc',
	MsgCreateDidDocResponse: 'MsgCreateDidDocResponse',
	MsgUpdateDidDoc: 'MsgUpdateDidDoc',
	MsgUpdateDidDocResponse: 'MsgUpdateDidDocResponse',
	MsgDeactivateDidDoc: 'MsgDeactivateDidDoc',
	MsgDeactivateDidDocResponse: 'MsgDeactivateDidDocResponse',
} as const;
export const typeUrlMsgCreateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgCreateDidDoc}` as const;
export const typeUrlMsgCreateDidDocResponse =
	`/${protobufPackage}.${protobufLiterals.MsgCreateDidDocResponse}` as const;
export const typeUrlMsgUpdateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgUpdateDidDoc}` as const;
export const typeUrlMsgUpdateDidDocResponse =
	`/${protobufPackage}.${protobufLiterals.MsgUpdateDidDocResponse}` as const;
export const typeUrlMsgDeactivateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgDeactivateDidDoc}` as const;
export const typeUrlMsgDeactivateDidDocResponse =
	`/${protobufPackage}.${protobufLiterals.MsgDeactivateDidDocResponse}` as const;

export interface MsgCreateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDoc;
	readonly value: Partial<MsgCreateDidDoc>;
}

export function isMsgCreateDidDocEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDoc;
}

export function isMsgUpdateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDoc;
}

export function isMsgDeactivateDidDocEncodeObject(obj: EncodeObject): obj is MsgDeactivateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgDeactivateDidDoc;
}

export interface MsgCreateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDocResponse;
	readonly value: Partial<MsgCreateDidDocResponse>;
}

export function MsgCreateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDocResponse;
}

export interface MsgUpdateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDoc;
	readonly value: Partial<MsgUpdateDidDoc>;
}

export function MsgUpdateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDoc;
}

export interface MsgUpdateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDocResponse;
	readonly value: Partial<MsgUpdateDidDocResponse>;
}

export function MsgUpdateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse;
}

export interface MsgDeactivateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDoc;
	readonly value: Partial<MsgDeactivateDidDoc>;
}

export function MsgDeactivateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgDeactivateDidDoc;
}

export interface MsgDeactivateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDocResponse;
	readonly value: Partial<MsgDeactivateDidDocResponse>;
}

export function MsgDeactiveDidDocResponseEncodeObject(
	obj: EncodeObject
): obj is MsgDeactivateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse;
}

export type MinimalImportableDIDModule = MinimalImportableCheqdSDKModule<DIDModule>;

export type DidExtension = {
	readonly [defaultDidExtensionKey]: {
		readonly didDoc: (id: string) => Promise<DidDocWithMetadata>;
		readonly didDocVersion: (id: string, versionId: string) => Promise<DidDocWithMetadata>;
		readonly allDidDocVersionsMetadata: (
			id: string,
			paginationKey?: Uint8Array
		) => Promise<QueryAllDidDocVersionsMetadataResponse>;
	};
};

export const setupDidExtension = (base: QueryClient): DidExtension => {
	const rpc = createProtobufRpcClient(base);

	const queryService = new QueryClientImpl(rpc);

	return {
		[defaultDidExtensionKey]: {
			didDoc: async (id: string) => {
				const { value } = await queryService.DidDoc({ id });
				assert(value);
				return value;
			},
			didDocVersion: async (id: string, versionId: string) => {
				const { value } = await queryService.DidDocVersion({ id, version: versionId });
				assert(value);
				return value;
			},
			allDidDocVersionsMetadata: async (id: string, paginationKey?: Uint8Array) => {
				const response = await queryService.AllDidDocVersionsMetadata({
					id,
					pagination: createPagination(paginationKey) as PageRequest | undefined,
				});
				return response;
			},
		},
	} as DidExtension;
};

export class DIDModule extends AbstractCheqdSDKModule {
	// @ts-expect-error underlying type `GeneratedType` is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlMsgCreateDidDoc, MsgCreateDidDoc],
		[typeUrlMsgCreateDidDocResponse, MsgCreateDidDocResponse],
		[typeUrlMsgUpdateDidDoc, MsgUpdateDidDoc],
		[typeUrlMsgUpdateDidDocResponse, MsgUpdateDidDocResponse],
		[typeUrlMsgDeactivateDidDoc, MsgDeactivateDidDoc],
		[typeUrlMsgDeactivateDidDocResponse, MsgDeactivateDidDocResponse],
	];

	static readonly baseMinimalDenom = 'ncheq' as const;

	static readonly fees = {
		DefaultCreateDidDocFee: { amount: '50000000000', denom: DIDModule.baseMinimalDenom } as const,
		DefaultUpdateDidDocFee: { amount: '25000000000', denom: DIDModule.baseMinimalDenom } as const,
		DefaultDeactivateDidDocFee: { amount: '10000000000', denom: DIDModule.baseMinimalDenom } as const,
	} as const;

	static readonly querierExtensionSetup: QueryExtensionSetup<DidExtension> = setupDidExtension;

	querier: CheqdQuerier & DidExtension;

	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & DidExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			createDidDocTx: this.createDidDocTx.bind(this),
			updateDidDocTx: this.updateDidDocTx.bind(this),
			deactivateDidDocTx: this.deactivateDidDocTx.bind(this),
			queryDidDoc: this.queryDidDoc.bind(this),
			queryDidDocVersion: this.queryDidDocVersion.bind(this),
			queryAllDidDocVersionsMetadata: this.queryAllDidDocVersionsMetadata.bind(this),
		};
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return DIDModule.registryTypes;
	}

	public getQuerierExtensionSetup(): QueryExtensionSetup<DidExtension> {
		return DIDModule.querierExtensionSetup;
	}

	async createDidDocTx(
		signInputs: ISignInputs[] | SignInfo[],
		didPayload: DIDDocument,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo?: string,
		versionId?: string,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer;
		}

		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}

		if (!versionId || versionId === '') {
			versionId = v4();
		}

		const { valid, error, protobufVerificationMethod, protobufService } =
			await DIDModule.validateSpecCompliantPayload(didPayload);

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`);
		}

		const { valid: authenticationValid, error: authenticationError } =
			await DIDModule.validateAuthenticationAgainstSignatures(didPayload, signInputs as SignInfo[], this.querier);

		if (!authenticationValid) {
			throw new Error(`DID authentication is not valid: ${authenticationError}`);
		}

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

		let signatures: SignInfo[];
		if (ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signCreateDidDocTx(signInputs, payload);
		} else {
			signatures = signInputs;
		}

		const value: MsgCreateDidDoc = {
			payload,
			signatures,
		};

		const createDidMsg: MsgCreateDidDocEncodeObject = {
			typeUrl: typeUrlMsgCreateDidDoc,
			value,
		};

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address;
		}

		if (!fee) {
			fee = await DIDModule.generateCreateDidDocFees(address);
		}

		return this._signer.signAndBroadcast(address, [createDidMsg], fee!, memo);
	}

	async updateDidDocTx(
		signInputs: ISignInputs[] | SignInfo[],
		didPayload: DIDDocument,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo?: string,
		versionId?: string,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer;
		}

		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}

		if (!versionId || versionId === '') {
			versionId = v4();
		}

		const { valid, error, protobufVerificationMethod, protobufService } =
			await DIDModule.validateSpecCompliantPayload(didPayload);

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`);
		}

		const {
			valid: authenticationValid,
			error: authenticationError,
			externalControllersDocuments,
			previousDidDocument,
		} = await DIDModule.validateAuthenticationAgainstSignaturesKeyRotation(
			didPayload,
			signInputs as SignInfo[],
			this.querier
		);

		if (!authenticationValid) {
			throw new Error(`DID authentication is not valid: ${authenticationError}`);
		}

		const payload = MsgUpdateDidDocPayload.fromPartial({
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

		let signatures: SignInfo[];
		if (ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signUpdateDidDocTx(
				signInputs,
				payload,
				externalControllersDocuments,
				previousDidDocument
			);
		} else {
			signatures = signInputs;
		}

		const value: MsgUpdateDidDoc = {
			payload,
			signatures,
		};

		const updateDidMsg: MsgUpdateDidDocEncodeObject = {
			typeUrl: typeUrlMsgUpdateDidDoc,
			value,
		};

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address;
		}

		if (!fee) {
			fee = await DIDModule.generateUpdateDidDocFees(address);
		}

		return this._signer.signAndBroadcast(address, [updateDidMsg], fee!, memo);
	}

	async deactivateDidDocTx(
		signInputs: ISignInputs[] | SignInfo[],
		didPayload: DIDDocument,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo?: string,
		versionId?: string,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer;
		}

		if (!versionId || versionId === '') {
			versionId = v4();
		}

		const { valid, error, protobufVerificationMethod } = await DIDModule.validateSpecCompliantPayload(didPayload);

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`);
		}

		const { valid: authenticationValid, error: authenticationError } =
			await DIDModule.validateAuthenticationAgainstSignatures(didPayload, signInputs as SignInfo[], this.querier);

		if (!authenticationValid) {
			throw new Error(`DID authentication is not valid: ${authenticationError}`);
		}

		const payload = MsgDeactivateDidDocPayload.fromPartial({
			id: didPayload.id,
			versionId: versionId,
		});

		let signatures: SignInfo[];
		if (ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signDeactivateDidDocTx(signInputs, payload, protobufVerificationMethod!);
		} else {
			signatures = signInputs;
		}

		const value: MsgDeactivateDidDoc = {
			payload,
			signatures,
		};

		const deactivateDidMsg: MsgDeactivateDidDocEncodeObject = {
			typeUrl: typeUrlMsgDeactivateDidDoc,
			value,
		};

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address;
		}

		if (!fee) {
			fee = await DIDModule.generateDeactivateDidDocFees(address);
		}

		return this._signer.signAndBroadcast(address, [deactivateDidMsg], fee!, memo);
	}

	async queryDidDoc(id: string, context?: IContext): Promise<DIDDocumentWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		const { didDoc, metadata } = await this.querier[defaultDidExtensionKey].didDoc(id);
		return {
			didDocument: await DIDModule.toSpecCompliantPayload(didDoc!),
			didDocumentMetadata: await DIDModule.toSpecCompliantMetadata(metadata!),
		} as DIDDocumentWithMetadata;
	}

	async queryDidDocVersion(id: string, versionId: string, context?: IContext): Promise<DIDDocumentWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		const { didDoc, metadata } = await this.querier[defaultDidExtensionKey].didDocVersion(id, versionId);
		return {
			didDocument: await DIDModule.toSpecCompliantPayload(didDoc!),
			didDocumentMetadata: await DIDModule.toSpecCompliantMetadata(metadata!),
		} as DIDDocumentWithMetadata;
	}

	async queryAllDidDocVersionsMetadata(
		id: string,
		context?: IContext
	): Promise<{
		didDocumentVersionsMetadata: DIDDocumentMetadata[];
		pagination: QueryAllDidDocVersionsMetadataResponse['pagination'];
	}> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier;
		}
		const { versions, pagination } = await this.querier[defaultDidExtensionKey].allDidDocVersionsMetadata(id);
		return {
			didDocumentVersionsMetadata: await Promise.all(
				versions.map(async (m) => await DIDModule.toSpecCompliantMetadata(m))
			),
			pagination,
		};
	}

	static async validateSpecCompliantPayload(didDocument: DIDDocument): Promise<SpecValidationResult> {
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
					if (!vm?.publicKeyMultibase) throw new Error('publicKeyMultibase is required');

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.Ed255192020,
						verificationMaterial: vm.publicKeyMultibase,
					});
				case VerificationMethods.JWK:
					if (!vm?.publicKeyJwk) throw new Error('publicKeyJwk is required');

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.JWK,
						verificationMaterial: JSON.stringify(vm.publicKeyJwk),
					});
				case VerificationMethods.Ed255192018:
					if (!vm?.publicKeyBase58) throw new Error('publicKeyBase58 is required');

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.Ed255192018,
						verificationMaterial: vm.publicKeyBase58,
					});
				default:
					throw new Error('Unsupported verificationMethod type');
			}
		});

		const protoService = normalizeService(didDocument);

		return {
			valid: true,
			protobufVerificationMethod: protoVerificationMethod,
			protobufService: protoService,
		} as SpecValidationResult;
	}

	static async toSpecCompliantPayload(protobufDidDocument: DidDoc): Promise<DIDDocument> {
		const verificationMethod = protobufDidDocument.verificationMethod.map((vm) => {
			switch (vm.verificationMethodType) {
				case VerificationMethods.Ed255192020:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteEd255192020))
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteEd255192020];
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyMultibase: vm.verificationMaterial,
					};
				case VerificationMethods.JWK:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteJws2020))
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteJws2020];
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyJwk: JSON.parse(vm.verificationMaterial),
					};
				case VerificationMethods.Ed255192018:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteEd255192018))
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteEd255192018];
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyBase58: vm.verificationMaterial,
					};
				default:
					throw new Error('Unsupported verificationMethod type'); // should never happen
			}
		});

		const service = denormalizeService(protobufDidDocument);

		const context = (function () {
			if (protobufDidDocument.context.includes(contexts.W3CDIDv1)) return protobufDidDocument.context;

			return [contexts.W3CDIDv1, ...protobufDidDocument.context];
		})();

		const assertionMethod = protobufDidDocument.assertionMethod.map((am) => {
			try {
				// Check if the assertionMethod is a DID URL
				if (!am.startsWith('did:cheqd:')) {
					// Parse once if it's a stringified JSON
					const parsedAm = JSON.parse(am);
					if (typeof parsedAm === 'string') {
						// Parse again only if necessary
						return JSON.parse(parsedAm);
					}
					return parsedAm;
				}
				return am;
			} catch (error) {
				throw new Error(`Unsupported assertionMethod type: ${am}`);
			}
		});

		const specCompliant = {
			'@context': context,
			id: protobufDidDocument.id,
			controller: protobufDidDocument.controller,
			verificationMethod: verificationMethod,
			authentication: protobufDidDocument.authentication,
			assertionMethod: assertionMethod,
			capabilityInvocation: protobufDidDocument.capabilityInvocation,
			capabilityDelegation: protobufDidDocument.capabilityDelegation,
			keyAgreement: protobufDidDocument.keyAgreement,
			service: service,
			alsoKnownAs: protobufDidDocument.alsoKnownAs,
		} as DIDDocument;

		if (!protobufDidDocument.authentication?.length) delete specCompliant.authentication;
		if (!protobufDidDocument.assertionMethod?.length) delete specCompliant.assertionMethod;
		if (!protobufDidDocument.capabilityInvocation?.length) delete specCompliant.capabilityInvocation;
		if (!protobufDidDocument.capabilityDelegation?.length) delete specCompliant.capabilityDelegation;
		if (!protobufDidDocument.keyAgreement?.length) delete specCompliant.keyAgreement;
		if (!protobufDidDocument.service?.length) delete specCompliant.service;
		if (!protobufDidDocument.alsoKnownAs?.length) delete specCompliant.alsoKnownAs;

		return specCompliant;
	}

	static async toSpecCompliantMetadata(protobufDidDocument: Metadata): Promise<DIDDocumentMetadata> {
		return {
			created: protobufDidDocument.created?.toISOString(),
			updated: protobufDidDocument.updated?.toISOString(),
			deactivated: protobufDidDocument.deactivated,
			versionId: protobufDidDocument.versionId,
			nextVersionId: protobufDidDocument?.nextVersionId,
			previousVersionId: protobufDidDocument?.previousVersionId,
		};
	}

	static async validateAuthenticationAgainstSignatures(
		didDocument: DIDDocument,
		signatures: readonly SignInfo[],
		querier?: CheqdQuerier & DidExtension,
		externalControllersDidDocuments?: DIDDocument[]
	): Promise<AuthenticationValidationResult> {
		// validate signatures - case: no signatures
		if (!signatures || !signatures.length) return { valid: false, error: 'signatures are required' };

		// validate authentication - case: no authentication when at least one verificationMethod
		if (
			(!didDocument.authentication || !didDocument.authentication.length) &&
			didDocument.verificationMethod?.length
		)
			return { valid: false, error: 'authentication is required' };

		const normalizedAuthentication = normalizeAuthentication(didDocument);

		// define unique authentication
		const uniqueAuthentication = new Set<string>(normalizedAuthentication);

		// validate authentication - case: authentication contains duplicates
		if (uniqueAuthentication.size < normalizedAuthentication.length)
			return {
				valid: false,
				error: `authentication contains duplicate key references: duplicate key reference ${Array.from(uniqueAuthentication).find((a) => normalizeAuthentication(didDocument).filter((aa) => aa === a).length > 1)}`,
			};

		// define unique signatures - shallow, only verificationMethodId, no signature
		const uniqueSignatures = new Set(signatures.map((s) => s.verificationMethodId));

		// validate signatures - case: signatures contain duplicates
		if (uniqueSignatures.size < signatures.length)
			return {
				valid: false,
				error: `signatures contain duplicates: duplicate signature for key reference ${Array.from(uniqueSignatures).find((s) => signatures.filter((ss) => ss.verificationMethodId === s).length > 1)}`,
			};

		// validate authentication - case: authentication contains invalid key references
		if (!Array.from(uniqueAuthentication).every((a) => didDocument.verificationMethod?.some((vm) => vm.id === a)))
			return {
				valid: false,
				error: `authentication contains invalid key references: invalid key reference ${Array.from(uniqueAuthentication).find((a) => !didDocument.verificationMethod?.some((vm) => vm.id === a))}`,
			};

		// define whether external controller or not
		const externalController = normalizeController(didDocument).some((c) => c !== didDocument.id);

		// validate authentication - case: authentication matches signatures, unique, if no external controller
		if (!Array.from(uniqueAuthentication).every((a) => uniqueSignatures.has(a)) && !externalController)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueAuthentication).find((a) => !uniqueSignatures.has(a))} is missing`,
			};

		// validate signatures - case: authentication matches signatures, unique, excessive signatures, no external controller
		if (!Array.from(uniqueSignatures).every((s) => uniqueAuthentication.has(s)) && !externalController)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignatures).find((s) => !uniqueAuthentication.has(s))} is not required`,
			};

		// return, if no external controller
		if (!externalController) return { valid: true };

		// require querier
		if (!querier) throw new Error('querier is required for external controller validation');

		// get external controllers
		const externalControllers = normalizeController(didDocument).filter((c) => c !== didDocument.id);

		// get external controllers' documents
		const externalControllersDocuments = await Promise.all(
			externalControllers?.map(async (c) => {
				// compute index of external controller's document, if provided
				const externalControllerDocumentIndex = externalControllersDidDocuments?.findIndex((d) => d.id === c);

				// get external controller's document, if provided
				if (externalControllerDocumentIndex !== undefined && externalControllerDocumentIndex !== -1)
					return externalControllersDidDocuments?.[externalControllerDocumentIndex];

				// fetch external controller's document
				const protobufDocument = await querier[defaultDidExtensionKey].didDoc(c);

				// throw, if not found
				if (!protobufDocument || !protobufDocument.didDoc)
					throw new Error(`Document for controller ${c} not found`);

				// convert to spec compliant payload
				return await DIDModule.toSpecCompliantPayload(protobufDocument.didDoc);
			})
		);

		// define unique required signatures
		const uniqueRequiredSignatures: Set<string> = new Set(
			externalControllersDocuments.concat(didDocument).flatMap((d) => (d ? normalizeAuthentication(d) : []))
		);

		// validate authentication - case: authentication matches signatures, unique, if external controller
		if (!Array.from(uniqueRequiredSignatures).every((a) => uniqueSignatures.has(a)))
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueRequiredSignatures).find((a) => !uniqueSignatures.has(a))} is missing`,
			};

		// validate authentication - case: authentication matches signatures, unique, excessive signatures, if external controller
		if (uniqueRequiredSignatures.size < uniqueSignatures.size)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignatures).find((s) => !uniqueRequiredSignatures.has(s))} is not required`,
			};

		// return valid
		return { valid: true };
	}

	static async validateAuthenticationAgainstSignaturesKeyRotation(
		didDocument: DIDDocument,
		signatures: readonly SignInfo[],
		querier: CheqdQuerier & DidExtension,
		previousDidDocument?: DIDDocument,
		externalControllersDidDocuments?: DIDDocument[]
	): Promise<AuthenticationValidationResult> {
		// validate signatures - case: no signatures
		if (!signatures || !signatures.length) return { valid: false, error: 'signatures are required' };

		// validate authentication - case: no authentication when at least one verificationMethod
		if (
			(!didDocument.authentication || !didDocument.authentication.length) &&
			didDocument.verificationMethod?.length
		)
			return { valid: false, error: 'authentication is required' };

		// define unique authentication
		const authentication = normalizeAuthentication(didDocument);
		const uniqueAuthentication = new Set<string>(authentication);

		// validate authentication - case: authentication contains duplicates
		if (uniqueAuthentication.size < authentication.length)
			return {
				valid: false,
				error: `authentication contains duplicate key references: duplicate key reference ${Array.from(uniqueAuthentication).find((a) => normalizeAuthentication(didDocument).filter((aa) => aa === a).length > 1)}`,
			};

		// define unique signatures
		const uniqueSignatures = new Set(signatures.map((s) => s.verificationMethodId));

		// validate authentication - case: authentication contains invalid key references
		if (!Array.from(uniqueAuthentication).every((a) => didDocument.verificationMethod?.some((vm) => vm.id === a)))
			return {
				valid: false,
				error: `authentication contains invalid key references: invalid key reference ${Array.from(uniqueAuthentication).find((a) => !didDocument.verificationMethod?.some((vm) => vm.id === a))}`,
			};

		// lookup previous document
		if (!previousDidDocument) {
			// get previous document
			const previousDocument = await querier[defaultDidExtensionKey].didDoc(didDocument.id);

			// throw, if not found
			if (!previousDocument || !previousDocument.didDoc) throw new Error('Previous did document not found');

			previousDidDocument = await DIDModule.toSpecCompliantPayload(previousDocument.didDoc);
		}

		const controllers = normalizeController(didDocument);
		const previousControllers = normalizeController(previousDidDocument);

		// define whether external controller or not
		const externalController = controllers.concat(previousControllers).some((c) => c !== didDocument.id);

		// define whether key rotation or not (same ID, different material)
		const keyRotation = !!didDocument.verificationMethod?.some((vm) =>
			previousDidDocument?.verificationMethod?.some(
				(pvm) =>
					pvm.id === vm.id &&
					(pvm.publicKeyBase58 !== vm.publicKeyBase58 ||
						pvm.publicKeyMultibase !== vm.publicKeyMultibase ||
						pvm.publicKeyJwk?.x !== vm.publicKeyJwk?.x)
			)
		);

		// define whether key replacement or not (different IDs in authentication)
		const currentAuthenticationIds = new Set(normalizeAuthentication(didDocument));
		const previousAuthenticationIds = new Set(normalizeAuthentication(previousDidDocument));

		const removedKeys = Array.from(previousAuthenticationIds).filter((id) => !currentAuthenticationIds.has(id));
		const addedKeys = Array.from(currentAuthenticationIds).filter((id) => !previousAuthenticationIds.has(id));
		const keyReplacement = removedKeys.length > 0 && addedKeys.length > 0;

		// define controller rotation
		const controllerRotation =
			!controllers.every((c) => previousControllers.includes(c)) ||
			!previousControllers.every((c) => controllers.includes(c));

		// define rotated controllers
		const rotatedControllers = controllerRotation
			? previousControllers.filter((c) => !controllers.includes(c))
			: [];

		// define unique union of authentication
		const previousAuthentication = normalizeAuthentication(previousDidDocument);
		const uniqueUnionAuthentication = new Set<string>([...uniqueAuthentication, ...previousAuthentication]);

		// validate authentication - case: authentication matches signatures, unique, if no external controller, no key rotation, no key replacement
		if (
			!Array.from(uniqueUnionAuthentication).every((a) => uniqueSignatures.has(a)) &&
			!externalController &&
			!keyRotation &&
			!keyReplacement
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueAuthentication).find((a) => !uniqueSignatures.has(a))} is missing`,
			};

		// define rotated keys
		const rotatedKeys = keyRotation
			? didDocument.verificationMethod?.filter((vm) =>
					previousDidDocument?.verificationMethod?.some(
						(pvm) =>
							pvm.id === vm.id &&
							(pvm.publicKeyBase58 !== vm.publicKeyBase58 ||
								pvm.publicKeyMultibase !== vm.publicKeyMultibase ||
								pvm.publicKeyJwk?.x !== vm.publicKeyJwk?.x)
					)
				)
			: [];

		// define unique union of signatures required, including key replacement logic
		let uniqueUnionSignaturesRequired = new Set<string>();
		if (keyRotation) {
			// Existing key rotation logic (same ID, different material)
			uniqueUnionSignaturesRequired = new Set([
				...authentication.filter((a) => rotatedKeys?.find((rk) => a === rk.id)).map((a) => `${a}(document0)`),
				...previousAuthentication.map((a) => `${a}(document1)`),
			]);
		} else if (keyReplacement) {
			// For key replacement, we need signatures from:
			// 1. The new keys (from current document)
			// 2. The old keys that are being replaced (from previous document)
			const newKeySignatures = addedKeys.map((keyId) => `${keyId}(document0)`);
			const oldKeySignatures = removedKeys
				.filter((keyId) => previousAuthentication.includes(keyId)) // Only if they were in authentication
				.map((keyId) => `${keyId}(document1)`);

			uniqueUnionSignaturesRequired = new Set([...newKeySignatures, ...oldKeySignatures]);
		} else {
			// No rotation or replacement
			uniqueUnionSignaturesRequired = new Set([...authentication.map((a) => `${a}(document0)`)]);
		}

		// define frequency of unique union of signatures required
		const uniqueUnionSignaturesRequiredFrequency = new Map(
			[...uniqueUnionSignaturesRequired].map((s) => [s.replace(new RegExp(/\(document\d+\)/), ''), 0])
		);

		// count frequency of unique union of signatures required
		uniqueUnionSignaturesRequired.forEach((s) => {
			// define key
			const key = s.replace(new RegExp(/\(document\d+\)/), '');

			// increment frequency
			uniqueUnionSignaturesRequiredFrequency.set(key, uniqueUnionSignaturesRequiredFrequency.get(key)! + 1);
		});

		// define frequency of signatures provided
		const uniqueSignaturesFrequency = new Map(signatures.map((s) => [s.verificationMethodId, 0]));

		// count frequency of signatures provided
		signatures.forEach((s) => {
			// increment frequency
			uniqueSignaturesFrequency.set(
				s.verificationMethodId,
				uniqueSignaturesFrequency.get(s.verificationMethodId)! + 1
			);
		});

		// validate signatures - case: authentication matches signatures, unique, excessive signatures, no external controller
		if (
			Array.from(uniqueSignaturesFrequency).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredFrequency.get(k) === undefined ||
					(uniqueUnionSignaturesRequiredFrequency.get(k) &&
						uniqueUnionSignaturesRequiredFrequency.get(k)! < f)
			).length &&
			!externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequency).find(([k, f]) => uniqueUnionSignaturesRequiredFrequency.get(k) === undefined || uniqueUnionSignaturesRequiredFrequency.get(k)! < f)?.[0]} is not required`,
			};

		// validate signatures - case: authentication matches signatures, unique, missing signatures, no external controller
		if (
			Array.from(uniqueSignaturesFrequency).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredFrequency.get(k) && uniqueUnionSignaturesRequiredFrequency.get(k)! > f
			).length &&
			!externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequency).find(([k, f]) => uniqueUnionSignaturesRequiredFrequency.get(k)! > f)?.[0]} is missing`,
			};

		// return, if no external controller
		if (!externalController) return { valid: true };

		// require querier
		if (!querier) throw new Error('querier is required for external controller validation');

		// get external controllers
		const externalControllers = controllers?.filter((c) => c !== didDocument.id).concat(rotatedControllers);

		// get external controllers' documents
		const externalControllersDocuments = await Promise.all(
			externalControllers?.map(async (c) => {
				// compute index of external controller's document, if provided
				const externalControllerDocumentIndex = externalControllersDidDocuments?.findIndex((d) => d.id === c);

				// get external controller's document, if provided
				if (externalControllerDocumentIndex !== undefined && externalControllerDocumentIndex !== -1)
					return externalControllersDidDocuments![externalControllerDocumentIndex]!;

				// fetch external controller's document
				const protobufDocument = await querier[defaultDidExtensionKey].didDoc(c);

				// throw, if not found
				if (!protobufDocument || !protobufDocument.didDoc)
					throw new Error(`Document for controller ${c} not found`);

				// convert to spec compliant payload
				return await DIDModule.toSpecCompliantPayload(protobufDocument.didDoc);
			})
		);

		// define unique required signatures, delimited, with external controllers
		const uniqueUnionSignaturesRequiredWithExternalControllers = new Set<string>([
			...uniqueUnionSignaturesRequired,
			...externalControllersDocuments
				.flatMap((d) => normalizeAuthentication(d))
				.map(
					(a) =>
						`${a}(document${externalControllersDocuments.findIndex((d) => normalizeAuthentication(d).includes(a))})`
				),
		]);

		// add rotated controller keys to unique required signatures, if any
		if (controllerRotation) {
			// walk through rotated controllers
			rotatedControllers.forEach((c) => {
				// get rotated controller's document index
				const rotatedControllerDocumentIndex = externalControllersDocuments.findIndex((d) => d?.id === c);

				// early return, if no document
				if (rotatedControllerDocumentIndex === -1) return;

				// get rotated controller's document
				const rotatedControllerDocument = externalControllersDocuments[rotatedControllerDocumentIndex]!;

				// add rotated controller's authentication to unique required signatures
				rotatedControllerDocument.authentication?.forEach((a) =>
					uniqueUnionSignaturesRequiredWithExternalControllers.add(
						`${a}(document${rotatedControllerDocumentIndex})`
					)
				);
			});
		}

		// define frequency of unique union of signatures required, with external controllers
		const uniqueUnionSignaturesRequiredWithExternalControllersFrequency = new Map(
			[...uniqueUnionSignaturesRequiredWithExternalControllers].map((s) => [
				s.replace(new RegExp(/\(document\d+\)/), ''),
				0,
			])
		);

		// count frequency of unique union of signatures required, with external controllers
		uniqueUnionSignaturesRequiredWithExternalControllers.forEach((s) => {
			// define key
			const key = s.replace(new RegExp(/\(document\d+\)/), '');

			// increment frequency
			uniqueUnionSignaturesRequiredWithExternalControllersFrequency.set(
				key,
				uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(key)! + 1
			);
		});

		// define frequency of signatures provided, with external controllers
		const uniqueSignaturesFrequencyWithExternalControllers = new Map(
			signatures.map((s) => [s.verificationMethodId, 0])
		);

		// count frequency of signatures provided, with external controllers
		signatures.forEach((s) => {
			// increment frequency
			uniqueSignaturesFrequencyWithExternalControllers.set(
				s.verificationMethodId,
				uniqueSignaturesFrequencyWithExternalControllers.get(s.verificationMethodId)! + 1
			);
		});

		// validate signatures - case: authentication matches signatures, unique, excessive signatures, with external controllers
		if (
			Array.from(uniqueSignaturesFrequencyWithExternalControllers).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) === undefined ||
					(uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) &&
						uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! < f)
			).length &&
			externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequencyWithExternalControllers).find(([k, f]) => uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) === undefined || uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! < f)?.[0]} is not required`,
			};

		// validate signatures - case: authentication matches signatures, unique, missing signatures, with external controllers
		if (
			Array.from(uniqueSignaturesFrequencyWithExternalControllers).filter(
				([k, f]) =>
					uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k) &&
					uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! > f
			).length &&
			externalController
		)
			return {
				valid: false,
				error: `authentication does not match signatures: signature from key ${Array.from(uniqueSignaturesFrequencyWithExternalControllers).find(([k, f]) => uniqueUnionSignaturesRequiredWithExternalControllersFrequency.get(k)! > f)?.[0]} is missing`,
			};

		// return valid
		return { valid: true, previousDidDocument, externalControllersDocuments };
	}

	static async generateCreateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [DIDModule.fees.DefaultCreateDidDocFee],
			gas: '360000',
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}

	static async generateUpdateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [DIDModule.fees.DefaultUpdateDidDocFee],
			gas: '360000',
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}

	static async generateDeactivateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [DIDModule.fees.DefaultDeactivateDidDocFee],
			gas: '360000',
			payer: feePayer,
			granter: granter,
		} as DidStdFee;
	}
}
