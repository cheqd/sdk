import {
	protobufPackage,
	MsgAddHostZone,
	MsgAddHostZoneResponse,
	MsgFundFeeAbsModuleAccount,
	MsgFundFeeAbsModuleAccountResponse,
	MsgRemoveHostZone,
	MsgRemoveHostZoneResponse,
	MsgSendQueryIbcDenomTWAP,
	MsgSendQueryIbcDenomTWAPResponse,
	MsgSwapCrossChain,
	MsgSwapCrossChainResponse,
	MsgUpdateHostZone,
	MsgUpdateHostZoneResponse,
	MsgUpdateParams,
	MsgUpdateParamsResponse,
	QueryHostChainConfigRequest,
	QueryHostChainConfigResponse,
	QueryOsmosisArithmeticTwapRequest,
	QueryOsmosisArithmeticTwapResponse,
	QueryFeeabsModuleBalacesRequest,
	QueryFeeabsModuleBalacesResponse,
	QueryClientImpl,
} from '@cheqd/ts-proto-cjs/feeabstraction/feeabs/v1beta1/index';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing-cjs';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_';
import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from '@cosmjs/stargate-cjs';
import { DidStdFee, IContext, QueryExtensionSetup } from '../types';
import { CheqdQuerier } from '../querier';
import { CheqdSigningStargateClient } from '../signer';
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/gov/v1/tx';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

export const defaultExtensionKey = 'feeabs' as const;

export const protobufLiterals = {
	MsgAddHostZone: 'MsgAddHostZone',
	MsgAddHostZoneResponse: 'MsgAddHostZoneResponse',
	MsgFundFeeAbsModuleAccount: 'MsgFundFeeAbsModuleAccount',
	MsgFundFeeAbsModuleAccountResponse: 'MsgFundFeeAbsModuleAccountResponse',
	MsgRemoveHostZone: 'MsgRemoveHostZone',
	MsgRemoveHostZoneResponse: 'MsgRemoveHostZoneResponse',
	MsgSendQueryIbcDenomTWAP: 'MsgSendQueryIbcDenomTWAP',
	MsgSendQueryIbcDenomTWAPResponse: 'MsgSendQueryIbcDenomTWAPResponse',
	MsgSwapCrossChain: 'MsgSwapCrossChain',
	MsgSwapCrossChainResponse: 'MsgSwapCrossChainResponse',
	MsgUpdateHostZone: 'MsgUpdateHostZone',
	MsgUpdateHostZoneResponse: 'MsgUpdateHostZoneResponse',
	MsgUpdateParams: 'MsgUpdateParams',
	MsgUpdateParamsResponse: 'MsgUpdateParamsResponse',
} as const;

export const typeUrlMsgAddHostZone = `/${protobufPackage}.${protobufLiterals.MsgAddHostZone}` as const;
export const typeUrlMsgAddHostZoneResponse = `/${protobufPackage}.${protobufLiterals.MsgAddHostZoneResponse}` as const;
export const typeUrlMsgFundFeeAbsModuleAccount =
	`/${protobufPackage}.${protobufLiterals.MsgFundFeeAbsModuleAccount}` as const;
export const typeUrlMsgFundFeeAbsModuleAccountResponse =
	`/${protobufPackage}.${protobufLiterals.MsgFundFeeAbsModuleAccountResponse}` as const;
export const typeUrlMsgRemoveHostZone = `/${protobufPackage}.${protobufLiterals.MsgRemoveHostZone}` as const;
export const typeUrlMsgRemoveHostZoneResponse =
	`/${protobufPackage}.${protobufLiterals.MsgRemoveHostZoneResponse}` as const;
export const typeUrlMsgSendQueryIbcDenomTWAP =
	`/${protobufPackage}.${protobufLiterals.MsgSendQueryIbcDenomTWAP}` as const;
export const typeUrlMsgSendQueryIbcDenomTWAPResponse =
	`/${protobufPackage}.${protobufLiterals.MsgSendQueryIbcDenomTWAPResponse}` as const;
export const typeUrlMsgSwapCrossChain = `/${protobufPackage}.${protobufLiterals.MsgSwapCrossChain}` as const;
export const typeUrlMsgSwapCrossChainResponse =
	`/${protobufPackage}.${protobufLiterals.MsgSwapCrossChainResponse}` as const;
export const typeUrlMsgUpdateHostZone = `/${protobufPackage}.${protobufLiterals.MsgUpdateHostZone}` as const;
export const typeUrlMsgUpdateHostZoneResponse =
	`/${protobufPackage}.${protobufLiterals.MsgUpdateHostZoneResponse}` as const;
