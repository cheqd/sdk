import {
	GasPriceResponse,
	GasPricesResponse,
	ParamsResponse,
	QueryClientImpl,
	protobufPackage,
} from '@cheqd/ts-proto/feemarket/feemarket/v1/index.js';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing';
import { createProtobufRpcClient, GasPrice, QueryClient } from '@cosmjs/stargate';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_.js';
import { DidStdFee, IContext, QueryExtensionSetup } from '../types.js';
import { CheqdQuerier } from '../querier.js';
import { CheqdSigningStargateClient } from '../signer.js';
import { DefaultBackoffOptions, retry } from '../utils.js';
import { Decimal, Uint32 } from '@cosmjs/math';

/** Default extension key for fee market-related query operations */
export const defaultFeemarketExtensionKey = 'feemarket' as const;

/**
 * Protobuf message type literals for fee market operations.
 * Used for consistent message type identification across the module.
 */
export const protobufLiterals = {
	/** Gas price response message type */
	GasPriceResponse: 'GasPriceResponse',
	/** Gas prices response message type */
	GasPricesResponse: 'GasPricesResponse',
	/** Parameters response message type */
	ParamsResponse: 'ParamsResponse',
} as const;

/** Type URL for GasPriceResponse messages */
export const typeUrlGasPriceResponse = `/${protobufPackage}.${protobufLiterals.GasPriceResponse}` as const;
/** Type URL for GasPricesResponse messages */
export const typeUrlGasPricesResponse = `/${protobufPackage}.${protobufLiterals.GasPricesResponse}` as const;
/** Type URL for ParamsResponse messages */
export const typeUrlParamsResponse = `/${protobufPackage}.${protobufLiterals.ParamsResponse}` as const;

/**
 * Default gas price tier names for fee calculation.
 * Provides predefined tiers for different transaction priority levels.
 */
export const defaultGasPriceTiers = {
	/** Low priority tier with lowest gas prices */
	Low: 'DefaultLowTier',
	/** Average priority tier with moderate gas prices */
	Avg: 'DefaultAvgTier',
	/** High priority tier with highest gas prices */
	High: 'DefaultHighTier',
} as const;

/** Type representing the available default gas price tiers */
export type DefaultGasPriceTiers = (typeof defaultGasPriceTiers)[keyof typeof defaultGasPriceTiers];

/**
 * Encode object interface for GasPriceResponse messages.
 * Used for type-safe message encoding in gas price operations.
 */
export interface GasPriceEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlGasPriceResponse;
	readonly value: Partial<GasPriceResponse>;
}

/**
 * Type guard function to check if an object is a GasPriceEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a GasPriceEncodeObject
 */
export function isGasPriceEncodeObject(obj: EncodeObject): obj is GasPriceEncodeObject {
	return obj.typeUrl === typeUrlGasPriceResponse;
}

/**
 * Encode object interface for GasPricesResponse messages.
 * Used for type-safe message encoding in gas prices query operations.
 */
export interface GasPricesEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlGasPricesResponse;
	readonly value: Partial<GasPricesResponse>;
}

/**
 * Type guard function to check if an object is a GasPricesEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a GasPricesEncodeObject
 */
export function isGasPricesEncodeObject(obj: EncodeObject): obj is GasPricesEncodeObject {
	return obj.typeUrl === typeUrlGasPricesResponse;
}

/**
 * Encode object interface for ParamsResponse messages.
 * Used for type-safe message encoding in fee market parameters operations.
 */
export interface ParamsEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlParamsResponse;
	readonly value: Partial<ParamsResponse>;
}

/**
 * Type guard function to check if an object is a ParamsEncodeObject.
 *
 * @param obj - EncodeObject to check
 * @returns True if the object is a ParamsEncodeObject
 */
export function isParamsEncodeObject(obj: EncodeObject): obj is ParamsEncodeObject {
	return obj.typeUrl === typeUrlParamsResponse;
}

/** Minimal importable version of the fee market module for clean external interfaces */
export type MinimalImportableFeemarketModule = MinimalImportableCheqdSDKModule<FeemarketModule>;

/**
 * Fee market extension interface for querier functionality.
 * Provides methods for querying gas prices and fee market parameters.
 */
export type FeemarketExtension = {
	readonly [defaultFeemarketExtensionKey]: {
		/** Query gas price for a specific denomination */
		readonly gasPrice: (denom: string) => Promise<GasPriceResponse>;
		/** Query all available gas prices */
		readonly gasPrices: () => Promise<GasPricesResponse>;
		/** Query fee market module parameters */
		readonly params: () => Promise<ParamsResponse>;
	};
};

