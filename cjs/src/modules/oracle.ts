import {
	protobufPackage,
	QueryActiveExchangeRatesResponse,
	QueryAggregatePrevoteResponse,
	QueryAggregatePrevotesResponse,
	QueryAggregateVotesResponse,
	QueryEMAResponse,
	QueryExchangeRatesResponse,
	QueryFeederDelegationResponse,
	QueryMedianDeviationsResponse,
	QueryMediansResponse,
	QueryMissCounterResponse,
	QueryParamsResponse,
	QuerySlashWindowResponse,
	QuerySMAResponse,
	QueryValidatorRewardSetResponse,
	QueryWMAResponse,
	QueryClientImpl,
	QueryAggregateVoteResponse,
	MsgAggregateExchangeRatePrevote,
	MsgAggregateExchangeRatePrevoteResponse,
	MsgAggregateExchangeRateVote,
	MsgDelegateFeedConsent,
	MsgLegacyGovUpdateParams,
	MsgGovUpdateParams,
	MsgGovAddDenoms,
	MsgGovRemoveCurrencyPairProviders,
	MsgGovRemoveCurrencyDeviationThresholds,
	MsgGovCancelUpdateParamPlan,
	ConvertUSDCtoCHEQResponse,
} from '@cheqd/ts-proto-cjs/cheqd/oracle/v2';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing-cjs';
import { Decimal } from '@cosmjs/math-cjs';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_';
import { createProtobufRpcClient, DeliverTxResponse, QueryClient } from '@cosmjs/stargate-cjs';
import { assert } from '@cosmjs/utils-cjs';
import { DidStdFee, IContext, QueryExtensionSetup } from '../types';
import { CheqdQuerier } from '../querier';
import { CheqdSigningStargateClient } from '../signer';
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/gov/v1/tx';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

/** Default extension key for Oracle-related query operations */
export const defaultOracleExtensionKey = 'oracle' as const;

/**
 * Protobuf message type for Oracle operations.
 * Used for consistent message type identification across the module.
 */
export const protobufLiterals = {
	/** Request to fetch exchange rates for specific denoms. */
	QueryExchangeRates: 'QueryExchangeRates',
	/** Response containing the exchange rates payload. */
	QueryExchangeRatesResponse: 'QueryExchangeRatesResponse',
	/** Request to list all active exchange rate denoms. */
	QueryActiveExchangeRates: 'QueryActiveExchangeRates',
	/** Response providing the currently active exchange rate denoms. */
	QueryActiveExchangeRatesResponse: 'QueryActiveExchangeRatesResponse',
	/** Request to retrieve the feeder delegation for a validator. */
	QueryFeederDelegation: 'QueryFeederDelegation',
	/** Response with feeder delegation details. */
	QueryFeederDelegationResponse: 'QueryFeederDelegationResponse',
	/** Request to obtain a validator's miss counter. */
	QueryMissCounter: 'QueryMissCounter',
	/** Response returning the miss counter value. */
	QueryMissCounterResponse: 'QueryMissCounterResponse',
	/** Request to inspect the current slash window information. */
	QuerySlashWindow: 'QuerySlashWindow',
	/** Response detailing the slash window configuration. */
	QuerySlashWindowResponse: 'QuerySlashWindowResponse',
	/** Request for a validator's aggregate prevote. */
	QueryAggregatePrevote: 'QueryAggregatePrevote',
	/** Response containing the aggregate prevote. */
	QueryAggregatePrevoteResponse: 'QueryAggregatePrevoteResponse',
	/** Request for all aggregate prevotes on the network. */
	QueryAggregatePrevotes: 'QueryAggregatePrevotes',
	/** Response listing all aggregate prevotes. */
	QueryAggregatePrevotesResponse: 'QueryAggregatePrevotesResponse',
	/** Request for aggregate votes from a validator. */
	QueryAggregateVotes: 'QueryAggregateVotes',
	/** Response carrying aggregate votes. */
	QueryAggregateVotesResponse: 'QueryAggregateVotesResponse',
	/** Request to fetch the oracle module parameters. */
	QueryParams: 'QueryParams',
	/** Response returning the oracle module parameters. */
	QueryParamsResponse: 'QueryParamsResponse',
	/** Request for price medians across denoms. */
	QueryMedians: 'QueryMedians',
	/** Response containing price medians. */
	QueryMediansResponse: 'QueryMediansResponse',
	/** Request for median deviations to assess volatility. */
	QueryMedianDeviations: 'QueryMedianDeviations',
	/** Response returning median deviation values. */
	QueryMedianDeviationsResponse: 'QueryMedianDeviationsResponse',
	/** Request to fetch the validator reward set. */
	QueryValidatorRewardSet: 'QueryValidatorRewardSet',
	/** Response with validator reward set data. */
	QueryValidatorRewardSetResponse: 'QueryValidatorRewardSetResponse',
	/** Request for an exponential moving average price. */
	QueryEMARequest: 'QueryEMARequest',
	/** Response containing exponential moving average data. */
	QueryEMAResponse: 'QueryEMAResponse',
	/** Request for a weighted moving average price. */
	QueryWMARequest: 'QueryWMARequest',
	/** Response containing weighted moving average data. */
	QueryWMAResponse: 'QueryWMAResponse',
	/** Request for a simple moving average price. */
	QuerySMARequest: 'QuerySMARequest',
	/** Response containing simple moving average data. */
	QuerySMAResponse: 'QuerySMAResponse',
	/** Request to convert a USDC amount into CHEQ. */
	ConvertUSDCtoCHEQRequest: 'ConvertUSDCtoCHEQRequest',
	/** Response returning the converted CHEQ amount. */
	ConvertUSDCtoCHEQResponse: 'ConvertUSDCtoCHEQResponse',
	/** Message to submit an aggregate exchange rate prevote. */
	MsgAggregateExchangeRatePrevote: 'MsgAggregateExchangeRatePrevote',
	/** Message that defines the MsgAggregateExchangeRatePrevote response type. */
	MsgAggregateExchangeRatePrevoteResponse: 'MsgAggregateExchangeRatePrevoteResponse',
	/** Message to submit an aggregate exchange rate vote. */
	MsgAggregateExchangeRateVote: 'MsgAggregateExchangeRateVote',
	/** Message that defines the MsgAggregateExchangeRateVote response type. */
	MsgAggregateExchangeRateVoteResponse: 'MsgAggregateExchangeRateVoteResponse',
	/** Message to delegate oracle voting rights to another address. */
	MsgDelegateFeedConsent: 'MsgDelegateFeedConsent',
	/** Message that defines the MsgDelegateFeedConsent response type. */
	MsgDelegateFeedConsentResponse: 'MsgDelegateFeedConsentResponse',
	/** Message that defines the MsgLegacyGovUpdateParams request type. */
	MsgLegacyGovUpdateParams: 'MsgLegacyGovUpdateParams',
	/** Message that defines the MsgLegacyGovUpdateParams response type. */
	MsgLegacyGovUpdateParamsResponse: 'MsgLegacyGovUpdateParamsResponse',
	/** Message that defines the MsgGovUpdateParams request type. */
	MsgGovUpdateParams: 'MsgGovUpdateParams',
	/** Message that defines the MsgGovUpdateParams response type. */
	MsgGovUpdateParamsResponse: 'MsgGovUpdateParamsResponse',
	/** Message that defines the MsgGovAddDenoms request type. */
	MsgGovAddDenoms: 'MsgGovAddDenoms',
	/** Message that defines the MsgGovAddDenoms response type. */
	MsgGovAddDenomsResponse: 'MsgGovAddDenomsResponse',
	/** Message that defines the MsgGovRemoveCurrencyPairProviders request type. */
	MsgGovRemoveCurrencyPairProviders: 'MsgGovRemoveCurrencyPairProviders',
	/** Message that defines the MsgGovRemoveCurrencyPairProviders response type. */
	MsgGovRemoveCurrencyPairProvidersResponse: 'MsgGovRemoveCurrencyPairProvidersResponse',
	/** Message that defines the MsgGovRemoveCurrencyDeviationThresholds request type. */
	MsgGovRemoveCurrencyDeviationThresholds: 'MsgGovRemoveCurrencyDeviationThresholds',
	/** Message that defines the MsgGovRemoveCurrencyDeviationThresholds response type. */
	MsgGovRemoveCurrencyDeviationThresholdsResponse: 'MsgGovRemoveCurrencyDeviationThresholdsResponse',
	/** Message that defines the MsgGovCancelUpdateParamPlan request type. */
	MsgGovCancelUpdateParamPlan: 'MsgGovCancelUpdateParamPlan',
	/** Message that defines the MsgGovCancelUpdateParamPlan response type. */
	MsgGovCancelUpdateParamPlanResponse: 'MsgGovCancelUpdateParamPlanResponse',
} as const;

