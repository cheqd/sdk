import {
	GasPriceResponse,
	GasPricesResponse,
	ParamsResponse,
	QueryClientImpl,
	protobufPackage,
} from '@cheqd/ts-proto-cjs/feemarket/feemarket/v1/index.js';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing-cjs';
import { createProtobufRpcClient, GasPrice, QueryClient } from '@cosmjs/stargate-cjs';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_';
import { IContext, QueryExtensionSetup } from '../types';
import { CheqdQuerier } from '../querier';
import { CheqdSigningStargateClient } from '../signer';
import { DefaultBackoffOptions, retry } from '../utils';
import { Decimal, Uint32 } from '@cosmjs/math-cjs';

export const defaultFeemarketExtensionKey = 'feemarket' as const;

export const protobufLiterals = {
	GasPriceResponse: 'GasPriceResponse',
	GasPricesResponse: 'GasPricesResponse',
	ParamsResponse: 'ParamsResponse',
} as const;

export const typeUrlGasPriceResponse = `/${protobufPackage}.${protobufLiterals.GasPriceResponse}`;
export const typeUrlGasPricesResponse = `/${protobufPackage}.${protobufLiterals.GasPricesResponse}`;
export const typeUrlParamsResponse = `/${protobufPackage}.${protobufLiterals.ParamsResponse}`;

export const defaultGasPriceTiers = {
	Low: 'DefaultLowTier',
	Avg: 'DefaultAvgTier',
	High: 'DefaultHighTier',
} as const;

export type DefaultGasPriceTiers = (typeof defaultGasPriceTiers)[keyof typeof defaultGasPriceTiers];

export interface GasPriceEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlGasPriceResponse;
	readonly value: Partial<GasPriceResponse>;
}

export function isGasPriceEncodeObject(obj: EncodeObject): obj is GasPriceEncodeObject {
	return obj.typeUrl === typeUrlGasPriceResponse;
}

export interface GasPricesEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlGasPricesResponse;
	readonly value: Partial<GasPricesResponse>;
}

export function isGasPricesEncodeObject(obj: EncodeObject): obj is GasPricesEncodeObject {
	return obj.typeUrl === typeUrlGasPricesResponse;
}

export interface ParamsEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlParamsResponse;
	readonly value: Partial<ParamsResponse>;
}

export function isParamsEncodeObject(obj: EncodeObject): obj is ParamsEncodeObject {
	return obj.typeUrl === typeUrlParamsResponse;
}

export type MinimalImportableFeemarketModule = MinimalImportableCheqdSDKModule<FeemarketModule>;

export type FeemarketExtension = {
	readonly [defaultFeemarketExtensionKey]: {
		readonly gasPrice: (denom: string) => Promise<GasPriceResponse>;
		readonly gasPrices: () => Promise<GasPricesResponse>;
		readonly params: () => Promise<ParamsResponse>;
	};
};

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

export class FeemarketModule extends AbstractCheqdSDKModule {
	// @ts-expect-error underlying type `GeneratedType` is intentionally wider
	static readonly registryTypes: Iterable<[string, GeneratedType]> = [
		[typeUrlGasPriceResponse, GasPriceResponse],
		[typeUrlGasPricesResponse, GasPricesResponse],
		[typeUrlParamsResponse, ParamsResponse],
	];

	static readonly defaultGasPrices = {
		[defaultGasPriceTiers.Low]: { amount: '5000', denom: 'ncheq' },
		[defaultGasPriceTiers.Avg]: { amount: '7500', denom: 'ncheq' },
		[defaultGasPriceTiers.High]: { amount: '10000', denom: 'ncheq' },
	};

	static readonly gasOffsetFactor = 10 ** 4;

	static readonly querierExtensionSetup: QueryExtensionSetup<FeemarketExtension> = setupFeemarketExtension;

	querier: CheqdQuerier & FeemarketExtension;

	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & FeemarketExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			queryGasPrice: this.queryGasPrice.bind(this),
			queryGasPrices: this.queryGasPrices.bind(this),
			queryParams: this.queryParams.bind(this),
			generateGasPrice: this.generateGasPrice.bind(this),
			generateOfflineGasPrice: this.generateOfflineGasPrice.bind(this),
			generateSafeGasPrice: this.generateSafeGasPrice.bind(this),
			generateSafeGasPriceWithExponentialBackoff: this.generateSafeGasPriceWithExponentialBackoff.bind(this),
		};
	}

	getRegistryTypes(): Iterable<[string, GeneratedType]> {
		return FeemarketModule.registryTypes;
	}

	getQuerierExtensionSetup(): QueryExtensionSetup<FeemarketExtension> {
		return FeemarketModule.querierExtensionSetup;
	}

	async queryGasPrice(denom: string, context?: IContext): Promise<GasPriceResponse> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		return this.querier[defaultFeemarketExtensionKey].gasPrice(denom);
	}

	async queryGasPrices(context?: IContext): Promise<GasPricesResponse> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		return this.querier[defaultFeemarketExtensionKey].gasPrices();
	}

	async queryParams(context?: IContext): Promise<ParamsResponse> {
		if (!this.querier) this.querier = context!.sdk!.querier;

		return this.querier[defaultFeemarketExtensionKey].params();
	}

	/**
	 * Generate gas price by denom by live polling. If live poll fails, the error is bubbled up.
	 * @param denom
	 * @returns GasPrice
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
	 * Generate offline gas price by denom by static tier.
	 * @param denom
	 * @param tier
	 * @returns GasPrice
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
	 * Generate safe gas price by denom by live polling with fallback to offline gas price. If live poll fails, the error is caught and offline gas price is generated.
	 * @param denom
	 * @param tier
	 * @returns GasPrice
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
	 * Generate safe gas price by denom by live polling with exponential backoff to offline gas price.
	 * @param denom
	 * @param tier
	 * @param backoffOptions
	 * @returns GasPrice
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
}
