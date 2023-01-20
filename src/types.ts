import { CheqdSDK } from "."
import { Coin } from "@cosmjs/proto-signing"
import { Signer } from "did-jwt"
import { MsgCreateDidDocPayload, MsgDeactivateDidDocPayload, MsgUpdateDidDocPayload, VerificationMethod, Service } from "@cheqd/ts-proto/cheqd/did/v2"
import { DeepPartial, Exact } from "cosmjs-types/confio/proofs"

export enum CheqdNetwork {
    Mainnet = 'mainnet',
    Testnet = 'testnet',
}

export interface IModuleMethod {
    (...args: any[]): Promise<any>
}

export interface IModuleMethodMap extends Record<string, IModuleMethod> {}

export interface IContext {
    sdk: CheqdSDK
}

export enum VerificationMethods {
    Ed255192020 = 'Ed25519VerificationKey2020',
    Ed255192018 = 'Ed25519VerificationKey2018',
    JWK = 'JsonWebKey2020',
}

export enum MethodSpecificIdAlgo {
    Base58 = 'base58btc',
    Uuid = 'uuid',
}

export type TSignerAlgo = {
    [key in VerificationMethods as string]?: (secretKey: Uint8Array) => Signer
}

export interface ISignInputs {
    verificationMethodId: string
    keyType?: 'Ed25519' | 'Secp256k1' | 'P256'
    privateKeyHex: string
}

export const ISignInputs = {
  isSignInput(object: Object[]): object is ISignInputs[] {
		return object.some((x)=> 'privateKeyHex' in x)
	}
}

export interface IKeyPair {
    publicKey: string
    privateKey: string
    algo?: MethodSpecificIdAlgo
}

export interface IKeyValuePair {
    key: string
    value: any
}

export type TVerificationKeyPrefix = string

export type TVerificationKey<K extends TVerificationKeyPrefix, N extends number> = `${K}-${N}`

export interface IVerificationKeys {
    readonly methodSpecificId: TMethodSpecificId
    readonly didUrl: `did:cheqd:${CheqdNetwork}:${IVerificationKeys['methodSpecificId']}` extends string ? string : never
    readonly keyId: `${IVerificationKeys['didUrl']}#${TVerificationKey<TVerificationKeyPrefix, number>}`
    readonly publicKey: string
}

export type TMethodSpecificId = string

export interface DidStdFee {
    readonly amount: readonly Coin[]
    readonly gas: string
    payer?: string
    granter?: string
}

export interface MsgDeactivateDidPayload extends MsgDeactivateDidDocPayload {
    verificationMethod: VerificationMethodPayload[]
}

export interface MsgCreateDidPayload extends Omit<MsgCreateDidDocPayload, 'verificationMethod' | 'service'> {
    verificationMethod: VerificationMethodPayload[]
    service: ServicePayload[]
}

