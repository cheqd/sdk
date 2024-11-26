import {
	GasPriceResponse,
	GasPricesResponse,
	ParamsResponse,
	QueryClientImpl,
	protobufPackage,
} from '@cheqd/ts-proto/feemarket/feemarket/v1/index.js';
import { EncodeObject, GeneratedType } from '@cosmjs/proto-signing';
import { createProtobufRpcClient, QueryClient } from '@cosmjs/stargate';
import { AbstractCheqdSDKModule, MinimalImportableCheqdSDKModule } from './_.js';
import { IContext, QueryExtensionSetup } from '../types.js';
import { CheqdQuerier } from '../querier.js';
import { CheqdSigningStargateClient } from '../signer.js';

export const defaultFeemarketExtensionKey = 'feemarket' as const;

export const protobufLiterals = {
	GasPriceResponse: 'GasPriceResponse',
	GasPricesResponse: 'GasPricesResponse',
	ParamsResponse: 'ParamsResponse',
} as const;

export const typeUrlGasPriceResponse = `/${protobufPackage}.${protobufLiterals.GasPriceResponse}`;
export const typeUrlGasPricesResponse = `/${protobufPackage}.${protobufLiterals.GasPricesResponse}`;
export const typeUrlParamsResponse = `/${protobufPackage}.${protobufLiterals.ParamsResponse}`;

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

	static readonly querierExtensionSetup: QueryExtensionSetup<FeemarketExtension> = setupFeemarketExtension;

	querier: CheqdQuerier & FeemarketExtension;

	constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier & FeemarketExtension) {
		super(signer, querier);
		this.querier = querier;
		this.methods = {
			queryGasPrice: this.queryGasPrice.bind(this),
			queryGasPrices: this.queryGasPrices.bind(this),
			queryParams: this.queryParams.bind(this),
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
}
