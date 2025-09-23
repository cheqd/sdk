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
} from '@cheqd/ts-proto/feeabstraction/feeabs/v1beta1/index.js';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_.js';
import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from '@cosmjs/stargate';
import { DidStdFee, IContext, QueryExtensionSetup } from '../types.js';
import { CheqdQuerier } from '../querier.js';
import { CheqdSigningStargateClient } from '../signer.js';
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/gov/v1/tx.js';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin.js';

/** Default extension key for fee abstraction-related query operations */
export const defaultFeeabstractionExtensionKey = 'feeabs' as const;

/**
 * Protobuf message type literals for fee abstraction operations.
 * Used for consistent message type identification across the module.
 */
export const protobufLiterals = {
	/** Add host zone message type */
	MsgAddHostZone: 'MsgAddHostZone',
	/** Add host zone response message type */
	MsgAddHostZoneResponse: 'MsgAddHostZoneResponse',
	/** Fund fee abstraction module account message type */
	MsgFundFeeAbsModuleAccount: 'MsgFundFeeAbsModuleAccount',
	/** Fund fee abstraction module account response message type */
	MsgFundFeeAbsModuleAccountResponse: 'MsgFundFeeAbsModuleAccountResponse',
	/** Remove host zone message type */
	MsgRemoveHostZone: 'MsgRemoveHostZone',
	/** Remove host zone response message type */
	MsgRemoveHostZoneResponse: 'MsgRemoveHostZoneResponse',
	/** Send query IBC denomination TWAP message type */
	MsgSendQueryIbcDenomTWAP: 'MsgSendQueryIbcDenomTWAP',
	/** Send query IBC denomination TWAP response message type */
	MsgSendQueryIbcDenomTWAPResponse: 'MsgSendQueryIbcDenomTWAPResponse',
	/** Swap cross-chain message type */
	MsgSwapCrossChain: 'MsgSwapCrossChain',
	/** Swap cross-chain response message type */
	MsgSwapCrossChainResponse: 'MsgSwapCrossChainResponse',
	/** Update host zone message type */
	MsgUpdateHostZone: 'MsgUpdateHostZone',
	/** Update host zone response message type */
	MsgUpdateHostZoneResponse: 'MsgUpdateHostZoneResponse',
	/** Update parameters message type */
	MsgUpdateParams: 'MsgUpdateParams',
	/** Update parameters response message type */
	MsgUpdateParamsResponse: 'MsgUpdateParamsResponse',
} as const;

/** Type URL for MsgAddHostZone messages */
export const typeUrlMsgAddHostZone = `/${protobufPackage}.${protobufLiterals.MsgAddHostZone}` as const;
/** Type URL for MsgAddHostZoneResponse messages */
export const typeUrlMsgAddHostZoneResponse = `/${protobufPackage}.${protobufLiterals.MsgAddHostZoneResponse}` as const;
/** Type URL for MsgFundFeeAbsModuleAccount messages */
export const typeUrlMsgFundFeeAbsModuleAccount =
	`/${protobufPackage}.${protobufLiterals.MsgFundFeeAbsModuleAccount}` as const;
/** Type URL for MsgFundFeeAbsModuleAccountResponse messages */
export const typeUrlMsgFundFeeAbsModuleAccountResponse =
	`/${protobufPackage}.${protobufLiterals.MsgFundFeeAbsModuleAccountResponse}` as const;
/** Type URL for MsgRemoveHostZone messages */
export const typeUrlMsgRemoveHostZone = `/${protobufPackage}.${protobufLiterals.MsgRemoveHostZone}` as const;
/** Type URL for MsgRemoveHostZoneResponse messages */
export const typeUrlMsgRemoveHostZoneResponse =
	`/${protobufPackage}.${protobufLiterals.MsgRemoveHostZoneResponse}` as const;
/** Type URL for MsgSendQueryIbcDenomTWAP messages */
export const typeUrlMsgSendQueryIbcDenomTWAP =
	`/${protobufPackage}.${protobufLiterals.MsgSendQueryIbcDenomTWAP}` as const;
/** Type URL for MsgSendQueryIbcDenomTWAPResponse messages */
export const typeUrlMsgSendQueryIbcDenomTWAPResponse =
	`/${protobufPackage}.${protobufLiterals.MsgSendQueryIbcDenomTWAPResponse}` as const;