/** Type URL for MsgAggregateExchangeRatePrevote messages */
export const typeUrlMsgAggregateExchangeRatePrevote = `/${protobufPackage}.MsgAggregateExchangeRatePrevote`;
/** Type URL for MsgAggregateExchangeRatePrevoteResponse messages */
export const typeUrlMsgAggregateExchangeRatePrevoteResponse = `/${protobufPackage}.MsgAggregateExchangeRatePrevoteResponse`;
/** Type URL for MsgAggregateExchangeRateVote messages */
export const typeUrlMsgAggregateExchangeRateVote = `/${protobufPackage}.MsgAggregateExchangeRateVote`;
/** Type URL for MsgAggregateExchangeRateVoteResponse messages */
export const typeUrlMsgAggregateExchangeRateVoteResponse = `/${protobufPackage}.MsgAggregateExchangeRateVoteResponse`;
/** Type URL for MsgDelegateFeedConsent messages */
export const typeUrlMsgDelegateFeedConsent = `/${protobufPackage}.MsgDelegateFeedConsent`;
/** Type URL for MsgDelegateFeedConsentResponse messages */
export const typeUrlMsgDelegateFeedConsentResponse = `/${protobufPackage}.MsgDelegateFeedConsentResponse`;
/** Type URL for MsgLegacyGovUpdateParams messages */
export const typeUrlMsgLegacyGovUpdateParams = `/${protobufPackage}.MsgLegacyGovUpdateParams`;
/** Type URL for MsgLegacyGovUpdateParamsResponse messages */
export const typeUrlMsgLegacyGovUpdateParamsResponse = `/${protobufPackage}.MsgLegacyGovUpdateParamsResponse`;
/** Type URL for MsgGovUpdateParams messages */
export const typeUrlMsgGovUpdateParams = `/${protobufPackage}.MsgGovUpdateParams`;
/** Type URL for MsgGovUpdateParamsResponse messages */
export const typeUrlMsgGovUpdateParamsResponse = `/${protobufPackage}.MsgGovUpdateParamsResponse`;
/** Type URL for MsgGovAddDenoms messages */
export const typeUrlMsgGovAddDenoms = `/${protobufPackage}.MsgGovAddDenoms`;
/** Type URL for MsgGovAddDenomsResponse messages */
export const typeUrlMsgGovAddDenomsResponse = `/${protobufPackage}.MsgGovAddDenomsResponse`;
/** Type URL for MsgGovRemoveCurrencyPairProviders messages */
export const typeUrlMsgGovRemoveCurrencyPairProviders = `/${protobufPackage}.MsgGovRemoveCurrencyPairProviders`;
/** Type URL for MsgGovRemoveCurrencyPairProvidersResponse messages */
export const typeUrlMsgGovRemoveCurrencyPairProvidersResponse = `/${protobufPackage}.MsgGovRemoveCurrencyPairProvidersResponse`;
/** Type URL for MsgGovRemoveCurrencyDeviationThresholds messages */
export const typeUrlMsgGovRemoveCurrencyDeviationThresholds = `/${protobufPackage}.MsgGovRemoveCurrencyDeviationThresholds`;
/** Type URL for MsgGovRemoveCurrencyDeviationThresholdsResponse messages */
export const typeUrlMsgGovRemoveCurrencyDeviationThresholdsResponse = `/${protobufPackage}.MsgGovRemoveCurrencyDeviationThresholdsResponse`;
/** Type URL for MsgGovCancelUpdateParamPlan messages */
export const typeUrlMsgGovCancelUpdateParamPlan = `/${protobufPackage}.MsgGovCancelUpdateParamPlan`;
/** Type URL for MsgGovCancelUpdateParamPlanResponse messages */
export const typeUrlMsgGovCancelUpdateParamPlanResponse = `/${protobufPackage}.MsgGovCancelUpdateParamPlanResponse`;

