import { OfflineSigner, Registry } from '@cosmjs/proto-signing-cjs';
import { DIDModule, MinimalImportableDIDModule, DidExtension } from './modules/did';
import { MinimalImportableResourceModule, ResourceModule, ResourceExtension } from './modules/resource';
import {
	AbstractCheqdSDKModule,
	applyMixins,
	instantiateCheqdSDKModule,
	instantiateCheqdSDKModuleRegistryTypes,
	instantiateCheqdSDKModuleQuerierExtensionSetup,
} from './modules/_';
import { createDefaultCheqdRegistry } from './registry';
import { CheqdSigningStargateClient } from './signer';
import { CheqdNetwork, IContext, IModuleMethodMap } from './types';
import { GasPrice, QueryClient } from '@cosmjs/stargate-cjs';
import { CheqdQuerier } from './querier';
import { Tendermint37Client } from '@cosmjs/tendermint-rpc-cjs';
import {
	defaultGasPriceTiers,
	FeemarketExtension,
	FeemarketModule,
	MinimalImportableFeemarketModule,
} from './modules/feemarket';
import {
	FeeabstractionExtension,
	FeeabstractionModule,
	MinimalImportableFeeabstractionModule,
} from './modules/feeabstraction';

export interface ICheqdSDKOptions {
	modules: AbstractCheqdSDKModule[];
	querierExtensions?: Record<string, any>[];
	rpcUrl: string;
	network?: CheqdNetwork;
	gasPrice?: GasPrice;
	authorizedMethods?: string[];
	readonly wallet: OfflineSigner;
}

export type DefaultCheqdSDKModules = MinimalImportableDIDModule &
	MinimalImportableResourceModule &
	MinimalImportableFeemarketModule &
	MinimalImportableFeeabstractionModule;

export interface CheqdSDK extends DefaultCheqdSDKModules {}

export class CheqdSDK {
	methods: IModuleMethodMap;
	signer: CheqdSigningStargateClient;
	querier: CheqdQuerier & DidExtension & ResourceExtension & FeemarketExtension & FeeabstractionExtension;
	options: ICheqdSDKOptions;
	private protectedMethods: string[] = ['constructor', 'build', 'loadModules', 'loadRegistry'];

	constructor(options: ICheqdSDKOptions) {
		if (!options?.wallet) {
			throw new Error('No wallet provided');
		}

		this.options = {
			authorizedMethods: [],
			network: CheqdNetwork.Testnet,
			...options,
		};

		this.methods = {};
		this.signer = new CheqdSigningStargateClient(undefined, this.options.wallet, {});
		this.querier = <any>new QueryClient({} as unknown as Tendermint37Client);
	}

	async execute<P = any, R = any>(method: string, ...params: P[]): Promise<R> {
		if (!Object.keys(this.methods).includes(method)) {
			throw new Error(`Method ${method} is not authorized`);
		}
		return await this.methods[method](...params, { sdk: this } as IContext);
	}

	private async loadModules(modules: AbstractCheqdSDKModule[]): Promise<CheqdSDK> {
		this.options.modules = this.options.modules.map(
			(module: any) =>
				instantiateCheqdSDKModule(module, this.signer, this.querier, {
					sdk: this,
				} as IContext) as unknown as AbstractCheqdSDKModule
		);

		const methods = applyMixins(this, modules);
		this.methods = {
			...this.methods,
			...filterUnauthorizedMethods(methods, this.options.authorizedMethods || [], this.protectedMethods),
		};

		for (const method of Object.keys(this.methods)) {
			// @ts-ignore
			this[method] = async (...params: any[]) => {
				return await this.execute(method, ...params);
			};
		}

		return this;
	}

	private loadRegistry(): Registry {
		const registryTypes = this.options.modules
			.map((module: any) => instantiateCheqdSDKModuleRegistryTypes(module))
			.reduce((acc, types) => {
				return [...acc, ...types];
			});
		return createDefaultCheqdRegistry(registryTypes);
	}

	private async loadQuerierExtensions(): Promise<
		CheqdQuerier & DidExtension & ResourceExtension & FeemarketExtension & FeeabstractionExtension
	> {
		const querierExtensions = this.options.modules.map((module) =>
			instantiateCheqdSDKModuleQuerierExtensionSetup(module)
		);
		const querier = await CheqdQuerier.connectWithExtensions(this.options.rpcUrl, ...querierExtensions);
		return <CheqdQuerier & DidExtension & ResourceExtension & FeemarketExtension & FeeabstractionExtension>querier;
	}

	async build(): Promise<CheqdSDK> {
		const registry = this.loadRegistry();

		this.querier = await this.loadQuerierExtensions();

		const sdk = await this.loadModules(this.options.modules);

		// ensure feemarket module is loaded, if not already
		if (!this.options.modules.find((module) => module instanceof FeemarketModule)) {
			this.options.modules.push(FeemarketModule as unknown as AbstractCheqdSDKModule);
		}

		// define gas price
		this.options.gasPrice =
			this.options.gasPrice ||
			(await this.generateSafeGasPriceWithExponentialBackoff(
				DIDModule.baseMinimalDenom,
				defaultGasPriceTiers.Low,
				undefined,
				{ sdk }
			));

		this.signer = await CheqdSigningStargateClient.connectWithSigner(this.options.rpcUrl, this.options.wallet, {
			registry,
			gasPrice: this.options.gasPrice,
		});

		return sdk;
	}
}