export const typeUrlMsgUpdateParams = `/${protobufPackage}.${protobufLiterals.MsgUpdateParams}` as const;
export const typeUrlMsgUpdateParamsResponse =
	`/${protobufPackage}.${protobufLiterals.MsgUpdateParamsResponse}` as const;

export interface MsgAddHostZoneEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgAddHostZone;
	readonly value: Partial<MsgAddHostZone>;
}

export function isMsgAddHostZoneEncodeObject(obj: EncodeObject): obj is MsgAddHostZoneEncodeObject {
	return obj.typeUrl === typeUrlMsgAddHostZone;
}

export interface MsgAddHostZoneResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgAddHostZoneResponse;
	readonly value: Partial<MsgAddHostZoneResponse>;
}

export function isMsgAddHostZoneResponseEncodeObject(obj: EncodeObject): obj is MsgAddHostZoneResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgAddHostZoneResponse;
}

export interface MsgFundFeeAbsModuleAccountEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgFundFeeAbsModuleAccount;
	readonly value: Partial<MsgFundFeeAbsModuleAccount>;
}

export function isMsgFundFeeAbsModuleAccountEncodeObject(
	obj: EncodeObject
): obj is MsgFundFeeAbsModuleAccountEncodeObject {
	return obj.typeUrl === typeUrlMsgFundFeeAbsModuleAccount;
}

export interface MsgFundFeeAbsModuleAccountResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgFundFeeAbsModuleAccountResponse;
	readonly value: Partial<MsgFundFeeAbsModuleAccountResponse>;
}

export function isMsgFundFeeAbsModuleAccountResponseEncodeObject(
	obj: EncodeObject
): obj is MsgFundFeeAbsModuleAccountResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgFundFeeAbsModuleAccountResponse;
}

export interface MsgRemoveHostZoneEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgRemoveHostZone;
	readonly value: Partial<MsgRemoveHostZone>;
}

export function isMsgRemoveHostZoneEncodeObject(obj: EncodeObject): obj is MsgRemoveHostZoneEncodeObject {
	return obj.typeUrl === typeUrlMsgRemoveHostZone;
}

export interface MsgRemoveHostZoneResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgRemoveHostZoneResponse;
	readonly value: Partial<MsgRemoveHostZoneResponse>;
}

export function isMsgRemoveHostZoneResponseEncodeObject(
	obj: EncodeObject
): obj is MsgRemoveHostZoneResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgRemoveHostZoneResponse;
}

export interface MsgSendQueryIbcDenomTWAPEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSendQueryIbcDenomTWAP;
	readonly value: Partial<MsgSendQueryIbcDenomTWAP>;
}

export function isMsgSendQueryIbcDenomTWAPEncodeObject(obj: EncodeObject): obj is MsgSendQueryIbcDenomTWAPEncodeObject {
	return obj.typeUrl === typeUrlMsgSendQueryIbcDenomTWAP;
}

export interface MsgSendQueryIbcDenomTWAPResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSendQueryIbcDenomTWAPResponse;
	readonly value: Partial<MsgSendQueryIbcDenomTWAPResponse>;
}

export function isMsgSendQueryIbcDenomTWAPResponseEncodeObject(
	obj: EncodeObject
): obj is MsgSendQueryIbcDenomTWAPResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgSendQueryIbcDenomTWAPResponse;
}

export interface MsgSwapCrossChainEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSwapCrossChain;
	readonly value: Partial<MsgSwapCrossChain>;
}

export function isMsgSwapCrossChainEncodeObject(obj: EncodeObject): obj is MsgSwapCrossChainEncodeObject {
	return obj.typeUrl === typeUrlMsgSwapCrossChain;
}

export interface MsgSwapCrossChainResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSwapCrossChainResponse;
	readonly value: Partial<MsgSwapCrossChainResponse>;
}

export function isMsgSwapCrossChainResponseEncodeObject(
	obj: EncodeObject
): obj is MsgSwapCrossChainResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgSwapCrossChainResponse;
}

export interface MsgUpdateHostZoneEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateHostZone;
	readonly value: Partial<MsgUpdateHostZone>;
}

export function isMsgUpdateHostZoneEncodeObject(obj: EncodeObject): obj is MsgUpdateHostZoneEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateHostZone;
}

export interface MsgUpdateHostZoneResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateHostZoneResponse;
	readonly value: Partial<MsgUpdateHostZoneResponse>;
}