/**
 * Encode object interface for MsgAggregateExchangeRatePrevote
 */
export interface MsgAggregateExchangeRatePrevoteEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgAggregateExchangeRatePrevote;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgAggregateExchangeRateVote
 */
export interface MsgAggregateExchangeRateVoteEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgAggregateExchangeRateVote;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgDelegateFeedConsent
 */
export interface MsgDelegateFeedConsentEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgDelegateFeedConsent;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgLegacyGovUpdateParams
 */
export interface MsgLegacyGovUpdateParamsEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgLegacyGovUpdateParams;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgGovUpdateParams
 */
export interface MsgGovUpdateParamsEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgGovUpdateParams;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgGovAddDenoms
 */
export interface MsgGovAddDenomsEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgGovAddDenoms;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgGovRemoveCurrencyPairProviders
 */
export interface MsgGovRemoveCurrencyPairProvidersEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgGovRemoveCurrencyPairProviders;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgGovRemoveCurrencyDeviationThresholds
 */
export interface MsgGovRemoveCurrencyDeviationThresholdsEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgGovRemoveCurrencyDeviationThresholds;
	value: Uint8Array;
}

/**
 * Encode object interface for MsgGovCancelUpdateParamPlan
 */
export interface MsgGovCancelUpdateParamPlanEncodeObject extends EncodeObject {
	typeUrl: typeof typeUrlMsgGovCancelUpdateParamPlan;
	value: Uint8Array;
}

/**
 * Type guard function to check if an object is a MsgAggregateExchangeRatePrevoteEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgAggregateExchangeRatePrevoteEncodeObject, false otherwise
 */
export function isMsgAggregateExchangeRatePrevoteEncodeObject(
	obj: EncodeObject
): obj is MsgAggregateExchangeRatePrevoteEncodeObject {
	return obj.typeUrl === typeUrlMsgAggregateExchangeRatePrevote;
}
/**
 * Type guard function to check if an object is a MsgAggregateExchangeRateVoteEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgAggregateExchangeRateVoteEncodeObject, false otherwise
 */
export function isMsgAggregateExchangeRateVoteEncodeObject(
	obj: EncodeObject
): obj is MsgAggregateExchangeRateVoteEncodeObject {
	return obj.typeUrl === typeUrlMsgAggregateExchangeRateVote;
}
/**
 * Type guard function to check if an object is a MsgDelegateFeedConsentEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgDelegateFeedConsentEncodeObject, false otherwise
 */
export function isMsgDelegateFeedConsentEncodeObject(obj: EncodeObject): obj is MsgDelegateFeedConsentEncodeObject {
	return obj.typeUrl === typeUrlMsgDelegateFeedConsent;
}
/**
 * Type guard function to check if an object is a MsgLegacyGovUpdateParamsEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgLegacyGovUpdateParamsEncodeObject, false otherwise
 */
export function isMsgLegacyGovUpdateParamsEncodeObject(obj: EncodeObject): obj is MsgLegacyGovUpdateParamsEncodeObject {
	return obj.typeUrl === typeUrlMsgLegacyGovUpdateParams;
}
/**
 * Type guard function to check if an object is a MsgGovUpdateParamsEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgGovUpdateParamsEncodeObject, false otherwise
 */
export function isMsgGovUpdateParamsEncodeObject(obj: EncodeObject): obj is MsgGovUpdateParamsEncodeObject {
	return obj.typeUrl === typeUrlMsgGovUpdateParams;
}
/**
 * Type guard function to check if an object is a MsgGovAddDenomsEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgGovAddDenomsEncodeObject, false otherwise
 */
export function isMsgGovAddDenomsEncodeObject(obj: EncodeObject): obj is MsgGovAddDenomsEncodeObject {
	return obj.typeUrl === typeUrlMsgGovAddDenoms;
}
/**
 * Type guard function to check if an object is a MsgGovRemoveCurrencyPairProvidersEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgGovRemoveCurrencyPairProvidersEncodeObject, false otherwise
 */
export function isMsgGovRemoveCurrencyPairProvidersEncodeObject(
	obj: EncodeObject
): obj is MsgGovRemoveCurrencyPairProvidersEncodeObject {
	return obj.typeUrl === typeUrlMsgGovRemoveCurrencyPairProviders;
}
/**
 * Type guard function to check if an object is a MsgGovRemoveCurrencyDeviationThresholdsEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgGovRemoveCurrencyDeviationThresholdsEncodeObject, false otherwise
 */