/** Type URL for MsgSwapCrossChain messages */
export const typeUrlMsgSwapCrossChain = `/${protobufPackage}.${protobufLiterals.MsgSwapCrossChain}` as const;
/** Type URL for MsgSwapCrossChainResponse messages */
export const typeUrlMsgSwapCrossChainResponse =
	`/${protobufPackage}.${protobufLiterals.MsgSwapCrossChainResponse}` as const;
/** Type URL for MsgUpdateHostZone messages */
export const typeUrlMsgUpdateHostZone = `/${protobufPackage}.${protobufLiterals.MsgUpdateHostZone}` as const;
/** Type URL for MsgUpdateHostZoneResponse messages */
export const typeUrlMsgUpdateHostZoneResponse =
	`/${protobufPackage}.${protobufLiterals.MsgUpdateHostZoneResponse}` as const;
/** Type URL for MsgUpdateParams messages */
export const typeUrlMsgUpdateParams = `/${protobufPackage}.${protobufLiterals.MsgUpdateParams}` as const;
/** Type URL for MsgUpdateParamsResponse messages */
export const typeUrlMsgUpdateParamsResponse =
	`/${protobufPackage}.${protobufLiterals.MsgUpdateParamsResponse}` as const;

/**
 * Encode object interface for MsgAddHostZone messages.
 * Used for type-safe message encoding in fee abstraction transactions.
 */
export interface MsgAddHostZoneEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgAddHostZone;
	readonly value: Partial<MsgAddHostZone>;
}

/**
 * Type guard function to check if an object is a MsgAddHostZoneEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgAddHostZoneEncodeObject
 */
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

/**
 * Encode object interface for MsgFundFeeAbsModuleAccountResponse messages.
 * Used for type-safe response message handling in fee abstraction module funding operations.
 */
export interface MsgFundFeeAbsModuleAccountResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgFundFeeAbsModuleAccountResponse;
	readonly value: Partial<MsgFundFeeAbsModuleAccountResponse>;
}

/**
 * Type guard function to check if an object is a MsgFundFeeAbsModuleAccountResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgFundFeeAbsModuleAccountResponseEncodeObject
 */
export function isMsgFundFeeAbsModuleAccountResponseEncodeObject(
	obj: EncodeObject
): obj is MsgFundFeeAbsModuleAccountResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgFundFeeAbsModuleAccountResponse;
}

/**
 * Encode object interface for MsgRemoveHostZone messages.
 * Used for type-safe message encoding in host zone removal transactions.
 */
export interface MsgRemoveHostZoneEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgRemoveHostZone;
	readonly value: Partial<MsgRemoveHostZone>;
}

/**
 * Type guard function to check if an object is a MsgRemoveHostZoneEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgRemoveHostZoneEncodeObject
 */
export function isMsgRemoveHostZoneEncodeObject(obj: EncodeObject): obj is MsgRemoveHostZoneEncodeObject {
	return obj.typeUrl === typeUrlMsgRemoveHostZone;
}

/**
 * Encode object interface for MsgRemoveHostZoneResponse messages.
 * Used for type-safe response message handling in host zone removal operations.
 */
export interface MsgRemoveHostZoneResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgRemoveHostZoneResponse;
	readonly value: Partial<MsgRemoveHostZoneResponse>;
}

/**
 * Type guard function to check if an object is a MsgRemoveHostZoneResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgRemoveHostZoneResponseEncodeObject
 */
export function isMsgRemoveHostZoneResponseEncodeObject(
	obj: EncodeObject
): obj is MsgRemoveHostZoneResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgRemoveHostZoneResponse;
}

/**
 * Encode object interface for MsgSendQueryIbcDenomTWAP messages.
 * Used for type-safe message encoding in IBC denomination TWAP query transactions.
 */
export interface MsgSendQueryIbcDenomTWAPEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSendQueryIbcDenomTWAP;
	readonly value: Partial<MsgSendQueryIbcDenomTWAP>;
}

/**
 * Type guard function to check if an object is a MsgSendQueryIbcDenomTWAPEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgSendQueryIbcDenomTWAPEncodeObject
 */
export function isMsgSendQueryIbcDenomTWAPEncodeObject(obj: EncodeObject): obj is MsgSendQueryIbcDenomTWAPEncodeObject {
	return obj.typeUrl === typeUrlMsgSendQueryIbcDenomTWAP;
}

/**
 * Encode object interface for MsgSendQueryIbcDenomTWAPResponse messages.
 * Used for type-safe response message handling in IBC denomination TWAP query operations.
 */
export interface MsgSendQueryIbcDenomTWAPResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSendQueryIbcDenomTWAPResponse;
	readonly value: Partial<MsgSendQueryIbcDenomTWAPResponse>;
}