export function isMsgUpdateHostZoneResponseEncodeObject(
	obj: EncodeObject
): obj is MsgUpdateHostZoneResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateHostZoneResponse;
}

export interface MsgUpdateParamsEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateParams;
	readonly value: Partial<MsgUpdateParams>;
}

export function isMsgUpdateParamsEncodeObject(obj: EncodeObject): obj is MsgUpdateParamsEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateParams;
}

export interface MsgUpdateParamsResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateParamsResponse;
	readonly value: Partial<MsgUpdateParamsResponse>;
}

export function isMsgUpdateParamsResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateParamsResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateParamsResponse;
}

export type MinimalImportableFeeabstractionModule = MinimalImportableCheqdSDKModule<FeeabstractionModule>;

export type FeeabstractionExtension = {
	readonly [defaultExtensionKey]: {
		readonly hostChainConfig: (request: QueryHostChainConfigRequest) => Promise<QueryHostChainConfigResponse>;
		readonly osmosisArithmeticTwap: (
			request: QueryOsmosisArithmeticTwapRequest
		) => Promise<QueryOsmosisArithmeticTwapResponse>;
		readonly feeabsModuleBalances: (
			request: QueryFeeabsModuleBalacesRequest
		) => Promise<QueryFeeabsModuleBalacesResponse>;
	};
};

export const setupFeeabstractionExtension = (base: QueryClient): FeeabstractionExtension => {
	const rpc = createProtobufRpcClient(base);

	const queryService = new QueryClientImpl(rpc);

	return {
		[defaultExtensionKey]: {
			hostChainConfig: async (request: QueryHostChainConfigRequest) => {
				return await queryService.HostChainConfig(request);
			},
			osmosisArithmeticTwap: async (request: QueryOsmosisArithmeticTwapRequest) => {
				return await queryService.OsmosisArithmeticTwap(request);
			},
			feeabsModuleBalances: async (request: QueryFeeabsModuleBalacesRequest) => {
				return await queryService.FeeabsModuleBalances(request);
			},
		},
	} satisfies FeeabstractionExtension;
};