export function isMsgGovRemoveCurrencyDeviationThresholdsEncodeObject(
	obj: EncodeObject
): obj is MsgGovRemoveCurrencyDeviationThresholdsEncodeObject {
	return obj.typeUrl === typeUrlMsgGovRemoveCurrencyDeviationThresholds;
}
/**
 * Type guard function to check if an object is a MsgGovCancelUpdateParamPlanEncodeObject
 * @param obj - EncodeObject to check
 * @returns True if the object is a MsgGovCancelUpdateParamPlanEncodeObject, false otherwise
 */
export function isMsgGovCancelUpdateParamPlanEncodeObject(
	obj: EncodeObject
): obj is MsgGovCancelUpdateParamPlanEncodeObject {
	return obj.typeUrl === typeUrlMsgGovCancelUpdateParamPlan;
}

/** Enumeration of WMA strategies */
export const WMAStrategies = {
	/** Balanced (linear) strategy */
	BALANCED: 'BALANCED',
	/** Recent (weighted) strategy */
	RECENT: 'RECENT',
	/** Oldest (weighted) strategy */
	OLDEST: 'OLDEST',
	/** Custom weights strategy */
	CUSTOM: 'CUSTOM',
} as const;

/** Enumeration of moving averages */
export const MovingAverages = {
	/** Exponential Moving Average */
	EMA: 'ema',
	/** Weighted Moving Average */
	WMA: 'wma',
	/** Simple Moving Average */
	SMA: 'sma',
} as const;

/** Type representing WMA strategies */
export type WMAStrategy = (typeof WMAStrategies)[keyof typeof WMAStrategies];

/** Type representing moving averages */
export type MovingAverage = (typeof MovingAverages)[keyof typeof MovingAverages];

/** Minimal importable version of the Oracle module for clean external interfaces */
export type MinimalImportableOracleModule = MinimalImportableCheqdSDKModule<OracleModule>;

/**
 * Oracle extension interface for querier functionality.
 * Provides methods for querying oracle exchange rates, moving averages and other oracle-related data.
 */
export type OracleExtension = {
	readonly [defaultOracleExtensionKey]: {
		/** Queries the exchange rate for a given denom */
		readonly queryExchangeRates: (denom: string) => Promise<QueryExchangeRatesResponse>;
		/** Query all active exchange rate denoms */
		readonly queryActiveExchangeRates: () => Promise<QueryActiveExchangeRatesResponse>;
		/** Query feeder delegation for a validator */
		readonly queryFeederDelegation: (validatorAddr: string) => Promise<QueryFeederDelegationResponse>;
		/** Query miss counter for a validator */
		readonly queryMissCounter: (validatorAddr: string) => Promise<QueryMissCounterResponse>;
		/** Query current slash window information */
		readonly querySlashWindow: () => Promise<QuerySlashWindowResponse>;
		/** Query aggregate prevote for a validator */
		readonly queryAggregatePrevote: (validatorAddr: string) => Promise<QueryAggregatePrevoteResponse>;
		/** Query aggregate prevotes */
		readonly queryAggregatePrevotes: () => Promise<QueryAggregatePrevotesResponse>;
		/** Query aggregate vote for a validator */
		readonly queryAggregateVote: (validatorAddr: string) => Promise<QueryAggregateVoteResponse>;
		/** Query aggregate votes for a validator */
		readonly queryAggregateVotes: (validatorAddr: string) => Promise<QueryAggregateVotesResponse>;
		/** Query oracle module parameters */
		readonly queryParams: () => Promise<QueryParamsResponse>;
		/** Query price medians */
		readonly queryMedians: (denom: string, numStamps: number) => Promise<QueryMediansResponse>;
		/** Query price median deviations */
		readonly queryMedianDeviations: (denom: string) => Promise<QueryMedianDeviationsResponse>;
		/** Query validator reward set */
		readonly queryValidatorRewardSet: () => Promise<QueryValidatorRewardSetResponse>;
		/** Query exponential moving average price */
		readonly queryEMA: (denom: string) => Promise<QueryEMAResponse>;
		/** Query weighted moving average price */
		readonly queryWMA: (denom: string, strategy?: WMAStrategy, weights?: bigint[]) => Promise<QueryWMAResponse>;
		/** Query simple moving average price */
		readonly querySMA: (denom: string) => Promise<QuerySMAResponse>;
		/** Convert USD values to CHEQ */
		readonly convertUSDtoCHEQ: (
			usdAmount: string,
			movingAverage: MovingAverage,
			wmaStrategy?: WMAStrategy,
			weights?: bigint[]
		) => Promise<ConvertUSDCtoCHEQResponse>;
	};
};

/** Options to control how oracle governance messages are wrapped in MsgSubmitProposal. */
export interface OracleGovProposalOptions {
	readonly deposit?: Coin[];
	readonly metadata?: string;
	readonly summary?: string;
	readonly expedited?: boolean;
}

/** Sets up the Oracle extension for the querier client.
 * Creates and configures the Oracle-specific query methods.
 * @param base - Base QueryClient to extend
 * @returns Configured Oracle extension with query methods
 */
