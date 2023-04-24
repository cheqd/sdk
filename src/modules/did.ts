import {
	createPagination,
	createProtobufRpcClient,
	DeliverTxResponse,
	QueryClient
} from "@cosmjs/stargate"
import {
	AbstractCheqdSDKModule,
	MinimalImportableCheqdSDKModule
} from './_';
import { CheqdSigningStargateClient } from "../signer"
import {
	DIDDocument,
	DidStdFee,
	IContext,
	ISignInputs,
	QueryExtensionSetup,
	SpecValidationResult,
	VerificationMethods,
	DIDDocumentWithMetadata
} from '../types';
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
	Metadata
} from "@cheqd/ts-proto/cheqd/did/v2/index"
import {
	EncodeObject,
	GeneratedType
} from "@cosmjs/proto-signing"
import { v4 } from "uuid"
import { assert } from "@cosmjs/utils";
import { PageRequest } from "@cheqd/ts-proto/cosmos/base/query/v1beta1/pagination.js";
import { CheqdQuerier } from "../querier.js";
import { DIDDocumentMetadata } from "did-resolver";

export const defaultDidExtensionKey = "did" as const

export const contexts = {
	W3CDIDv1: "https://www.w3.org/ns/did/v1",
	W3CSuiteEd255192020: "https://w3id.org/security/suites/ed25519-2020/v1",
	W3CSuiteEd255192018: "https://w3id.org/security/suites/ed25519-2018/v1",
	W3CSuiteJws2020: "https://w3id.org/security/suites/jws-2020/v1",
} as const

export const protobufLiterals = {
	MsgCreateDidDoc: "MsgCreateDidDoc",
	MsgCreateDidDocResponse: "MsgCreateDidDocResponse",
	MsgUpdateDidDoc: "MsgUpdateDidDoc",
	MsgUpdateDidDocResponse: "MsgUpdateDidDocResponse",
	MsgDeactivateDidDoc: "MsgDeactivateDidDoc",
	MsgDeactivateDidDocResponse: "MsgDeactivateDidDocResponse",
} as const
export const typeUrlMsgCreateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgCreateDidDoc}`
export const typeUrlMsgCreateDidDocResponse = `/${protobufPackage}.${protobufLiterals.MsgCreateDidDocResponse}`
export const typeUrlMsgUpdateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgUpdateDidDoc}`
export const typeUrlMsgUpdateDidDocResponse = `/${protobufPackage}.${protobufLiterals.MsgUpdateDidDocResponse}`
export const typeUrlMsgDeactivateDidDoc = `/${protobufPackage}.${protobufLiterals.MsgDeactivateDidDoc}`
export const typeUrlMsgDeactivateDidDocResponse = `/${protobufPackage}.${protobufLiterals.MsgDeactivateDidDocResponse}`

export interface MsgCreateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDoc,
	readonly value: Partial<MsgCreateDidDoc>
}

export function isMsgCreateDidDocEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDoc
}

export function isMsgUpdateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDoc
}

export function isMsgDeactivateDidDocEncodeObject(obj: EncodeObject): obj is MsgDeactivateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgDeactivateDidDoc
}

export interface MsgCreateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidDocResponse,
	readonly value: Partial<MsgCreateDidDocResponse>
}

export function MsgCreateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgCreateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidDocResponse
}

export interface MsgUpdateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDoc,
	readonly value: Partial<MsgUpdateDidDoc>
}

export function MsgUpdateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDoc
}

export interface MsgUpdateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidDocResponse,
	readonly value: Partial<MsgUpdateDidDocResponse>
}

export function MsgUpdateDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse
}

export interface MsgDeactivateDidDocEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDoc,
	readonly value: Partial<MsgDeactivateDidDoc>
}

export function MsgDeactivateDidDocEncodeObject(obj: EncodeObject): obj is MsgUpdateDidDocEncodeObject {
	return obj.typeUrl === typeUrlMsgDeactivateDidDoc
}

export interface MsgDeactivateDidDocResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgDeactivateDidDocResponse,
	readonly value: Partial<MsgDeactivateDidDocResponse>
}

export function MsgDeactiveDidDocResponseEncodeObject(obj: EncodeObject): obj is MsgDeactivateDidDocResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidDocResponse
}


export type MinimalImportableDIDModule = MinimalImportableCheqdSDKModule<DIDModule>

