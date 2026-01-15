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
import { OracleExtension, OracleModule } from './modules/oracle';

/**
 * Configuration options for initializing the CheqdSDK
 */
export interface ICheqdSDKOptions {
	/** Array of modules to be loaded and registered with the SDK */
	modules: AbstractCheqdSDKModule[];
	/** Optional querier extensions to extend query functionality */
	querierExtensions?: Record<string, any>[];
	/** RPC URL of the blockchain node to connect to */
	rpcUrl: string;
	/** Network configuration (Mainnet, Testnet, etc.) */
	network?: CheqdNetwork;
	/** Gas price configuration for transactions */
	gasPrice?: GasPrice;
	/** List of method names that are authorized for execution */
	authorizedMethods?: string[];
	/** Wallet instance for signing transactions */
	readonly wallet: OfflineSigner;
}

/**
 * Default SDK modules that provide core functionality for DID, Resource, Feemarket, and Fee abstraction operations
 */
export type DefaultCheqdSDKModules = MinimalImportableDIDModule &
	MinimalImportableResourceModule &
	MinimalImportableFeemarketModule &
	MinimalImportableFeeabstractionModule;

/**
 * Main CheqdSDK class that provides a comprehensive interface for interacting with the Cheqd blockchain.
 * This class orchestrates modules for DID operations, resource management, fee market interactions,
 * and fee abstraction functionality.
 */
export interface CheqdSDK extends DefaultCheqdSDKModules {}

/**
 * Main CheqdSDK class that provides a comprehensive interface for interacting with the Cheqd blockchain.
 * This class orchestrates modules for DID operations, resource management, fee market interactions,
 * and fee abstraction functionality.
 */
export class CheqdSDK {
	/** Map of available methods from loaded modules */
	methods: IModuleMethodMap;
	/** Signing client for executing transactions on the blockchain */
	signer: CheqdSigningStargateClient;
	/** Query client with extensions for reading blockchain data */
	querier: CheqdQuerier &
		DidExtension &
		ResourceExtension &
		FeemarketExtension &
		FeeabstractionExtension &
		OracleExtension;
	/** Configuration options passed during SDK initialization */
	options: ICheqdSDKOptions;
	/** List of method names that are protected from external access */
	private protectedMethods: string[] = ['constructor', 'build', 'loadModules', 'loadRegistry'];

	/**
	 * Constructs a new CheqdSDK instance with the provided configuration options.
	 *
	 * @param options - Configuration options for the SDK including wallet, modules, and network settings
	 * @throws {Error} Throws an error if no wallet is provided in the options
	 */
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

	/**
	 * Executes a method from the loaded modules with the provided parameters.
	 * Only authorized methods can be executed through this interface.
	 *
	 * @template P - Type of parameters to pass to the method
	 * @template R - Return type of the method
	 * @param method - Name of the method to execute
	 * @param params - Parameters to pass to the method
	 * @returns Promise resolving to the method's return value
	 * @throws {Error} Throws an error if the method is not authorized
	 */
	async execute<P = any, R = any>(method: string, ...params: P[]): Promise<R> {
		if (!Object.keys(this.methods).includes(method)) {
			throw new Error(`Method ${method} is not authorized`);
		}
		return await this.methods[method](...params, { sdk: this } as IContext);
	}

	/**
	 * Loads and instantiates the provided modules, making their methods available for execution.
	 * This method also applies mixins to make module methods accessible on the SDK instance.
	 *
	 * @param modules - Array of modules to load and integrate
	 * @returns Promise resolving to the CheqdSDK instance with loaded modules
	 * @private
	 */
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

	/**
	 * Creates and configures a registry with types from all loaded modules.
	 * The registry is used for encoding and decoding blockchain messages.
	 *
	 * @returns Configured Registry instance with all module types
	 * @private
	 */
	private loadRegistry(): Registry {
		const registryTypes = this.options.modules
			.map((module: any) => instantiateCheqdSDKModuleRegistryTypes(module))
			.reduce((acc, types) => {
				return [...acc, ...types];
			});
		return createDefaultCheqdRegistry(registryTypes);
	}

	/**
	 * Establishes a connection to the blockchain querier with all necessary extensions.
	 * Extensions provide specialized query capabilities for different modules.
	 *
	 * @returns Promise resolving to a CheqdQuerier instance with all extensions
	 * @private
	 */
	private async loadQuerierExtensions(): Promise<
		CheqdQuerier & DidExtension & ResourceExtension & FeemarketExtension & FeeabstractionExtension & OracleExtension
	> {
		const querierExtensions = this.options.modules.map((module) =>
			instantiateCheqdSDKModuleQuerierExtensionSetup(module)
		);
		const querier = await CheqdQuerier.connectWithExtensions(this.options.rpcUrl, ...querierExtensions);
		return <
			CheqdQuerier &
				DidExtension &
				ResourceExtension &
				FeemarketExtension &
				FeeabstractionExtension &
				OracleExtension
		>querier;
	}