export const setupOracleExtension = (base: QueryClient): OracleExtension => {
	const rpc = createProtobufRpcClient(base);

	const queryService = new QueryClientImpl(rpc);

	return {
		[defaultOracleExtensionKey]: {
			queryExchangeRates: async (denom = '') => {
				const response = await queryService.ExchangeRates({ denom });
				assert(response.exchangeRates, 'Expected exchangeRates in response');
				return response;
			},
			queryActiveExchangeRates: async () => {
				const response = await queryService.ActiveExchangeRates({});
				assert(response.activeRates, 'Expected activeRates in response');
				return response;
			},
			queryFeederDelegation: async (validatorAddr: string) => {
				const response = await queryService.FeederDelegation({ validatorAddr });
				assert(response.feederAddr, 'Expected feederAddr in response');
				return response;
			},
			queryMissCounter: async (validatorAddr: string) => {
				const response = await queryService.MissCounter({ validatorAddr });
				assert(response.missCounter, 'Expected missCounter in response');
				return response;
			},
			querySlashWindow: async () => {
				const response = await queryService.SlashWindow({});
				assert(response.windowProgress, 'Expected windowProgress in response');
				return response;
			},
			queryAggregatePrevote: async (validatorAddr: string) => {
				const response = await queryService.AggregatePrevote({ validatorAddr });
				assert(response.aggregatePrevote, 'Expected aggregatePrevote in response');
				return response;
			},
			queryAggregatePrevotes: async () => {
				const response = await queryService.AggregatePrevotes({});
				assert(response.aggregatePrevotes, 'Expected aggregatePrevotes in response');
				return response;
			},
			queryAggregateVote: async (validatorAddr: string) => {
				const response = await queryService.AggregateVote({ validatorAddr });
				assert(response.aggregateVote, 'Expected aggregateVote in response');
				return response;
			},
			queryAggregateVotes: async (validatorAddr: string) => {
				const response = await queryService.AggregateVotes({ validatorAddr });
				assert(response.aggregateVotes, 'Expected aggregateVotes in response');
				return response;
			},
			queryParams: async () => {
				const response = await queryService.Params({});
				assert(response.params, 'Expected params in response');
				return response;
			},
			queryMedians: async (denom: string, numStamps: number) => {
				const response = await queryService.Medians({ denom, numStamps });
				assert(response.medians, 'Expected medians in response');
				return response;
			},
			queryMedianDeviations: async (denom: string) => {
				const response = await queryService.MedianDeviations({ denom });
				assert(response.medianDeviations, 'Expected medianDeviations in response');
				return response;
			},
			queryValidatorRewardSet: async () => {
				const response = await queryService.ValidatorRewardSet({});
				assert(response.validators, 'Expected validators in response');
				return response;
			},
			queryEMA: async (denom: string) => {
				const response = await queryService.EMA({ denom });
				assert(response.price, 'Expected price in response');
				return response;
			},
			queryWMA: async (denom: string, strategy = WMAStrategies.BALANCED, weights: bigint[] = []) => {
				const response = await queryService.WMA({ denom, strategy, customWeights: weights });
				assert(response.price, 'Expected price in response');
				return response;
			},
			querySMA: async (denom: string) => {
				const response = await queryService.SMA({ denom });
				assert(response.price, 'Expected price in response');
				return response;
			},
			convertUSDtoCHEQ: async (
				usdAmount: string,
				movingAverage: MovingAverage,
				wmaStrategy: WMAStrategy = WMAStrategies.BALANCED,
				weights: bigint[] = []
			) => {
				const response = await queryService.ConvertUSDCtoCHEQ({
					amount: `${usdAmount}usd`,
					maType: movingAverage,
					wmaStrategy,
					customWeights: weights.map((w) => Number(w)),
				});
				assert(response.amount, 'Expected amount in response');
				return response;
			},
		},
	} satisfies OracleExtension;
};

/**
 * Oracle Module class providing comprehensive access to Oracle functionalities.
 * Handles both querying and transaction operations related to the Oracle module.
 */