/**
 * Type guard function to check if an object is a MsgSendQueryIbcDenomTWAPResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgSendQueryIbcDenomTWAPResponseEncodeObject
 */
export function isMsgSendQueryIbcDenomTWAPResponseEncodeObject(
	obj: EncodeObject
): obj is MsgSendQueryIbcDenomTWAPResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgSendQueryIbcDenomTWAPResponse;
}

/**
 * Encode object interface for MsgSwapCrossChain messages.
 * Used for type-safe message encoding in cross-chain swap transactions.
 */
export interface MsgSwapCrossChainEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSwapCrossChain;
	readonly value: Partial<MsgSwapCrossChain>;
}

/**
 * Type guard function to check if an object is a MsgSwapCrossChainEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgSwapCrossChainEncodeObject
 */
export function isMsgSwapCrossChainEncodeObject(obj: EncodeObject): obj is MsgSwapCrossChainEncodeObject {
	return obj.typeUrl === typeUrlMsgSwapCrossChain;
}

/**
 * Encode object interface for MsgSwapCrossChainResponse messages.
 * Used for type-safe response message handling in cross-chain swap operations.
 */
export interface MsgSwapCrossChainResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgSwapCrossChainResponse;
	readonly value: Partial<MsgSwapCrossChainResponse>;
}

/**
 * Type guard function to check if an object is a MsgSwapCrossChainResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgSwapCrossChainResponseEncodeObject
 */
export function isMsgSwapCrossChainResponseEncodeObject(
	obj: EncodeObject
): obj is MsgSwapCrossChainResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgSwapCrossChainResponse;
}

/**
 * Encode object interface for MsgUpdateHostZone messages.
 * Used for type-safe message encoding in host zone update transactions.
 */
export interface MsgUpdateHostZoneEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateHostZone;
	readonly value: Partial<MsgUpdateHostZone>;
}

/**
 * Type guard function to check if an object is a MsgUpdateHostZoneEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgUpdateHostZoneEncodeObject
 */
export function isMsgUpdateHostZoneEncodeObject(obj: EncodeObject): obj is MsgUpdateHostZoneEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateHostZone;
}

/**
 * Encode object interface for MsgUpdateHostZoneResponse messages.
 * Used for type-safe response message handling in host zone update operations.
 */
export interface MsgUpdateHostZoneResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateHostZoneResponse;
	readonly value: Partial<MsgUpdateHostZoneResponse>;
}

/**
 * Type guard function to check if an object is a MsgUpdateHostZoneResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgUpdateHostZoneResponseEncodeObject
 */
export function isMsgUpdateHostZoneResponseEncodeObject(
	obj: EncodeObject
): obj is MsgUpdateHostZoneResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateHostZoneResponse;
}

/**
 * Encode object interface for MsgUpdateParams messages.
 * Used for type-safe message encoding in parameter update transactions.
 */
export interface MsgUpdateParamsEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateParams;
	readonly value: Partial<MsgUpdateParams>;
}

/**
 * Type guard function to check if an object is a MsgUpdateParamsEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgUpdateParamsEncodeObject
 */
export function isMsgUpdateParamsEncodeObject(obj: EncodeObject): obj is MsgUpdateParamsEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateParams;
}

/**
 * Encode object interface for MsgUpdateParamsResponse messages.
 * Used for type-safe response message handling in parameter update operations.
 */
export interface MsgUpdateParamsResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateParamsResponse;
	readonly value: Partial<MsgUpdateParamsResponse>;
}

/**
 * Type guard function to check if an object is a MsgUpdateParamsResponseEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgUpdateParamsResponseEncodeObject
 */
export function isMsgUpdateParamsResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateParamsResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateParamsResponse;
}

/** Minimal importable version of the fee abstraction module for clean external interfaces */
export type MinimalImportableFeeabstractionModule = MinimalImportableCheqdSDKModule<FeeabstractionModule>;

/**
 * Fee abstraction extension interface for querier functionality.
 * Provides methods for querying fee abstraction-related data.
 */
export type FeeabstractionExtension = {
	readonly [defaultFeeabstractionExtensionKey]: {
		/** Query host chain configuration */
		readonly hostChainConfig: (request: QueryHostChainConfigRequest) => Promise<QueryHostChainConfigResponse>;
		/** Query Osmosis arithmetic TWAP data */
		readonly osmosisArithmeticTwap: (
			request: QueryOsmosisArithmeticTwapRequest
		) => Promise<QueryOsmosisArithmeticTwapResponse>;
		/** Query fee abstraction module account balances */
		readonly feeabsModuleBalances: (
			request: QueryFeeabsModuleBalacesRequest
		) => Promise<QueryFeeabsModuleBalacesResponse>;
	};
};

