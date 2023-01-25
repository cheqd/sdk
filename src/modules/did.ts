import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from "@cosmjs/stargate"
/* import { QueryClientImpl } from '@cheqd/ts-proto/cheqd/did/v1/query' */
import { CheqdExtension, AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from "./_"
import { CheqdSigningStargateClient } from "../signer"
import { DIDDocument, DidStdFee, IContext, ISignInputs, SpecValidationResult, VerificationMethods } from '../types';
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
	Service, 
	SignInfo,
	VerificationMethod
} from "@cheqd/ts-proto/cheqd/did/v2"
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing"
import { v4 } from "uuid"
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { Int53 } from "@cosmjs/math";

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
		DefaultCreateDidFee: { amount: '50000000000', denom: DIDModule.baseMinimalDenom } as const,
		DefaultUpdateDidFee: { amount: '25000000000', denom: DIDModule.baseMinimalDenom } as const,
		DefaultDeactivateDidFee: { amount: '10000000000', denom: DIDModule.baseMinimalDenom } as const,
	} as const

	constructor(signer: CheqdSigningStargateClient) {
		super(signer)
		this.methods = {
			createDidTx: this.createDidTx.bind(this),
			updateDidTx: this.updateDidTx.bind(this),
			deactivateDidTx: this.deactivateDidTx.bind(this),
		}
	}

    public getRegistryTypes(): Iterable<[string, GeneratedType]> {
        return DIDModule.registryTypes
    }

	async createDidTx(signInputs: ISignInputs[] | SignInfo[], didPayload: DIDDocument, address: string, fee: DidStdFee | 'auto' | number, memo?: string, versionId?: string, context?: IContext): Promise<DeliverTxResponse> {
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
			signatures = await this._signer.signCreateDidTx(signInputs, payload)
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

		return this._signer.signAndBroadcast(
			address,
			[createDidMsg],
			fee,
			memo
		)
	}

	async updateDidTx(signInputs: ISignInputs[] | SignInfo[], didPayload: DIDDocument, address: string, fee: DidStdFee | 'auto' | number, memo?: string, versionId?: string, context?: IContext): Promise<DeliverTxResponse> {
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
			signatures = await this._signer.signUpdateDidTx(signInputs, payload)
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

		return this._signer.signAndBroadcast(
			address,
			[updateDidMsg],
			fee,
			memo
		)
	}

	async deactivateDidTx(signInputs: ISignInputs[] | SignInfo[], didPayload: DIDDocument, address: string, fee: DidStdFee | 'auto' | number, memo?: string, versionId?: string, context?: IContext): Promise<DeliverTxResponse> {
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
			signatures = await this._signer.signDeactivateDidTx(signInputs, payload, protobufVerificationMethod!)
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

		return this._signer.signAndBroadcast(
			address,
			[deactivateDidMsg],
			fee,
			memo
		)
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

	static async generateCreateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				DIDModule.fees.DefaultCreateDidFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateUpdateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				DIDModule.fees.DefaultUpdateDidFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}

	static async generateDeactivateDidDocFees(feePayer: string, granter?: string): Promise<DidStdFee> {
		return {
			amount: [
				DIDModule.fees.DefaultDeactivateDidFee
			],
			gas: '360000',
			payer: feePayer,
			granter: granter
		} as DidStdFee
	}
}

export type MinimalImportableDIDModule = MinimalImportableCheqdSDKModule<DIDModule>

export interface DidExtension extends CheqdExtension<string, {}> {
	did: {}
}

export const setupDidExtension = (base: QueryClient): DidExtension => {
	const rpc = createProtobufRpcClient(base)

	/* const queryService = new QueryClientImpl(rpc) */

	return {
		did: {
			//...
		}
	}
}