export function filterUnauthorizedMethods(
	methods: IModuleMethodMap,
	authorizedMethods: string[],
	protectedMethods: string[]
): IModuleMethodMap {
	let _methods = Object.keys(methods);
	if (authorizedMethods.length === 0)
		return _methods
			.filter((method) => !protectedMethods.includes(method))
			.reduce((acc, method) => ({ ...acc, [method]: methods[method] }), {});

	return _methods
		.filter((method) => authorizedMethods.includes(method) && !protectedMethods.includes(method))
		.reduce((acc, method) => ({ ...acc, [method]: methods[method] }), {});
}

export async function createCheqdSDK(options: ICheqdSDKOptions): Promise<CheqdSDK> {
	return await new CheqdSDK(options).build();
}

export { DIDModule, ResourceModule, FeemarketModule, FeeabstractionModule };
export { AbstractCheqdSDKModule, applyMixins } from './modules/_';
export {
	DidExtension,
	MinimalImportableDIDModule,
	MsgCreateDidDocEncodeObject,
	MsgCreateDidDocResponseEncodeObject,
	MsgUpdateDidDocEncodeObject,
	MsgUpdateDidDocResponseEncodeObject,
	MsgDeactivateDidDocEncodeObject,
	MsgDeactivateDidDocResponseEncodeObject,
	contexts,
	defaultDidExtensionKey,
	protobufLiterals as protobufLiteralsDid,
	typeUrlMsgCreateDidDoc,
	typeUrlMsgCreateDidDocResponse,
	typeUrlMsgUpdateDidDoc,
	typeUrlMsgUpdateDidDocResponse,
	typeUrlMsgDeactivateDidDoc,
	typeUrlMsgDeactivateDidDocResponse,
	setupDidExtension,
	isMsgCreateDidDocEncodeObject,
	isMsgUpdateDidDocEncodeObject,
	isMsgDeactivateDidDocEncodeObject,
} from './modules/did';
export {
	ResourceExtension,
	MinimalImportableResourceModule,
	defaultResourceExtensionKey,
	protobufLiterals as protobufLiteralsResource,
	typeUrlMsgCreateResource,
	typeUrlMsgCreateResourceResponse,
	setupResourceExtension,
	isMsgCreateResourceEncodeObject,
} from './modules/resource';
export {
	FeemarketExtension,
	MinimalImportableFeemarketModule,
	DefaultGasPriceTiers,
	defaultFeemarketExtensionKey,
	defaultGasPriceTiers,
	protobufLiterals as protobufLiteralsFeemarket,
	typeUrlGasPriceResponse,
	typeUrlGasPricesResponse,
	typeUrlParamsResponse,
	setupFeemarketExtension,
	isGasPriceEncodeObject,
	isGasPricesEncodeObject,
	isParamsEncodeObject,
} from './modules/feemarket';
export {
	FeeabstractionExtension,
	MinimalImportableFeeabstractionModule,
	defaultExtensionKey,
	protobufLiterals as protobufLiteralsFeeabstraction,
	typeUrlMsgAddHostZone,
	typeUrlMsgAddHostZoneResponse,
	typeUrlMsgFundFeeAbsModuleAccount,
	typeUrlMsgFundFeeAbsModuleAccountResponse,
	typeUrlMsgRemoveHostZone,
	typeUrlMsgRemoveHostZoneResponse,
	typeUrlMsgUpdateHostZone,
	typeUrlMsgUpdateHostZoneResponse,
	typeUrlMsgSendQueryIbcDenomTWAP,
	typeUrlMsgSendQueryIbcDenomTWAPResponse,
	typeUrlMsgSwapCrossChain,
	typeUrlMsgSwapCrossChainResponse,
	typeUrlMsgUpdateParams,
	typeUrlMsgUpdateParamsResponse,
	setupFeeabstractionExtension,
	isMsgAddHostZoneEncodeObject,
	isMsgAddHostZoneResponseEncodeObject,
	isMsgFundFeeAbsModuleAccountEncodeObject,
	isMsgFundFeeAbsModuleAccountResponseEncodeObject,
	isMsgRemoveHostZoneEncodeObject,
	isMsgRemoveHostZoneResponseEncodeObject,
	isMsgUpdateHostZoneEncodeObject,
	isMsgUpdateHostZoneResponseEncodeObject,
	isMsgSendQueryIbcDenomTWAPEncodeObject,
	isMsgSendQueryIbcDenomTWAPResponseEncodeObject,
	isMsgSwapCrossChainEncodeObject,
	isMsgSwapCrossChainResponseEncodeObject,
	isMsgUpdateParamsEncodeObject,
	isMsgUpdateParamsResponseEncodeObject,
} from './modules/feeabstraction';
export * from './signer';
export * from './querier';
export * from './registry';
export * from './types';
export {
	TImportableEd25519Key,
	createKeyPairRaw,
	createKeyPairBase64,
	createKeyPairHex,
	createVerificationKeys,
	createDidVerificationMethod,
	createDidPayload,
	createSignInputsFromImportableEd25519Key,
	validateSpecCompliantPayload,
	isEqualKeyValuePair,
	createCosmosPayerWallet,
	getCosmosAccount,
	checkBalance,
	toMultibaseRaw,
} from './utils';