/**
 * Sets up the fee abstraction extension for the querier client.
 * Creates and configures the fee abstraction-specific query methods.
 *
 * @param base - Base QueryClient to extend
 * @returns Configured fee abstraction extension with query methods
 */
export const setupFeeabstractionExtension = (base: QueryClient): FeeabstractionExtension => {
	const rpc = createProtobufRpcClient(base);

	const queryService = new QueryClientImpl(rpc);

	return {
		[defaultFeeabstractionExtensionKey]: {
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

/**
 * Fee Abstraction Module class providing comprehensive fee abstraction functionality.
 * Handles host zone management, cross-chain swaps, and fee abstraction operations on the Cheqd blockchain.
 */
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

	/** Querier extension setup function for fee abstraction operations */
	static readonly querierExtensionSetup: QueryExtensionSetup<FeeabstractionExtension> = setupFeeabstractionExtension;

	/** Querier instance with fee abstraction extension capabilities */
	querier: CheqdQuerier & FeeabstractionExtension;

	/**
	 * Constructs a new fee abstraction module instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client with fee abstraction extension for data retrieval
	 */
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

	/**
	 * Gets the registry types for fee abstraction message encoding/decoding.
	 *
	 * @returns Iterable of [typeUrl, GeneratedType] pairs for the registry
	 */
	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return FeeabstractionModule.registryTypes;
	}

	/**
	 * Gets the querier extension setup for fee abstraction operations.
	 *
	 * @returns Query extension setup function for fee abstraction functionality
	 */
	public getQuerierExtensionSetup(): QueryExtensionSetup<FeeabstractionExtension> {
		return FeeabstractionModule.querierExtensionSetup;
	}

	/**
	 * Creates a governance proposal to add a new host zone for fee abstraction.
	 * Submits the proposal through the governance module for community voting.
	 *
	 * @param data - Host zone data to add
	 * @param title - Proposal title
	 * @param deposit - Initial deposit for the proposal
	 * @param proposer - Address of the proposal submitter
	 * @param fee - Transaction fee configuration
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 */
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

	/**
	 * Funds the fee abstraction module account with tokens.
	 * Allows users to provide liquidity for fee abstraction functionality.
	 *
	 * @param sender - Address of the account sending funds
	 * @param amount - Array of coins to send to the module account
	 * @param fee - Transaction fee configuration
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 */
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

	/**
	 * Creates a governance proposal to remove an existing host zone from fee abstraction.
	 * Submits the proposal through the governance module for community voting.
	 *
	 * @param data - Host zone data to remove
	 * @param title - Proposal title
	 * @param deposit - Initial deposit for the proposal
	 * @param proposer - Address of the proposal submitter
	 * @param fee - Transaction fee configuration
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 */
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

	/**
	 * Sends a query for IBC denomination Time-Weighted Average Price (TWAP) data.
	 * Initiates a cross-chain query to retrieve pricing information for fee calculation.
	 *
	 * @param sender - Address of the account sending the query
	 * @param data - TWAP query data containing denomination and parameters
	 * @param fee - Transaction fee configuration
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the TWAP query response
	 */
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

	/**
	 * Performs a cross-chain token swap using fee abstraction.
	 * Enables users to swap IBC tokens across different chains.
	 *
	 * @param sender - Address of the account initiating the swap
	 * @param ibcDenom - IBC denomination to swap
	 * @param fee - Transaction fee configuration
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the swap response
	 */
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

	/**
	 * Creates a governance proposal to update an existing host zone configuration.
	 * Submits the proposal through the governance module for community voting.
	 *
	 * @param data - Updated host zone configuration data
	 * @param title - Proposal title
	 * @param deposit - Initial deposit for the proposal
	 * @param proposer - Address of the proposal submitter
	 * @param fee - Transaction fee configuration
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 */
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

	/**
	 * Creates a governance proposal to update fee abstraction module parameters.
	 * Submits the proposal through the governance module for community voting.
	 *
	 * @param data - Updated module parameters
	 * @param title - Proposal title
	 * @param deposit - Initial deposit for the proposal
	 * @param proposer - Address of the proposal submitter
	 * @param fee - Transaction fee configuration
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the transaction response
	 */
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