export type DidExtension = {
	readonly [defaultDidExtensionKey]: {
		readonly didDoc: (id: string) => Promise<DidDocWithMetadata>
		readonly didDocVersion: (id: string, versionId: string) => Promise<DidDocWithMetadata>
		readonly allDidDocVersionsMetadata: (id: string, paginationKey?: Uint8Array) => Promise<QueryAllDidDocVersionsMetadataResponse>
	}
}

export const setupDidExtension = (base: QueryClient): DidExtension => {
	const rpc = createProtobufRpcClient(base)

	const queryService = new QueryClientImpl(rpc)

	return {
		[defaultDidExtensionKey]: {
			didDoc: async (id: string) => {
				const { value } = await queryService.DidDoc({ id })
				assert(value)
				return value
			},
			didDocVersion: async (id: string, versionId: string) => {
				const { value } = await queryService.DidDocVersion({ id, version: versionId })
				assert(value)
				return value
			},
			allDidDocVersionsMetadata: async (id: string, paginationKey?: Uint8Array) => {
				const response = await queryService.AllDidDocVersionsMetadata({ id, pagination: createPagination(paginationKey) as PageRequest | undefined })
				return response
			}
		}
	} as DidExtension
}

export class DIDModule extends AbstractCheqdSDKModule {
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
        [typeUrlMsgCreateDidDoc, MsgCreateDidDoc],
        [typeUrlMsgCreateDidDocResponse, MsgCreateDidDocResponse],
        [typeUrlMsgUpdateDidDoc, MsgUpdateDidDoc],
        [typeUrlMsgUpdateDidDocResponse, MsgUpdateDidDocResponse],
		[typeUrlMsgDeactivateDidDoc, MsgDeactivateDidDoc],
		[typeUrlMsgDeactivateDidDocResponse, MsgDeactivateDidDocResponse],
    ]

	static readonly baseMinimalDenom = 'ncheq' as const

	static readonly fees = {
		DefaultCreateDidDocFee: { amount: '50000000000', denom: DIDModule.baseMinimalDenom } as const,
		DefaultUpdateDidDocFee: { amount: '25000000000', denom: DIDModule.baseMinimalDenom } as const,
		DefaultDeactivateDidDocFee: { amount: '10000000000', denom: DIDModule.baseMinimalDenom } as const,
	} as const

	static readonly querierExtensionSetup: QueryExtensionSetup<DidExtension> = setupDidExtension

	querier: CheqdQuerier & DidExtension

	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & DidExtension) {
		super(signer, querier)
		this.querier = querier
		this.methods = {
			createDidDocTx: this.createDidDocTx.bind(this),
			updateDidDocTx: this.updateDidDocTx.bind(this),
			deactivateDidDocTx: this.deactivateDidDocTx.bind(this),
			queryDidDoc: this.queryDidDoc.bind(this),
			queryDidDocVersion: this.queryDidDocVersion.bind(this),
			queryAllDidDocVersionsMetadata: this.queryAllDidDocVersionsMetadata.bind(this),
		}
	}

    public getRegistryTypes(): Iterable<[string, GeneratedType]> {
        return DIDModule.registryTypes
    }

	public getQuerierExtensionSetup(): QueryExtensionSetup<DidExtension> {
		return DIDModule.querierExtensionSetup
	}

	async createDidDocTx(signInputs: ISignInputs[] | SignInfo[], didPayload: DIDDocument, address: string, fee?: DidStdFee | 'auto' | number, memo?: string, versionId?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		if (!versionId || versionId === '') {
			versionId = v4()
		}

		const { valid, error, protobufVerificationMethod, protobufService } = await DIDModule.validateSpecCompliantPayload(didPayload)

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`)
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
			versionId: versionId
		})

		let signatures: SignInfo[]
		if(ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signcreateDidDocTx(signInputs, payload)
		} else {
			signatures = signInputs
		}

		const value: MsgCreateDidDoc = {
			payload,
			signatures
		}

		const createDidMsg: MsgCreateDidDocEncodeObject = {
			typeUrl: typeUrlMsgCreateDidDoc,
			value
		}

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address
		}

		if (!fee) {
			fee = await DIDModule.generateCreateDidDocFees(address)
		}

		return this._signer.signAndBroadcast(
			address,
			[createDidMsg],
			fee!,
			memo
		)
	}

	async updateDidDocTx(signInputs: ISignInputs[] | SignInfo[], didPayload: DIDDocument, address: string, fee?: DidStdFee | 'auto' | number, memo?: string, versionId?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		if (!versionId || versionId === '') {
			versionId = v4()
		}

		const { valid, error, protobufVerificationMethod, protobufService } = await DIDModule.validateSpecCompliantPayload(didPayload)

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`)
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
			versionId: versionId
		})
		let signatures: SignInfo[]
		if(ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signupdateDidDocTx(signInputs, payload)
		} else {
			signatures = signInputs
		}

		const value: MsgUpdateDidDoc = {
			payload,
			signatures
		}

		const updateDidMsg: MsgUpdateDidDocEncodeObject = {
			typeUrl: typeUrlMsgUpdateDidDoc,
			value
		}

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address
		}

		if (!fee) {
			fee = await DIDModule.generateUpdateDidDocFees(address)
		}

		return this._signer.signAndBroadcast(
			address,
			[updateDidMsg],
			fee!,
			memo
		)
	}

	async deactivateDidDocTx(signInputs: ISignInputs[] | SignInfo[], didPayload: DIDDocument, address: string, fee?: DidStdFee | 'auto' | number, memo?: string, versionId?: string, context?: IContext): Promise<DeliverTxResponse> {
		if (!this._signer) {
			this._signer = context!.sdk!.signer
		}

		if (!versionId || versionId === '') {
			versionId = v4()
		}

		const { valid, error, protobufVerificationMethod } = await DIDModule.validateSpecCompliantPayload(didPayload)

		if (!valid) {
			throw new Error(`DID payload is not spec compliant: ${error}`)
		}

		const payload = MsgDeactivateDidDocPayload.fromPartial({
			id: didPayload.id,
			versionId: versionId
		})

		let signatures: SignInfo[]
		if(ISignInputs.isSignInput(signInputs)) {
			signatures = await this._signer.signdeactivateDidDocTx(signInputs, payload, protobufVerificationMethod!)
		} else {
			signatures = signInputs
		}

		const value: MsgDeactivateDidDoc = {
			payload,
			signatures
		}

		const deactivateDidMsg: MsgDeactivateDidDocEncodeObject = {
			typeUrl: typeUrlMsgDeactivateDidDoc,
			value
		}

		if (address === '') {
			address = (await context!.sdk!.options.wallet.getAccounts())[0].address
		}

		if (!fee) {
			fee = await DIDModule.generateDeactivateDidDocFees(address)
		}

		return this._signer.signAndBroadcast(
			address,
			[deactivateDidMsg],
			fee!,
			memo
		)
	}

	async queryDidDoc(id: string, context?: IContext): Promise<DIDDocumentWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier
		}
		const { didDoc, metadata } = await this.querier[defaultDidExtensionKey].didDoc(id)
		return {
			didDocument: await DIDModule.toSpecCompliantPayload(didDoc!),
			didDocumentMetadata: await DIDModule.toSpecCompliantMetadata(metadata!)
		} as DIDDocumentWithMetadata
	}

	async queryDidDocVersion(id: string, versionId: string, context?: IContext): Promise<DIDDocumentWithMetadata> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier
		}
		const { didDoc, metadata } = await this.querier[defaultDidExtensionKey].didDocVersion(id, versionId)
		return {
			didDocument: await DIDModule.toSpecCompliantPayload(didDoc!),
			didDocumentMetadata: await DIDModule.toSpecCompliantMetadata(metadata!)
		} as DIDDocumentWithMetadata
	}

	async queryAllDidDocVersionsMetadata(id: string, context?: IContext): Promise<{ didDocumentVersionsMetadata: DIDDocumentMetadata[], pagination: QueryAllDidDocVersionsMetadataResponse['pagination']}> {
		if (!this.querier) {
			this.querier = context!.sdk!.querier
		}
		const { versions, pagination } = await this.querier[defaultDidExtensionKey].allDidDocVersionsMetadata(id)
		return {
			didDocumentVersionsMetadata: await Promise.all(versions.map(async (m) => await DIDModule.toSpecCompliantMetadata(m))),
			pagination
		}
	}

	static async validateSpecCompliantPayload(didDocument: DIDDocument): Promise<SpecValidationResult> {
		// id is required, validated on both compile and runtime
		if (!didDocument?.id) return { valid: false, error: 'id is required' }

		// verificationMethod is required
		if (!didDocument?.verificationMethod) return { valid: false, error: 'verificationMethod is required' }

		// verificationMethod must be an array
		if (!Array.isArray(didDocument?.verificationMethod)) return { valid: false, error: 'verificationMethod must be an array' }

		// verificationMethod types must be supported
		const protoVerificationMethod = didDocument.verificationMethod.map((vm) => {
			switch (vm?.type) {
				case VerificationMethods.Ed255192020:
					if (!vm?.publicKeyMultibase) throw new Error('publicKeyMultibase is required')

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.Ed255192020,
						verificationMaterial: vm.publicKeyMultibase,
					})
				case VerificationMethods.JWK:
					if (!vm?.publicKeyJwk) throw new Error('publicKeyJwk is required')

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.JWK,
						verificationMaterial: JSON.stringify(vm.publicKeyJwk),
					})
				case VerificationMethods.Ed255192018:
					if (!vm?.publicKeyBase58) throw new Error('publicKeyBase58 is required')

					return VerificationMethod.fromPartial({
						id: vm.id,
						controller: vm.controller,
						verificationMethodType: VerificationMethods.Ed255192018,
						verificationMaterial: vm.publicKeyBase58,
					})
				default:
					throw new Error('Unsupported verificationMethod type')
			}
		})

		const protoService = didDocument?.service?.map((s) => {
			return Service.fromPartial({
				id: s?.id,
				serviceType: s?.type,
				serviceEndpoint: <string[]>s?.serviceEndpoint,
			})
		})

		return { valid: true, protobufVerificationMethod: protoVerificationMethod, protobufService: protoService } as SpecValidationResult
	}

	static async toSpecCompliantPayload(protobufDidDocument: DidDoc): Promise<DIDDocument> {
		const verificationMethod = protobufDidDocument.verificationMethod.map((vm) => {
			switch (vm.verificationMethodType) {
				case VerificationMethods.Ed255192020:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteEd255192020)) 
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteEd255192020]
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyMultibase: vm.verificationMaterial,
					}
				case VerificationMethods.JWK:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteJws2020)) 
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteJws2020]
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyJwk: JSON.parse(vm.verificationMaterial),
					}
				case VerificationMethods.Ed255192018:
					if (!protobufDidDocument.context.includes(contexts.W3CSuiteEd255192018))
						protobufDidDocument.context = [...protobufDidDocument.context, contexts.W3CSuiteEd255192018]
					return {
						id: vm.id,
						type: vm.verificationMethodType,
						controller: vm.controller,
						publicKeyBase58: vm.verificationMaterial,
					}
				default:
					throw new Error('Unsupported verificationMethod type') // should never happen
			}
		})

		const service = protobufDidDocument.service.map((s) => {
			return {
				id: s.id,
				type: s.serviceType,
				serviceEndpoint: s.serviceEndpoint,
			}
		})

		const context = function () {
			if (protobufDidDocument.context.includes(contexts.W3CDIDv1))
				return protobufDidDocument.context

			return [contexts.W3CDIDv1, ...protobufDidDocument.context]
		}()

		const specCompliant = {
			'@context': context,
			id: protobufDidDocument.id,
			controller: protobufDidDocument.controller,
			verificationMethod: verificationMethod,
			authentication: protobufDidDocument.authentication,
			assertionMethod: protobufDidDocument.assertionMethod,
			capabilityInvocation: protobufDidDocument.capabilityInvocation,
			capabilityDelegation: protobufDidDocument.capabilityDelegation,
			keyAgreement: protobufDidDocument.keyAgreement,
			service: service,
			alsoKnownAs: protobufDidDocument.alsoKnownAs,
		} as DIDDocument

		if (!protobufDidDocument.authentication?.length) delete specCompliant.authentication
		if (!protobufDidDocument.assertionMethod?.length) delete specCompliant.assertionMethod
		if (!protobufDidDocument.capabilityInvocation?.length) delete specCompliant.capabilityInvocation
		if (!protobufDidDocument.capabilityDelegation?.length) delete specCompliant.capabilityDelegation
		if (!protobufDidDocument.keyAgreement?.length) delete specCompliant.keyAgreement
		if (!protobufDidDocument.service?.length) delete specCompliant.service
		if (!protobufDidDocument.alsoKnownAs?.length) delete specCompliant.alsoKnownAs

		return specCompliant
	}

	static async toSpecCompliantMetadata(protobufDidDocument: Metadata): Promise<DIDDocumentMetadata> {
		return {
			created: protobufDidDocument.created?.toISOString(),
			updated: protobufDidDocument.updated?.toISOString(),
			deactivated: protobufDidDocument.deactivated,
			versionId: protobufDidDocument.versionId,
			nextVersionId: protobufDidDocument?.nextVersionId,
		}
	}

	static async generateCreateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				DIDModule.fees.DefaultCreateDidDocFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateUpdateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				DIDModule.fees.DefaultUpdateDidDocFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateDeactivateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				DIDModule.fees.DefaultDeactivateDidDocFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}
}