export const MsgCreateDidPayload = {
    transformPayload<I extends Exact<DeepPartial<MsgCreateDidPayload>, I>>(message: I): MsgCreateDidDocPayload {
        const obj: any = {};
        if (message.context) {
          obj.context = message.context
        } else {
          obj.context = [];
        }
        message.id !== undefined && (obj.id = message.id);
        if (message.controller) {
          obj.controller = message.controller
        }
        if (message.verificationMethod) {
          obj.verificationMethod = message.verificationMethod.map((e) => e ? VerificationMethodPayload.transformPayload(e) : undefined);
        }
        if (message.authentication) {
          obj.authentication = message.authentication
        }
        if (message.assertionMethod) {
          obj.assertionMethod = message.assertionMethod
        }
        if (message.capabilityInvocation) {
          obj.capabilityInvocation = message.capabilityInvocation
        }
        if (message.capabilityDelegation) {
          obj.capabilityDelegation = message.capabilityDelegation
        }
        if (message.keyAgreement) {
          obj.keyAgreement = message.keyAgreement
        }
        if (message.alsoKnownAs) {
          obj.alsoKnownAs = message.alsoKnownAs
        }
        if (message.service) {
          obj.service = message.service.map((e) => e ? {id: e.id, serviceEndpoint: e.serviceEndpoint, serviceType: e.type} as Service : undefined);
        }
        message.versionId !== undefined && (obj.versionId = message.versionId);
        return MsgCreateDidDocPayload.fromPartial(obj);
      },

    fromPartial<I extends Exact<DeepPartial<MsgCreateDidPayload>, I>>(object: I): MsgCreateDidPayload {
        const message = createBaseMsgCreateDidPayload();
        message.context = object.context?.map((e) => e) || [];
        message.id = object.id ?? "";
        message.controller = object.controller?.map((e) => e) || [];
        message.verificationMethod = object.verificationMethod?.map((e) => VerificationMethodPayload.fromPartial(e)) || [];
        message.authentication = object.authentication?.map((e) => e) || [];
        message.assertionMethod = object.assertionMethod?.map((e) => e) || [];
        message.capabilityInvocation = object.capabilityInvocation?.map((e) => e) || [];
        message.capabilityDelegation = object.capabilityDelegation?.map((e) => e) || [];
        message.keyAgreement = object.keyAgreement?.map((e) => e) || [];
        message.alsoKnownAs = object.alsoKnownAs?.map((e) => e) || [];
        message.service = object.service?.map((e) => ServicePayload.fromPartial(e)) || [];
        message.versionId = object.versionId ?? "";
        return message;
    },
    
}

function createBaseMsgCreateDidPayload(): MsgCreateDidPayload {
    return {
      context: [],
      id: "",
      controller: [],
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      keyAgreement: [],
      alsoKnownAs: [],
      service: [],
      versionId: "",
    };
  }

export interface VerificationMethodPayload {
    id: string;
    type: string;
    controller: string;
    publicKeyBase58?: string;
    publicKeyMultibase?: string;
    publicKeyJWK?: any;
}

export const VerificationMethodPayload = {
    fromPartial<I extends Exact<DeepPartial<VerificationMethodPayload>, I>>(object: I): VerificationMethodPayload {
        const message = createBaseVerificationMethod();
        message.id = object.id ?? "";
        message.type = object.type ?? "";
        message.controller = object.controller ?? "";
        if(object.publicKeyMultibase) {
          message.publicKeyMultibase = object.publicKeyMultibase;
        } else if (object.publicKeyBase58) {
          message.publicKeyBase58 = object.publicKeyBase58;
        } else if (object.publicKeyJWK) {
          message.publicKeyJWK = object.publicKeyJWK;
        }
        return message;
      },
    
    transformPayload<I extends Exact<DeepPartial<VerificationMethodPayload>, I>>(payload: I): VerificationMethod {
      return {
        id: payload.id ?? "", 
        controller: payload.controller ?? "", 
        verificationMethodType: payload.type ?? "", 
        verificationMaterial: payload.publicKeyBase58 || payload.publicKeyMultibase || JSON.stringify(payload.publicKeyJWK) || ""
      } as VerificationMethod
    }
}

function createBaseVerificationMethod(): VerificationMethodPayload {
    return { id: "", type: "", controller: ""  };
}

export interface ServicePayload {
    id: string;
    type: string;
    serviceEndpoint: string[];
}

export const ServicePayload = {
    fromPartial<I extends Exact<DeepPartial<ServicePayload>, I>>(object: I): ServicePayload {
        const message = createBaseService();
        message.id = object.id ?? "";
        message.type = object.type ?? "";
        message.serviceEndpoint = object.serviceEndpoint?.map((e) => e) || [];
        return message;
      },
}

function createBaseService(): ServicePayload {
    return { id: "", type: "", serviceEndpoint: [] };
}

export interface MsgUpdateDidPayload extends Omit<MsgUpdateDidDocPayload, 'verificationMethod' | 'service'> {
    verificationMethod: VerificationMethodPayload[]
    service: ServicePayload[]
}