export class OracleModule extends AbstractCheqdSDKModule {
	// @ts-expect-error underlying type `GeneratedType` is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlMsgAggregateExchangeRatePrevote, MsgAggregateExchangeRatePrevote],
		[typeUrlMsgAggregateExchangeRatePrevoteResponse, MsgAggregateExchangeRatePrevoteResponse],
		[typeUrlMsgAggregateExchangeRateVote, MsgAggregateExchangeRateVote],
		[typeUrlMsgDelegateFeedConsent, MsgDelegateFeedConsent],
		[typeUrlMsgLegacyGovUpdateParams, MsgLegacyGovUpdateParams],
		[typeUrlMsgGovUpdateParams, MsgGovUpdateParams],
		[typeUrlMsgGovAddDenoms, MsgGovAddDenoms],
		[typeUrlMsgGovRemoveCurrencyPairProviders, MsgGovRemoveCurrencyPairProviders],
		[typeUrlMsgGovRemoveCurrencyDeviationThresholds, MsgGovRemoveCurrencyDeviationThresholds],
		[typeUrlMsgGovCancelUpdateParamPlan, MsgGovCancelUpdateParamPlan],
	];

	/** Base denomination tickers for Cheqd network Oracle */
	static readonly baseDenomTickers = {
		CHEQ: 'CHEQ',
		USDC: 'USDC',
		USDT: 'USDT',
	} as const;

	/** Querier extension setup function for Oracle operations */
	static readonly querierExtensionSetup: QueryExtensionSetup<OracleExtension> = setupOracleExtension;

	/** Querier instance with Oracle extension capabilities */
	querier: CheqdQuerier & OracleExtension;

	/**
	 * Constructs a new Oracle module instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client with Oracle extension for data retrieval
	 */
	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & OracleExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			aggregateExchangeRatePrevoteTx: this.aggregateExchangeRatePrevoteTx.bind(this),
			aggregateExchangeRateVoteTx: this.aggregateExchangeRateVoteTx.bind(this),
			delegateFeedConsentTx: this.delegateFeedConsentTx.bind(this),
			legacyGovUpdateParamsTx: this.legacyGovUpdateParamsTx.bind(this),
			govUpdateParamsTx: this.govUpdateParamsTx.bind(this),
			govAddDenomsTx: this.govAddDenomsTx.bind(this),
			govRemoveCurrencyPairProvidersTx: this.govRemoveCurrencyPairProvidersTx.bind(this),
			govRemoveCurrencyDeviationThresholdsTx: this.govRemoveCurrencyDeviationThresholdsTx.bind(this),
			govCancelUpdateParamPlanTx: this.govCancelUpdateParamPlanTx.bind(this),
			queryExchangeRates: this.querier[defaultOracleExtensionKey].queryExchangeRates.bind(this),
			queryActiveExchangeRates: this.querier[defaultOracleExtensionKey].queryActiveExchangeRates.bind(this),
			queryFeederDelegation: this.querier[defaultOracleExtensionKey].queryFeederDelegation.bind(this),
			queryMissCounter: this.querier[defaultOracleExtensionKey].queryMissCounter.bind(this),
			querySlashWindow: this.querier[defaultOracleExtensionKey].querySlashWindow.bind(this),
			queryAggregatePrevote: this.querier[defaultOracleExtensionKey].queryAggregatePrevote.bind(this),
			queryAggregatePrevotes: this.querier[defaultOracleExtensionKey].queryAggregatePrevotes.bind(this),
			queryAggregateVote: this.querier[defaultOracleExtensionKey].queryAggregateVote.bind(this),
			queryAggregateVotes: this.querier[defaultOracleExtensionKey].queryAggregateVotes.bind(this),
			queryParams: this.querier[defaultOracleExtensionKey].queryParams.bind(this),
			queryMedians: this.querier[defaultOracleExtensionKey].queryMedians.bind(this),
			queryMedianDeviations: this.querier[defaultOracleExtensionKey].queryMedianDeviations.bind(this),
			queryValidatorRewardSet: this.querier[defaultOracleExtensionKey].queryValidatorRewardSet.bind(this),
			queryEMA: this.querier[defaultOracleExtensionKey].queryEMA.bind(this),
			queryWMA: this.querier[defaultOracleExtensionKey].queryWMA.bind(this),
			querySMA: this.querier[defaultOracleExtensionKey].querySMA.bind(this),
			convertUSDtoCHEQ: this.querier[defaultOracleExtensionKey].convertUSDtoCHEQ.bind(this),
		};
	}

	/**
	 * Gets the registry types for Oracle message encoding/decoding.
	 *
	 * @returns Iterable of [typeUrl, GeneratedType] pairs for the registry
	 */
	public getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return OracleModule.registryTypes;
	}

	/**
	 * Gets the querier extension setup for Oracle operations.
	 *
	 * @returns Query extension setup function for Oracle functionality
	 */
	public getQuerierExtensionSetup(): QueryExtensionSetup<OracleExtension> {
		return OracleModule.querierExtensionSetup;
	}

	/**
	 * Queries the module parameters from the blockchain.
	 *
	 * @returns Promise resolving to the QueryParamsResponse containing module parameters
	 */
	async queryParams(): Promise<QueryParamsResponse> {
		return this.querier[defaultOracleExtensionKey].queryParams();
	}

	/**
	 * Queries the exchange rate for a specific denom.
	 * @param denom - The denomination to query the exchange rate for
	 * @returns Promise resolving to the QueryExchangeRatesResponse containing the exchange rate
	 */
	async queryExchangeRate(denom: string): Promise<QueryExchangeRatesResponse> {
		return this.querier[defaultOracleExtensionKey].queryExchangeRates(denom);
	}

	/**
	 * Queries all active exchange rate denoms.
	 * @returns Promise resolving to the QueryActiveExchangeRatesResponse containing active denoms
	 */
	async queryActiveExchangeRates(): Promise<QueryActiveExchangeRatesResponse> {
		return this.querier[defaultOracleExtensionKey].queryActiveExchangeRates();
	}

	/**
	 * Queries the Exponential Moving Average (EMA) for a given denom.
	 * @param denom - The denomination to query the EMA for
	 * @returns Promise resolving to the QueryEMAResponse containing the EMA price in string Decimal format
	 */
	async queryEMA(denom: string): Promise<QueryEMAResponse> {
		const response = await this.querier[defaultOracleExtensionKey].queryEMA(denom);
		return {
			price: Decimal.fromAtomics(BigInt(response.price).toString(), 18).toString(),
		} satisfies QueryEMAResponse;
	}

	/**
	 * Queries the Weighted Moving Average (WMA) for a given denom.
	 * @param denom - The denomination to query the WMA for
	 * @param strategy - Optional WMA strategy, defaults to 'BALANCED'
	 * @param weights - Optional custom weights for the WMA calculation
	 * @returns Promise resolving to the QueryWMAResponse containing the WMA price in string Decimal format
	 */
	async queryWMA(denom: string, strategy?: WMAStrategy, weights?: number[]): Promise<QueryWMAResponse> {
		const response = await this.querier[defaultOracleExtensionKey].queryWMA(
			denom,
			strategy,
			weights?.map((w) => BigInt(w))
		);
		return {
			price: Decimal.fromAtomics(BigInt(response.price).toString(), 18).toString(),
		} satisfies QueryWMAResponse;
	}

	/**
	 * Queries the Simple Moving Average (SMA) for a given denom.
	 * @param denom - The denomination to query the SMA for
	 * @returns Promise resolving to the QuerySMAResponse containing the SMA price in string Decimal format
	 */
	async querySMA(denom: string): Promise<QuerySMAResponse> {
		const response = await this.querier[defaultOracleExtensionKey].querySMA(denom);
		return {
			price: Decimal.fromAtomics(BigInt(response.price).toString(), 18).toString(),
		} satisfies QuerySMAResponse;
	}

	/**
	 * Converts a USD amount to CHEQ using the specified moving average type.
	 * @param usdAmount - The USD amount to convert
	 * @param movingAverage - The type of moving average to use for conversion
	 * @param wmaStrategy - Optional WMA strategy, defaults to 'BALANCED'
	 * @param weights - Optional custom weights for WMA calculation
	 * @returns Promise resolving to the ConvertUSDCtoCHEQResponse containing the converted CHEQ amount
	 */
	async convertUSDtoCHEQ(
		usdAmount: string,
		movingAverage: MovingAverage,
		wmaStrategy?: WMAStrategy,
		weights?: number[]
	): Promise<ConvertUSDCtoCHEQResponse> {
		return this.querier[defaultOracleExtensionKey].convertUSDtoCHEQ(
			usdAmount,
			movingAverage,
			wmaStrategy,
			weights?.map((w) => BigInt(w))
		);
	}

	/**
	 * Broadcasts an aggregate exchange rate prevote transaction.
	 *
	 * @param payload - Message payload describing the prevote
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async aggregateExchangeRatePrevoteTx(
		payload: MsgAggregateExchangeRatePrevote,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext
	): Promise<DeliverTxResponse> {
		const encObj: EncodeObject = {
			typeUrl: typeUrlMsgAggregateExchangeRatePrevote,
			value: MsgAggregateExchangeRatePrevote.fromPartial(payload),
		};

		return this.broadcastOracleTx(encObj, address, fee, memo, context);
	}

	/**
	 * Broadcasts an aggregate exchange rate vote transaction.
	 *
	 * @param payload - Message payload describing the vote
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async aggregateExchangeRateVoteTx(
		payload: MsgAggregateExchangeRateVote,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext
	): Promise<DeliverTxResponse> {
		const encObj: EncodeObject = {
			typeUrl: typeUrlMsgAggregateExchangeRateVote,
			value: MsgAggregateExchangeRateVote.fromPartial(payload),
		};

		return this.broadcastOracleTx(encObj, address, fee, memo, context);
	}

	/**
	 * Delegates feed consent between operator and delegate.
	 *
	 * @param payload - Message payload describing the delegation
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async delegateFeedConsentTx(
		payload: MsgDelegateFeedConsent,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext
	): Promise<DeliverTxResponse> {
		const encObj: EncodeObject = {
			typeUrl: typeUrlMsgDelegateFeedConsent,
			value: MsgDelegateFeedConsent.fromPartial(payload),
		};

		return this.broadcastOracleTx(encObj, address, fee, memo, context);
	}

	/**
	 * Submits a legacy governance update params transaction via MsgSubmitProposal.
	 *
	 * @param payload - Legacy governance update parameters payload
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @param proposalOptions - Optional MsgSubmitProposal configuration such as deposit or metadata
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async legacyGovUpdateParamsTx(
		payload: MsgLegacyGovUpdateParams,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext,
		proposalOptions?: OracleGovProposalOptions
	): Promise<DeliverTxResponse> {
		const signerAddress = await this.ensureSignerAddress(address, context);
		const proposalMsg: EncodeObject = {
			typeUrl: MsgSubmitProposal.typeUrl,
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgLegacyGovUpdateParams,
						value: MsgLegacyGovUpdateParams.encode(payload).finish(),
					},
				],
				proposer: signerAddress,
				initialDeposit: proposalOptions?.deposit ?? [],
				metadata: proposalOptions?.metadata ?? '',
				title: payload.title ?? '',
				summary: proposalOptions?.summary ?? payload.description ?? '',
				expedited: proposalOptions?.expedited ?? false,
			}),
		};

		return this.broadcastOracleTx(proposalMsg, signerAddress, fee, memo, context);
	}

	/**
	 * Submits a governance update params transaction via MsgSubmitProposal.
	 *
	 * @param payload - Governance update parameters payload
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @param proposalOptions - Optional MsgSubmitProposal configuration such as deposit or metadata
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async govUpdateParamsTx(
		payload: MsgGovUpdateParams,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext,
		proposalOptions?: OracleGovProposalOptions
	): Promise<DeliverTxResponse> {
		const signerAddress = await this.ensureSignerAddress(address, context);
		const proposalMsg: EncodeObject = {
			typeUrl: MsgSubmitProposal.typeUrl,
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgGovUpdateParams,
						value: MsgGovUpdateParams.encode(payload).finish(),
					},
				],
				proposer: signerAddress,
				initialDeposit: proposalOptions?.deposit ?? [],
				metadata: proposalOptions?.metadata ?? '',
				title: payload.title ?? '',
				summary: proposalOptions?.summary ?? payload.description ?? '',
				expedited: proposalOptions?.expedited ?? false,
			}),
		};

		return this.broadcastOracleTx(proposalMsg, signerAddress, fee, memo, context);
	}

	/**
	 * Adds new denoms to the oracle registry via MsgSubmitProposal.
	 *
	 * @param payload - Governance proposal payload that describes the new denoms
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @param proposalOptions - Optional MsgSubmitProposal configuration such as deposit or metadata
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async govAddDenomsTx(
		payload: MsgGovAddDenoms,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext,
		proposalOptions?: OracleGovProposalOptions
	): Promise<DeliverTxResponse> {
		const signerAddress = await this.ensureSignerAddress(address, context);
		const proposalMsg: EncodeObject = {
			typeUrl: MsgSubmitProposal.typeUrl,
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgGovAddDenoms,
						value: MsgGovAddDenoms.encode(payload).finish(),
					},
				],
				proposer: signerAddress,
				initialDeposit: proposalOptions?.deposit ?? [],
				metadata: proposalOptions?.metadata ?? '',
				title: payload.title ?? '',
				summary: proposalOptions?.summary ?? payload.description ?? '',
				expedited: proposalOptions?.expedited ?? false,
			}),
		};

		return this.broadcastOracleTx(proposalMsg, signerAddress, fee, memo, context);
	}

	/**
	 * Removes currency pair providers from the oracle configuration via MsgSubmitProposal.
	 *
	 * @param payload - Governance proposal payload describing providers to remove
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @param proposalOptions - Optional MsgSubmitProposal configuration such as deposit or metadata
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async govRemoveCurrencyPairProvidersTx(
		payload: MsgGovRemoveCurrencyPairProviders,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext,
		proposalOptions?: OracleGovProposalOptions
	): Promise<DeliverTxResponse> {
		const signerAddress = await this.ensureSignerAddress(address, context);
		const proposalMsg: EncodeObject = {
			typeUrl: MsgSubmitProposal.typeUrl,
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgGovRemoveCurrencyPairProviders,
						value: MsgGovRemoveCurrencyPairProviders.encode(payload).finish(),
					},
				],
				proposer: signerAddress,
				initialDeposit: proposalOptions?.deposit ?? [],
				metadata: proposalOptions?.metadata ?? '',
				title: payload.title ?? '',
				summary: proposalOptions?.summary ?? payload.description ?? '',
				expedited: proposalOptions?.expedited ?? false,
			}),
		};

		return this.broadcastOracleTx(proposalMsg, signerAddress, fee, memo, context);
	}

	/**
	 * Removes currency deviation thresholds via MsgSubmitProposal.
	 *
	 * @param payload - Governance payload describing currencies to remove
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @param proposalOptions - Optional MsgSubmitProposal configuration such as deposit or metadata
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async govRemoveCurrencyDeviationThresholdsTx(
		payload: MsgGovRemoveCurrencyDeviationThresholds,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext,
		proposalOptions?: OracleGovProposalOptions
	): Promise<DeliverTxResponse> {
		const signerAddress = await this.ensureSignerAddress(address, context);
		const proposalMsg: EncodeObject = {
			typeUrl: MsgSubmitProposal.typeUrl,
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgGovRemoveCurrencyDeviationThresholds,
						value: MsgGovRemoveCurrencyDeviationThresholds.encode(payload).finish(),
					},
				],
				proposer: signerAddress,
				initialDeposit: proposalOptions?.deposit ?? [],
				metadata: proposalOptions?.metadata ?? '',
				title: payload.title ?? '',
				summary: proposalOptions?.summary ?? payload.description ?? '',
				expedited: proposalOptions?.expedited ?? false,
			}),
		};

		return this.broadcastOracleTx(proposalMsg, signerAddress, fee, memo, context);
	}

	/**
	 * Cancels a pending parameter update plan via MsgSubmitProposal.
	 *
	 * @param payload - Governance payload containing cancellation details
	 * @param address - Address responsible for paying the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context to lazily resolve signer or wallet
	 * @param proposalOptions - Optional MsgSubmitProposal configuration such as deposit or metadata
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	async govCancelUpdateParamPlanTx(
		payload: MsgGovCancelUpdateParamPlan,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext,
		proposalOptions?: OracleGovProposalOptions
	): Promise<DeliverTxResponse> {
		const signerAddress = await this.ensureSignerAddress(address, context);
		const proposalMsg: EncodeObject = {
			typeUrl: MsgSubmitProposal.typeUrl,
			value: MsgSubmitProposal.fromPartial({
				messages: [
					{
						typeUrl: typeUrlMsgGovCancelUpdateParamPlan,
						value: MsgGovCancelUpdateParamPlan.encode(payload).finish(),
					},
				],
				proposer: signerAddress,
				initialDeposit: proposalOptions?.deposit ?? [],
				metadata: proposalOptions?.metadata ?? '',
				title: payload.title ?? '',
				summary: proposalOptions?.summary ?? payload.description ?? '',
				expedited: proposalOptions?.expedited ?? false,
			}),
		};

		return this.broadcastOracleTx(proposalMsg, signerAddress, fee, memo, context);
	}

	/**
	 * Ensures a signer client exists and resolves the address to use for broadcasting.
	 *
	 * @param address - Address provided by the caller (optional)
	 * @param context - Optional SDK context used to resolve signer or wallet
	 * @returns Resolved signer address
	 */
	private async ensureSignerAddress(address: string, context?: IContext): Promise<string> {
		if (!this._signer) {
			assert(context?.sdk?.signer, 'Signer client is required to broadcast oracle transactions');
			this._signer = context!.sdk!.signer;
		}

		if (address && address.length > 0) {
			return address;
		}

		assert(context?.sdk?.options?.wallet, 'Wallet context is required when no address is provided');
		const accounts = await context!.sdk!.options.wallet.getAccounts();
		assert(accounts.length > 0, 'No accounts available in the provided wallet');
		return accounts[0].address;
	}

	/**
	 * Signs and broadcasts the provided oracle transaction.
	 *
	 * @param message - EncodeObject representing the oracle message
	 * @param address - Address responsible for the transaction fees
	 * @param fee - Optional fee configuration, defaults to automatic calculation
	 * @param memo - Optional transaction memo
	 * @param context - Optional SDK context used to resolve signer or wallet
	 * @returns Promise resolving to the DeliverTxResponse
	 */
	private async broadcastOracleTx(
		message: EncodeObject,
		address: string,
		fee?: DidStdFee | 'auto' | number,
		memo = '',
		context?: IContext
	): Promise<DeliverTxResponse> {
		const signerAddress = await this.ensureSignerAddress(address, context);
		return this._signer.signAndBroadcast(signerAddress, [message], fee ?? 'auto', memo);
	}

	/**
	 * Parses a decimal price string back into its atomic representation.
	 * @param price - Price in decimal string format
	 * @returns Promise resolving to the atomic string representation of the price
	 */
	static async parseFromDecimalPrice(price: string): Promise<string> {
		const decimal = Decimal.fromUserInput(price, 18);
		return decimal.atomics;
	}
}