export class FeeabstractionModule extends AbstractCheqdSDKModule {
	// @ts-expect-error underlying type `GeneratedType` is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlMsgAddHostZone, MsgAddHostZone],
		[typeUrlMsgAddHostZoneResponse, MsgAddHostZoneResponse],
		[typeUrlMsgFundFeeAbsModuleAccount, MsgFundFeeAbsModuleAccount],
		[typeUrlMsgFundFeeAbsModuleAccountResponse, MsgFundFeeAbsModuleAccountResponse],
		[typeUrlMsgRemoveHostZone, MsgRemoveHostZone],
		[typeUrlMsgRemoveHostZoneResponse, MsgRemoveHostZoneResponse],
		[typeUrlMsgSendQueryIbcDenomTWAP, MsgSendQueryIbcDenomTWAP],
		[typeUrlMsgSendQueryIbcDenomTWAPResponse, MsgSendQueryIbcDenomTWAPResponse],
		[typeUrlMsgSwapCrossChain, MsgSwapCrossChain],
		[typeUrlMsgSwapCrossChainResponse, MsgSwapCrossChainResponse],
		[typeUrlMsgUpdateHostZone, MsgUpdateHostZone],
		[typeUrlMsgUpdateHostZoneResponse, MsgUpdateHostZoneResponse],
		[typeUrlMsgUpdateParams, MsgUpdateParams],
		[typeUrlMsgUpdateParamsResponse, MsgUpdateParamsResponse],
	];

	static readonly querierExtensionSetup: QueryExtensionSetup<FeeabstractionExtension> = setupFeeabstractionExtension;

	querier: CheqdQuerier & FeeabstractionExtension;

	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & FeeabstractionExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			addHostZoneProposal: this.addHostZoneProposal.bind(this),
			fundFeeAbsModuleAccount: this.fundFeeAbsModuleAccount.bind(this),
			removeHostZoneProposal: this.removeHostZoneProposal.bind(this),
			sendQueryIbcDenomTWAP: this.sendQueryIbcDenomTWAP.bind(this),
			swapCrossChain: this.swapCrossChain.bind(this),
			updateHostZoneProposal: this.updateHostZoneProposal.bind(this),
			updateParamsProposal: this.updateParamsProposal.bind(this),
		};
	}

	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return FeeabstractionModule.registryTypes;
	}

	public getQuerierExtensionSetup(): QueryExtensionSetup<FeeabstractionExtension> {
		return FeeabstractionModule.querierExtensionSetup;
	}

	async addHostZoneProposal(
		data: MsgAddHostZone,
		title: string,
		deposit: Coin[],
		proposer: string,
		fee: DidStdFee,
		memo?: string,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) this._signer = context!.sdk!.signer;

		const proposalEncodeObject = {
			typeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgAddHostZone,
						value: Uint8Array.from(MsgAddHostZone.encode(data).finish()),
					},
				],
				title,
				initialDeposit: deposit,
				proposer,
			}),
		} satisfies EncodeObject;

		return await this._signer.signAndBroadcast(proposer, [proposalEncodeObject], fee, memo);
	}

	async fundFeeAbsModuleAccount(
		sender: string,
		amount: Coin[],
		fee: DidStdFee,
		memo?: string,
		context?: IContext
	): Promise<MsgFundFeeAbsModuleAccountResponse> {
		if (!this._signer) this._signer = context!.sdk!.signer;

		const fundFeeAbsModuleAccountMsg = {
			typeUrl: typeUrlMsgFundFeeAbsModuleAccount,
			value: {
				sender,
				amount,
			},
		} satisfies MsgFundFeeAbsModuleAccountEncodeObject;

		return await this._signer.signAndBroadcast(sender, [fundFeeAbsModuleAccountMsg], fee, memo);
	}

	async removeHostZoneProposal(
		data: MsgRemoveHostZone,
		title: string,
		deposit: Coin[],
		proposer: string,
		fee: DidStdFee,
		memo?: string,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) this._signer = context!.sdk!.signer;

		const proposalEncodeObject = {
			typeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgRemoveHostZone,
						value: Uint8Array.from(MsgRemoveHostZone.encode(data).finish()),
					},
				],
				title,
				initialDeposit: deposit,
				proposer,
			}),
		} satisfies EncodeObject;

		return await this._signer.signAndBroadcast(proposer, [proposalEncodeObject], fee, memo);
	}

	async sendQueryIbcDenomTWAP(
		sender: string,
		data: MsgSendQueryIbcDenomTWAP,
		fee: DidStdFee,
		memo?: string,
		context?: IContext
	): Promise<MsgSendQueryIbcDenomTWAPResponse> {
		if (!this._signer) this._signer = context!.sdk!.signer;

		const sendQueryIbcDenomTwapMsg = {
			typeUrl: typeUrlMsgSendQueryIbcDenomTWAP,
			value: data,
		} satisfies MsgSendQueryIbcDenomTWAPEncodeObject;

		return await this._signer.signAndBroadcast(sender, [sendQueryIbcDenomTwapMsg], fee, memo);
	}

	async swapCrossChain(
		sender: string,
		ibcDenom: string,
		fee: DidStdFee,
		memo?: string,
		context?: IContext
	): Promise<MsgSwapCrossChainResponse> {
		if (!this._signer) this._signer = context!.sdk!.signer;

		const swapCrossChainMsg = {
			typeUrl: typeUrlMsgSwapCrossChain,
			value: {
				ibcDenom,
			},
		} satisfies MsgSwapCrossChainEncodeObject;

		return await this._signer.signAndBroadcast(sender, [swapCrossChainMsg], fee, memo);
	}

	async updateHostZoneProposal(
		data: MsgUpdateHostZone,
		title: string,
		deposit: Coin[],
		proposer: string,
		fee: DidStdFee,
		memo?: string,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) this._signer = context!.sdk!.signer;

		const proposalEncodeObject = {
			typeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgUpdateHostZone,
						value: Uint8Array.from(MsgUpdateHostZone.encode(data).finish()),
					},
				],
				title,
				initialDeposit: deposit,
				proposer,
			}),
		} satisfies EncodeObject;

		return await this._signer.signAndBroadcast(proposer, [proposalEncodeObject], fee, memo);
	}

	async updateParamsProposal(
		data: MsgUpdateParams,
		title: string,
		deposit: Coin[],
		proposer: string,
		fee: DidStdFee,
		memo?: string,
		context?: IContext
	): Promise<DeliverTxResponse> {
		if (!this._signer) this._signer = context!.sdk!.signer;

		const proposalEncodeObject = {
			typeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgUpdateParams,
						value: Uint8Array.from(MsgUpdateParams.encode(data).finish()),
					},
				],
				title,
				initialDeposit: deposit,
				proposer,
			}),
		} satisfies EncodeObject;

		return await this._signer.signAndBroadcast(proposer, [proposalEncodeObject], fee, memo);
	}
}