/**
 * Sets up the fee market extension for the querier client.
 * Creates and configures the fee market-specific query methods.
 *
 * @param base - Base QueryClient to extend
 * @returns Configured fee market extension with query methods
 */
export const setupFeemarketExtension = (base: QueryClient): FeemarketExtension => {
	const rpc = createProtobufRpcClient(base);

	const queryService = new QueryClientImpl(rpc);

	return {
		[defaultFeemarketExtensionKey]: {
			gasPrice: async (denom: string) => {
				return queryService.GasPrice({ denom });
			},
			gasPrices: async () => {
				return queryService.GasPrices({});
			},
			params: async () => {
				return queryService.Params({});
			},
		},
	};
};

/**
 * Fee Market Module class providing comprehensive fee market functionality.
 * Handles gas price queries, dynamic fee calculation, and fee market parameter management.
 */
export class FeemarketModule extends AbstractCheqdSDKModule {
	// @ts-expect-error underlying type `GeneratedType` is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlGasPriceResponse, GasPriceResponse],
		[typeUrlGasPricesResponse, GasPricesResponse],
		[typeUrlParamsResponse, ParamsResponse],
	];

	/**
	 * Default gas prices for different priority tiers.
	 * Used as fallback when live gas price queries are unavailable.
	 */
	static readonly defaultGasPrices = {
		[defaultGasPriceTiers.Low]: { amount: '5000', denom: 'ncheq' },
		[defaultGasPriceTiers.Avg]: { amount: '7500', denom: 'ncheq' },
		[defaultGasPriceTiers.High]: { amount: '10000', denom: 'ncheq' },
	} as const;

	/** Gas offset factor used for adjusting live gas prices */
	static readonly gasOffsetFactor = 10 ** 4;

	/** Address of the fee collector account that receives transaction fees */
	static readonly feeCollectorAddress = 'cheqd13pxn9n3qw79e03844rdadagmg0nshmwfszqu0g' as const;

	/** Address of the fee market module account */
	static readonly moduleAccountAddress = 'cheqd1el68mjnzv87uurqks8u29tec0cj3297047g2dl' as const;

	/** Querier extension setup function for fee market operations */
	static readonly querierExtensionSetup: QueryExtensionSetup<FeemarketExtension> = setupFeemarketExtension;

	/** Querier instance with fee market extension capabilities */
	querier: CheqdQuerier & FeemarketExtension;

	/**
	 * Constructs a new fee market module instance.
	 *
	 * @param signer - Signing client for blockchain transactions
	 * @param querier - Querier client with fee market extension for data retrieval
	 */
	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & FeemarketExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			queryGasPrice: this.queryGasPrice.bind(this),
			queryGasPrices: this.queryGasPrices.bind(this),
			queryFeemarketParams: this.queryFeemarketParams.bind(this),
			generateGasPrice: this.generateGasPrice.bind(this),
			generateOfflineGasPrice: this.generateOfflineGasPrice.bind(this),
			generateSafeGasPrice: this.generateSafeGasPrice.bind(this),
			generateSafeGasPriceWithExponentialBackoff: this.generateSafeGasPriceWithExponentialBackoff.bind(this),
		};
	}

	/**
	 * Gets the registry types for fee market message encoding/decoding.
	 *
	 * @returns Iterable of [typeUrl, GeneratedType] pairs for the registry
	 */
	getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return FeemarketModule.registryTypes;
	}

	/**
	 * Gets the querier extension setup for fee market operations.
	 *
	 * @returns Query extension setup function for fee market functionality
	 */
	getQuerierExtensionSetup(): QueryExtensionSetup<FeemarketExtension> {
		return FeemarketModule.querierExtensionSetup;
	}

	/**
	 * Queries the current gas price for a specific denomination.
	 * Retrieves live gas price data from the fee market module.
	 *
	 * @param denom - Token denomination to query gas price for
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the gas price response
	 */
	async queryGasPrice(denom: string, context?: IContext): Promise<GasPriceResponse> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		return this.querier[defaultFeemarketExtensionKey].gasPrice(denom);
	}

	/**
	 * Queries all available gas prices from the fee market.
	 * Retrieves comprehensive gas pricing information for all denominations.
	 *
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the gas prices response
	 */
	async queryGasPrices(context?: IContext): Promise<GasPricesResponse> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		return this.querier[defaultFeemarketExtensionKey].gasPrices();
	}

	/**
	 * Queries the fee market module parameters.
	 * Retrieves configuration settings for the fee market functionality.
	 *
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the parameters response
	 */
	async queryFeemarketParams(context?: IContext): Promise<ParamsResponse> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		return this.querier[defaultFeemarketExtensionKey].params();
	}

	/**
	 * Generates gas price for a denomination by live polling the fee market.
	 * Queries current gas prices and adjusts them using the gas offset factor.
	 * Throws an error if live polling fails.
	 *
	 * @param denom - Token denomination to generate gas price for
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the calculated gas price
	 * @throws Error if live poll for gas price fails or returns invalid data
	 */
	async generateGasPrice(denom: string, context?: IContext): Promise<GasPrice> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		// query gas price, bubble up error, no catch
		const gasPrice = await this.queryGasPrice(denom, context);

		// validate gas price
		if (!gasPrice.price) throw new Error('Invalid gas price: live poll for gas price failed');

		// convert gas price through offset factor
		const adjustedGasPrice = Decimal.fromAtomics(gasPrice.price.amount, 18)
			.multiply(Uint32.fromString(FeemarketModule.gasOffsetFactor.toString()))
			.toString();

		// safe convert gas price to string
		return GasPrice.fromString(`${adjustedGasPrice}${gasPrice.price.denom}`);
	}

	/**
	 * Generates offline gas price for a denomination using static tier pricing.
	 * Uses predefined gas prices as fallback when live polling is unavailable.
	 *
	 * @param denom - Token denomination to generate gas price for
	 * @param tier - Priority tier for gas price calculation (defaults to Low)
	 * @returns Promise resolving to the static gas price
	 * @throws Error if denomination or tier is invalid
	 */
	async generateOfflineGasPrice(
		denom: string,
		tier: DefaultGasPriceTiers = defaultGasPriceTiers.Low
	): Promise<GasPrice> {
		// validate denom against default
		if (!Object.values(FeemarketModule.defaultGasPrices).some((gp) => gp.denom === denom))
			throw new Error(`Invalid denom: ${denom}`);

		// validate tier against default
		if (!Object.keys(FeemarketModule.defaultGasPrices).includes(tier)) throw new Error(`Invalid tier: ${tier}`);

		// generate gas price
		const gasPrice = FeemarketModule.defaultGasPrices[tier];

		// safe convert gas price to string
		return GasPrice.fromString(`${gasPrice.amount}${gasPrice.denom}`);
	}

	/**
	 * Generates safe gas price with automatic fallback to offline pricing.
	 * Attempts live polling first, falls back to static tier pricing if it fails.
	 *
	 * @param denom - Token denomination to generate gas price for
	 * @param tier - Priority tier for fallback gas price calculation (defaults to Low)
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the gas price (live or fallback)
	 */
	async generateSafeGasPrice(
		denom: string,
		tier: DefaultGasPriceTiers = defaultGasPriceTiers.Low,
		context?: IContext
	): Promise<GasPrice> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		try {
			// generate gas price
			return await this.generateGasPrice(denom, context);
		} catch (error) {
			// generate offline gas price
			return await this.generateOfflineGasPrice(denom, tier);
		}
	}

	/**
	 * Generates safe gas price with exponential backoff retry mechanism.
	 * Retries live polling with exponential backoff before falling back to offline pricing.
	 *
	 * @param denom - Token denomination to generate gas price for
	 * @param tier - Priority tier for fallback gas price calculation (defaults to Low)
	 * @param backoffOptions - Retry configuration options (defaults to DefaultBackoffOptions)
	 * @param context - Optional SDK context for accessing clients
	 * @returns Promise resolving to the gas price (live with retries or fallback)
	 */
	async generateSafeGasPriceWithExponentialBackoff(
		denom: string,
		tier: DefaultGasPriceTiers = defaultGasPriceTiers.Low,
		backoffOptions = DefaultBackoffOptions,
		context?: IContext
	): Promise<GasPrice> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		// live poll for gas price
		const gasPrice = await retry(() => this.generateGasPrice(denom, context), backoffOptions);

		// return, if applicable
		if (gasPrice) return gasPrice;

		// otherwise, generate offline gas price
		return await this.generateOfflineGasPrice(denom, tier);
	}

	/**
	 * Generates transaction fees from a given gas price.
	 * Calculates the total fee amount based on gas price and gas limit.
	 *
	 * @param gasPrice - Gas price to use for fee calculation
	 * @param payer - Address of the account paying the transaction fees
	 * @param gas - Gas limit for the transaction (defaults to '200000')
	 * @returns Standard fee configuration for the transaction
	 */
	static generateFeesFromGasPrice(gasPrice: GasPrice, payer: string, gas = '200000'): DidStdFee {
		return {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			amount: [
				{ denom: gasPrice.denom, amount: gasPrice.amount.multiply(Uint32.fromString(gas) as any).toString() },
			],
			gas,
			payer,
		} satisfies DidStdFee;
	}
}