	/**
	 * Builds and initializes the complete SDK instance by loading all components:
	 * registry, querier extensions, modules, gas price configuration, and signing client.
	 * This method must be called before the SDK can be used for blockchain operations.
	 *
	 * @returns Promise resolving to the fully initialized CheqdSDK instance
	 */
	async build(): Promise<CheqdSDK> {
		const registry = this.loadRegistry();

		// ensure feemarket module is loaded, if not already
		if (!this.options.modules.find((module) => module instanceof FeemarketModule)) {
			this.options.modules.push(FeemarketModule as unknown as AbstractCheqdSDKModule);
		}

		// ensure oracle module is loaded, if not already, if testnet
		if (
			this.options.network === CheqdNetwork.Testnet &&
			!this.options.modules.find((module) => module instanceof OracleModule)
		) {
			this.options.modules.push(OracleModule as unknown as AbstractCheqdSDKModule);
		}

		this.querier = await this.loadQuerierExtensions();

		const sdk = await this.loadModules(this.options.modules);

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

/**
 * Filters methods based on authorization rules and protected method restrictions.
 * Returns only methods that are explicitly authorized (if authorization list is provided)
 * and excludes protected methods from external access.
 *
 * @param methods - Map of all available methods from modules
 * @param authorizedMethods - List of method names that are explicitly authorized
 * @param protectedMethods - List of method names that should be protected from external access
 * @returns Filtered map containing only authorized and non-protected methods
 */
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

/**
 * Factory function that creates and builds a fully initialized CheqdSDK instance.
 * This is the recommended way to create an SDK instance as it handles all initialization steps.
 *
 * @param options - Configuration options for the SDK including wallet, modules, and network settings
 * @returns Promise resolving to a fully initialized and ready-to-use CheqdSDK instance
 */
export async function createCheqdSDK(options: ICheqdSDKOptions): Promise<CheqdSDK> {
	return await new CheqdSDK(options).build();
}

export { DIDModule, ResourceModule, FeemarketModule, FeeabstractionModule, OracleModule };
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
	defaultFeeabstractionExtensionKey,
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
export {
	OracleExtension,
	MinimalImportableOracleModule,
	OracleGovProposalOptions,
	MsgAggregateExchangeRatePrevoteEncodeObject,
	MsgAggregateExchangeRateVoteEncodeObject,
	MsgDelegateFeedConsentEncodeObject,
	MsgLegacyGovUpdateParamsEncodeObject,
	MsgGovUpdateParamsEncodeObject,
	MsgGovAddDenomsEncodeObject,
	MsgGovRemoveCurrencyPairProvidersEncodeObject,
	MsgGovRemoveCurrencyDeviationThresholdsEncodeObject,
	MsgGovCancelUpdateParamPlanEncodeObject,
	defaultOracleExtensionKey,
	protobufLiterals as protobufLiteralsOracle,
	typeUrlMsgAggregateExchangeRatePrevote,
	typeUrlMsgAggregateExchangeRatePrevoteResponse,
	typeUrlMsgAggregateExchangeRateVote,
	typeUrlMsgAggregateExchangeRateVoteResponse,
	typeUrlMsgDelegateFeedConsent,
	typeUrlMsgDelegateFeedConsentResponse,
	typeUrlMsgLegacyGovUpdateParams,
	typeUrlMsgLegacyGovUpdateParamsResponse,
	typeUrlMsgGovUpdateParams,
	typeUrlMsgGovUpdateParamsResponse,
	typeUrlMsgGovAddDenoms,
	typeUrlMsgGovAddDenomsResponse,
	typeUrlMsgGovRemoveCurrencyPairProviders,
	typeUrlMsgGovRemoveCurrencyPairProvidersResponse,
	typeUrlMsgGovRemoveCurrencyDeviationThresholds,
	typeUrlMsgGovRemoveCurrencyDeviationThresholdsResponse,
	typeUrlMsgGovCancelUpdateParamPlan,
	typeUrlMsgGovCancelUpdateParamPlanResponse,
	isMsgAggregateExchangeRatePrevoteEncodeObject,
	isMsgAggregateExchangeRateVoteEncodeObject,
	isMsgDelegateFeedConsentEncodeObject,
	isMsgLegacyGovUpdateParamsEncodeObject,
	isMsgGovUpdateParamsEncodeObject,
	isMsgGovAddDenomsEncodeObject,
	isMsgGovRemoveCurrencyPairProvidersEncodeObject,
	isMsgGovRemoveCurrencyDeviationThresholdsEncodeObject,
	isMsgGovCancelUpdateParamPlanEncodeObject,
	setupOracleExtension,
} from './modules/oracle';
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
