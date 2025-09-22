import {
	EncodeObject,
	isOfflineDirectSigner,
	OfflineSigner,
	encodePubkey,
	TxBodyEncodeObject,
	makeSignDoc,
} from '@cosmjs/proto-signing-cjs';
import {
	DeliverTxResponse,
	GasPrice,
	HttpEndpoint,
	SigningStargateClient,
	SigningStargateClientOptions,
	calculateFee,
	SignerData,
	createProtobufRpcClient,
	TimeoutError,
	BroadcastTxError,
} from '@cosmjs/stargate-cjs';
import { Tendermint37Client } from '@cosmjs/tendermint-rpc-cjs';
import { createDefaultCheqdRegistry } from './registry';
import {
	MsgCreateDidDocPayload,
	SignInfo,
	MsgUpdateDidDocPayload,
	MsgDeactivateDidDocPayload,
	VerificationMethod,
	DidDoc,
} from '@cheqd/ts-proto-cjs/cheqd/did/v2';
import {
	DIDDocument,
	DidStdFee,
	ISignInputs,
	MessageBatch,
	TSignerAlgo,
	TxExtension,
	VerificationMethods,
} from './types';
import { base64ToBytes, EdDSASigner, hexToBytes, Signer, ES256Signer, ES256KSigner } from 'did-jwt-cjs';
import { assert, assertDefined, sleep } from '@cosmjs/utils-cjs';
import { encodeSecp256k1Pubkey, Pubkey } from '@cosmjs/amino-cjs';
import { Int53 } from '@cosmjs/math-cjs';
import { fromBase64, toHex } from '@cosmjs/encoding-cjs';
import { AuthInfo, SignerInfo, TxRaw } from 'cosmjs-types-cjs/cosmos/tx/v1beta1/tx';
import { SignMode } from 'cosmjs-types-cjs/cosmos/tx/signing/v1beta1/signing';
import { Any } from 'cosmjs-types-cjs/google/protobuf/any';
import { Coin } from 'cosmjs-types-cjs/cosmos/base/v1beta1/coin';
import Long from 'long-cjs';
import { CheqdQuerier } from './querier';
import { Uint53 } from '@cosmjs/math-cjs';
import {
	GetTxResponse,
	ServiceClientImpl,
	SimulateRequest,
	SimulateResponse,
} from 'cosmjs-types-cjs/cosmos/tx/v1beta1/service';
import { Tx, TxBody, Fee } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';

/**
 * Calculates the transaction fee for DID operations using gas limit and gas price.
 *
 * @param gasLimit - Maximum amount of gas units that can be consumed by the transaction
 * @param gasPrice - Price per gas unit, either as a string or GasPrice object
 * @returns DidStdFee object containing the calculated fee structure
 */
export function calculateDidFee(gasLimit: number, gasPrice: string | GasPrice): DidStdFee {
	return calculateFee(gasLimit, gasPrice);
}

/**
 * Creates SignerInfo objects for transaction authentication from signer data.
 * Each signer info contains the public key, sequence number, and signing mode.
 *
 * @param signers - Array of signer objects containing public keys and sequence numbers
 * @param signMode - Signing mode to use (e.g., SIGN_MODE_DIRECT)
 * @returns Array of SignerInfo objects for transaction authentication
 */
export function makeSignerInfos(
	signers: ReadonlyArray<{ readonly pubkey: Any; readonly sequence: number }>,
	signMode: SignMode
): SignerInfo[] {
	return signers.map(
		({ pubkey, sequence }): SignerInfo => ({
			publicKey: pubkey,
			modeInfo: {
				single: { mode: signMode },
			},
			sequence: Long.fromNumber(sequence),
		})
	);
}

/**
 * Creates encoded AuthInfo bytes for DID transactions with fee payer support.
 * The AuthInfo contains signer information, fee details, and gas limit.
 *
 * @param signers - Array of signer objects with public keys and sequence numbers
 * @param feeAmount - Array of coins representing the transaction fee
 * @param gasLimit - Maximum gas units that can be consumed
 * @param feePayer - Address of the account paying the transaction fees
 * @param signMode - Signing mode to use, defaults to SIGN_MODE_DIRECT
 * @returns Encoded AuthInfo as Uint8Array for transaction construction
 */
export function makeDidAuthInfoBytes(
	signers: ReadonlyArray<{ readonly pubkey: Any; readonly sequence: number }>,
	feeAmount: readonly Coin[],
	gasLimit: number,
	feePayer: string,
	signMode = SignMode.SIGN_MODE_DIRECT
): Uint8Array {
	const authInfo = {
		signerInfos: makeSignerInfos(signers, signMode),
		fee: {
			amount: [...feeAmount],
			gasLimit: Long.fromNumber(gasLimit),
			payer: feePayer,
		},
	};
	return AuthInfo.encode(AuthInfo.fromPartial(authInfo)).finish();
}

/**
 * Extended SigningStargateClient specifically designed for Cheqd blockchain operations.
 * Provides enhanced transaction signing, broadcasting, and DID-specific functionality
 * with support for custom fee payers and advanced retry mechanisms.
 */
export class CheqdSigningStargateClient extends SigningStargateClient {
	/** Map of DID signing algorithms for different verification method types */
	private didSigners: TSignerAlgo = {};
	/** Gas price configuration for transaction fee calculation */
	private readonly _gasPrice: GasPrice | undefined;
	/** Offline signer instance for transaction signing */
	private readonly _signer: OfflineSigner;
	/** RPC endpoint URL for blockchain communication */
	private readonly endpoint?: string;
	/** Maximum gas limit allowed for transactions */
	static readonly maxGasLimit = Number.MAX_SAFE_INTEGER;

	/**
	 * Creates a new CheqdSigningStargateClient by establishing a connection to the specified endpoint.
	 * This is the primary factory method for creating a signing client instance.
	 *
	 * @param endpoint - RPC endpoint URL or HttpEndpoint object to connect to
	 * @param signer - Offline signer for transaction signing
	 * @param options - Additional client configuration options including registry and gas price
	 * @returns Promise resolving to a connected CheqdSigningStargateClient instance
	 */
	public static async connectWithSigner(
		endpoint: string | HttpEndpoint,
		signer: OfflineSigner,
		options?: (SigningStargateClientOptions & { endpoint?: string }) | undefined
	): Promise<CheqdSigningStargateClient> {
		const cometClient = await Tendermint37Client.connect(endpoint);
		return new CheqdSigningStargateClient(cometClient, signer, {
			registry: options?.registry ? options.registry : createDefaultCheqdRegistry(),
			endpoint: options?.endpoint
				? typeof options.endpoint === 'string'
					? options.endpoint
					: (options.endpoint as HttpEndpoint).url
				: undefined,
			...options,
		});
	}

	/**
	 * Constructs a new CheqdSigningStargateClient instance with the provided Comet client and signer.
	 *
	 * @param cometClient - Tendermint client for blockchain communication
	 * @param signer - Offline signer for transaction signing
	 * @param options - Additional configuration options including registry, gas price, and endpoint
	 */
	constructor(
		cometClient: Tendermint37Client | undefined,
		signer: OfflineSigner,
		options: SigningStargateClientOptions & { endpoint?: string } = {}
	) {
		super(cometClient, signer, options);
		this._signer = signer;
		this._gasPrice = options.gasPrice;
		this.endpoint = options.endpoint;
	}

	/**
	 * Signs and broadcasts a transaction to the blockchain network.
	 * Supports automatic fee calculation and custom fee payer functionality.
	 *
	 * @param signerAddress - Address of the account signing the transaction
	 * @param messages - Array of messages to include in the transaction
	 * @param fee - Fee configuration: 'auto' for automatic calculation, number for multiplier, or DidStdFee object
	 * @param memo - Optional transaction memo string
	 * @returns Promise resolving to DeliverTxResponse with transaction results
	 * @throws Error if gas price is not set when using automatic fee calculation
	 */
	async signAndBroadcast(
		signerAddress: string,
		messages: readonly EncodeObject[],
		fee: DidStdFee | 'auto' | number,
		memo = ''
	): Promise<DeliverTxResponse> {
		let usedFee: DidStdFee;
		if (fee == 'auto' || typeof fee === 'number') {
			assertDefined(this._gasPrice, 'Gas price must be set in the client options when auto gas is used.');
			const gasEstimation = await this.simulate(signerAddress, messages, memo);
			const multiplier = typeof fee === 'number' ? fee : 1.3;
			usedFee = calculateDidFee(Math.round(gasEstimation * multiplier), this._gasPrice);
			usedFee.payer = signerAddress;
		} else {
			usedFee = fee;
			assertDefined(usedFee.payer, 'Payer address must be set when fee is not auto.');
			signerAddress = usedFee.payer!;
		}
		const txRaw = await this.sign(signerAddress, messages, usedFee, memo);
		const txBytes = TxRaw.encode(txRaw).finish();
		return this.broadcastTx(txBytes, this.broadcastTimeoutMs, this.broadcastPollIntervalMs);
	}

	/**
	 * Signs a transaction without broadcasting it to the network.
	 * Creates a signed transaction that can be broadcast later.
	 *
	 * @param signerAddress - Address of the account signing the transaction
	 * @param messages - Array of messages to include in the transaction
	 * @param fee - Fee configuration for the transaction
	 * @param memo - Transaction memo string
	 * @param explicitSignerData - Optional explicit signer data to avoid querying the chain
	 * @returns Promise resolving to TxRaw containing the signed transaction
	 */
	public async sign(
		signerAddress: string,
		messages: readonly EncodeObject[],
		fee: DidStdFee,
		memo: string,
		explicitSignerData?: SignerData
	): Promise<TxRaw> {
		let signerData: SignerData;
		if (explicitSignerData) {
			signerData = explicitSignerData;
		} else {
			const { accountNumber, sequence } = await this.getSequence(signerAddress);
			const chainId = await this.getChainId();
			signerData = {
				accountNumber: accountNumber,
				sequence: sequence,
				chainId: chainId,
			};
		}

		return this._signDirect(signerAddress, messages, fee, memo, signerData);
	}

	/**
	 * Internal method for direct signing of transactions using SIGN_MODE_DIRECT.
	 * Handles the low-level transaction construction and signing process.
	 *
	 * @param signerAddress - Address of the account signing the transaction
	 * @param messages - Array of messages to include in the transaction
	 * @param fee - Fee configuration for the transaction
	 * @param memo - Transaction memo string
	 * @param signerData - Account data including number, sequence, and chain ID
	 * @returns Promise resolving to TxRaw containing the signed transaction
	 * @private
	 */
	private async _signDirect(
		signerAddress: string,
		messages: readonly EncodeObject[],
		fee: DidStdFee,
		memo: string,
		{ accountNumber, sequence, chainId }: SignerData
	): Promise<TxRaw> {
		assert(isOfflineDirectSigner(this._signer));
		const accountFromSigner = (await this._signer.getAccounts()).find(
			(account) => account.address === signerAddress
		);
		if (!accountFromSigner) {
			throw new Error('Failed to retrieve account from signer');
		}
		const pubkey = encodePubkey(encodeSecp256k1Pubkey(accountFromSigner.pubkey));
		const txBodyEncodeObject: TxBodyEncodeObject = {
			typeUrl: '/cosmos.tx.v1beta1.TxBody',
			value: {
				messages: messages,
				memo: memo,
			},
		};
		const txBodyBytes = this.registry.encode(txBodyEncodeObject);
		const gasLimit = Int53.fromString(fee.gas).toNumber();
		const authInfoBytes = makeDidAuthInfoBytes([{ pubkey, sequence }], fee.amount, gasLimit, fee.payer!);
		const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
		const { signature, signed } = await this._signer.signDirect(signerAddress, signDoc);
		return TxRaw.fromPartial({
			bodyBytes: signed.bodyBytes,
			authInfoBytes: signed.authInfoBytes,
			signatures: [fromBase64(signature.signature)],
		});
	}

	/**
	 * Broadcasts a signed transaction to the network and monitors its inclusion in a block,
	 * with support for retrying on failure and graceful timeout handling.
	 *
	 * ## Optimizations over base implementation:
	 * - Implements a retry policy (`maxRetries`, default: 3) to handle transient broadcast errors.
	 * - Prevents double spend by reusing the exact same signed transaction (immutable `Uint8Array`).
	 * - Tracks and returns the last known transaction hash (`txId`), even in the case of timeout or failure.
	 * - Throws a `TimeoutError` if the transaction is not found within `timeoutMs`, attaching the `txHash` if known.
	 * - Polling frequency and timeout are customizable via `pollIntervalMs` and `timeoutMs` parameters.
	 *
	 * @param tx - The signed transaction bytes to broadcast.
	 * @param timeoutMs - Maximum duration (in milliseconds) to wait for block inclusion. Defaults to 60,000 ms.
	 * @param pollIntervalMs - Polling interval (in milliseconds) when checking for transaction inclusion. Defaults to 3,000 ms.
	 * @param maxRetries - Maximum number of times to retry `broadcastTxSync` on failure. Defaults to 3.
	 *
	 * @returns A `Promise` that resolves to `DeliverTxResponse` upon successful inclusion in a block.
	 * @throws `BroadcastTxError` if the transaction is rejected by the node during CheckTx.
	 * @throws `TimeoutError` if the transaction is not found on-chain within the timeout window. Includes `txHash` if available.
	 */

	public async broadcastTx(
		tx: Uint8Array,
		timeoutMs = 60_000,
		pollIntervalMs = 3_000,
		maxRetries = 3
	): Promise<DeliverTxResponse> {
		// define polling callback
		const pollForTx = async (txId: string, startTime: number): Promise<DeliverTxResponse> => {
			// define immutable timeout
			const timedOut = Date.now() - startTime > timeoutMs;

			// check if timed out
			if (timedOut) {
				// if so, throw timeout error with txId (or transaction hash)
				throw new TimeoutError(
					`Transaction with ID ${txId} was submitted but was not yet found on the chain. Waited ${
						timeoutMs / 1000
					} seconds.`,
					txId
				);
			}

			// otherwise, poll for tx
			await sleep(pollIntervalMs);

			// query for tx
			const result = await this.getTx(txId);

			// return result if found, otherwise poll again
			return result
				? {
						code: result.code,
						height: result.height,
						txIndex: result.txIndex,
						events: result.events,
						rawLog: result.rawLog,
						transactionHash: txId,
						gasUsed: result.gasUsed,
						gasWanted: result.gasWanted,
					}
				: pollForTx(txId, startTime);
		};

		// define immutable array of errors
		const errors: unknown[] = [];

		// define last known transaction hash
		let lastKnownTxHash: string | undefined;

		// attempt to broadcast tx until maxRetries or tx is found
		for (const attempt of Array.from({ length: maxRetries }, (_, i) => i + 1)) {
			try {
				// broadcast tx
				const txId = await this.broadcastTxSync(tx);

				// set last known transaction hash
				lastKnownTxHash = txId;

				// recompute start time
				const startTime = Date.now();

				// poll for tx
				const result = await pollForTx(txId, startTime);

				// if successful, return result
				return result;
			} catch (error) {
				// if error, push to errors array
				errors.push(error);

				// define last error
				const lastError = error as Error & { txHash?: string };

				// if error is not a TimeoutError, throw it
				if (lastError.name !== 'TimeoutError') throw lastError;

				// define whether final attempt
				const isFinalAttempt = attempt === maxRetries;

				// define enriched error, attaching last known transaction hash
				const enrichedError =
					isFinalAttempt && lastKnownTxHash && lastError.name === 'TimeoutError'
						? new TimeoutError(
								`Transaction broadcast failed after ${maxRetries} attempts. Transaction hash: ${lastKnownTxHash}`,
								lastKnownTxHash
							)
						: lastError;

				// if final attempt and error does not have txHash, throw the last error
				if (isFinalAttempt) throw lastError;

				// otherwise, brief backoff before retrying
				await sleep(1000);
			}
		}

		// should not reach here
		throw new TimeoutError(
			`Broadcast failed unexpectedly. Last known transaction hash: ${lastKnownTxHash ?? 'unknown'}`,
			lastKnownTxHash || 'unknown'
		);
	}

	/**
	 * Broadcasts a signed transaction to the network without monitoring it.
	 * Returns the transaction hash immediately after broadcast submission.
	 *
	 * If broadcasting is rejected by the node for some reason (e.g. because of a CheckTx failure),
	 * an error is thrown.
	 *
	 * If the transaction is broadcasted, a `string` containing the hash of the transaction is returned. The caller then
	 * usually needs to check if the transaction was included in a block and was successful.
	 *
	 * @param tx - Signed transaction bytes to broadcast
	 * @returns Promise resolving to the hash of the transaction
	 * @throws BroadcastTxError if the transaction is rejected during CheckTx
	 */
	public async broadcastTxSync(tx: Uint8Array): Promise<string> {
		const broadcasted = await this.forceGetTmClient().broadcastTxSync({ tx });

		if (broadcasted.code) {
			return Promise.reject(new BroadcastTxError(broadcasted.code, broadcasted.codespace ?? '', broadcasted.log));
		}

		const transactionId = toHex(broadcasted.hash).toUpperCase();

		return transactionId;
	}

	/**
	 * Simulates transaction execution to estimate gas usage.
	 * Uses the configured endpoint to query the blockchain for gas estimation.
	 *
	 * @param signerAddress - Address of the account that would sign the transaction
	 * @param messages - Array of messages to simulate
	 * @param memo - Transaction memo string
	 * @returns Promise resolving to the estimated gas units required
	 * @throws Error if endpoint is not configured
	 */
	async simulate(
		signerAddress: string,
		messages: readonly EncodeObject[],
		memo: string | undefined
	): Promise<number> {
		if (!this.endpoint) {
			throw new Error('querier: endpoint is not set');
		}
		const querier = await CheqdQuerier.connect(this.endpoint);
		const anyMsgs = messages.map((msg) => this.registry.encodeAsAny(msg));
		const accountFromSigner = (await this._signer.getAccounts()).find(
			(account) => account.address === signerAddress
		);
		if (!accountFromSigner) {
			throw new Error('Failed to retrieve account from signer');
		}
		const pubkey = encodeSecp256k1Pubkey(accountFromSigner.pubkey);
		const { sequence } = await this.getSequence(signerAddress);
		const gasLimit = this.endpoint!.includes('localhost')
			? CheqdSigningStargateClient.maxGasLimit
			: (await CheqdQuerier.getConsensusParameters(this.endpoint!))!.block.maxGas;
		const { gasInfo } = await (
			await this.constructSimulateExtension(querier)
		).tx.simulate(anyMsgs, memo, pubkey, signerAddress, sequence, gasLimit);
		assertDefined(gasInfo);
		return Uint53.fromString(gasInfo.gasUsed.toString()).toNumber();
	}

	/**
	 * Constructs a transaction extension object for simulation and query operations.
	 * Provides methods for transaction simulation and retrieval.
	 *
	 * @param querier - CheqdQuerier instance for blockchain communication
	 * @returns Promise resolving to TxExtension with simulation and query capabilities
	 */
	async constructSimulateExtension(querier: CheqdQuerier): Promise<TxExtension> {
		// setup rpc client
		const rpc = createProtobufRpcClient(querier);

		// setup query tx query service
		const queryService = new ServiceClientImpl(rpc);

		// setup + return tx extension
		return {
			tx: {
				getTx: async (txId: string): Promise<GetTxResponse> => {
					// construct request
					const request = { hash: txId };

					// query + return tx
					return await queryService.GetTx(request);
				},
				simulate: async (
					messages: readonly Any[],
					memo: string | undefined,
					signer: Pubkey,
					signerAddress: string,
					sequence: number,
					gasLimit: number
				): Promise<SimulateResponse> => {
					// encode public key
					const publicKey = encodePubkey(signer);

					// construct max gas limit
					const maxGasLimit = Int53.fromString(gasLimit.toString()).toNumber();

					// construct unsigned tx
					const tx = Tx.fromPartial({
						body: TxBody.fromPartial({
							messages: Array.from(messages),
							memo,
						}),
						authInfo: AuthInfo.fromPartial({
							fee: Fee.fromPartial({
								amount: [],
								gasLimit: maxGasLimit,
								payer: signerAddress,
							}),
							signerInfos: [
								{
									publicKey,
									modeInfo: {
										single: { mode: SignMode.SIGN_MODE_DIRECT },
									},
									sequence: sequence,
								},
							],
						}),
						signatures: [new Uint8Array()],
					});

					// construct request
					const request = SimulateRequest.fromPartial({
						txBytes: Tx.encode(tx).finish(),
					});

					// query + return simulation response
					return await queryService.Simulate(request);
				},
			},
		};
	}

	/**
	 * Batches multiple messages into optimal groups based on gas limits.
	 * Simulates each message individually and groups them to maximize throughput
	 * while staying within gas constraints.
	 *
	 * @param messages - Array of messages to batch
	 * @param signerAddress - Address of the account that will sign the transactions
	 * @param memo - Optional transaction memo
	 * @param maxGasLimit - Maximum gas limit per batch, defaults to 30,000,000
	 * @returns Promise resolving to MessageBatch with grouped messages and gas estimates
	 */
	async batchMessages(
		messages: readonly EncodeObject[],
		signerAddress: string,
		memo?: string,
		maxGasLimit: number = 30000000 // default gas limit, use consensus params if available
	): Promise<MessageBatch> {
		// simulate
		const gasEstimates = await Promise.all(
			messages.map(async (message) => this.simulate(signerAddress, [message], memo))
		);

		// batch messages
		const { batches, gasPerBatch, currentBatch, currentBatchGas } = gasEstimates.reduce(
			(acc, gasUsed, index) => {
				// finalise current batch, if limit is surpassed
				if (acc.currentBatchGas + gasUsed > maxGasLimit) {
					return {
						batches: [...acc.batches, acc.currentBatch],
						gasPerBatch: [...acc.gasPerBatch, acc.currentBatchGas],
						currentBatch: [messages[index]],
						currentBatchGas: gasUsed,
					};
				}

				// otherwise, add to current batch
				return {
					batches: acc.batches,
					gasPerBatch: acc.gasPerBatch,
					currentBatch: [...acc.currentBatch, messages[index]],
					currentBatchGas: acc.currentBatchGas + gasUsed,
				};
			},
			{
				batches: [] as EncodeObject[][],
				gasPerBatch: [] as number[],
				currentBatch: [] as EncodeObject[],
				currentBatchGas: 0,
			}
		);

		// push final batch to batches, if not empty + return
		return currentBatch.length > 0
			? {
					batches: [...batches, currentBatch],
					gas: [...gasPerBatch, currentBatchGas],
				}
			: {
					batches,
					gas: gasPerBatch,
				};
	}

	/**
	 * Validates and initializes DID signers for the provided verification methods.
	 * Ensures that all verification method types are supported and assigns appropriate signers.
	 *
	 * @param verificationMethods - Array of verification methods to validate
	 * @returns Promise resolving to the configured signer algorithm map
	 * @throws Error if no verification methods are provided or unsupported types are found
	 */
	async checkDidSigners(verificationMethods: Partial<VerificationMethod>[] = []): Promise<TSignerAlgo> {
		if (verificationMethods.length === 0) {
			throw new Error('No verification methods provided');
		}

		verificationMethods.forEach((verificationMethod) => {
			if (
				!(Object.values(VerificationMethods) as string[]).includes(
					verificationMethod.verificationMethodType ?? ''
				)
			) {
				throw new Error(`Unsupported verification method type: ${verificationMethod.verificationMethodType}`);
			}
			if (!this.didSigners[verificationMethod.verificationMethodType ?? '']) {
				this.didSigners[verificationMethod.verificationMethodType ?? ''] = EdDSASigner;
			}
		});

		return this.didSigners;
	}

	/**
	 * Retrieves the appropriate DID signer for a specific verification method.
	 * Looks up the verification method by ID and returns the corresponding signer function.
	 *
	 * @param verificationMethodId - ID of the verification method to get signer for
	 * @param verificationMethods - Array of available verification methods
	 * @returns Promise resolving to a signer function that takes a secret key
	 * @throws Error if the verification method is not found
	 */
	async getDidSigner(
		verificationMethodId: string,
		verificationMethods: Partial<VerificationMethod>[]
	): Promise<(secretKey: Uint8Array) => Signer> {
		await this.checkDidSigners(verificationMethods);
		const verificationMethod = verificationMethods.find(
			(method) => method.id === verificationMethodId
		)?.verificationMethodType;
		if (!verificationMethod) {
			throw new Error(`Verification method for ${verificationMethodId} not found`);
		}
		return this.didSigners[verificationMethod]!;
	}

	/**
	 * Signs a CreateDidDoc transaction payload using the provided signing inputs.
	 * Validates verification methods and creates signatures for each signing input.
	 *
	 * @param signInputs - Array of signing inputs containing verification method IDs and private keys
	 * @param payload - CreateDidDoc payload to sign
	 * @returns Promise resolving to array of SignInfo objects with signatures
	 */
	async signCreateDidDocTx(signInputs: ISignInputs[], payload: MsgCreateDidDocPayload): Promise<SignInfo[]> {
		await this.checkDidSigners(payload?.verificationMethod);

		const signBytes = MsgCreateDidDocPayload.encode(payload).finish();
		const signInfos: SignInfo[] = await Promise.all(
			signInputs.map(async (signInput) => {
				return {
					verificationMethodId: signInput.verificationMethodId,
					signature: base64ToBytes(
						(await (
							await this.getDidSigner(signInput.verificationMethodId, payload.verificationMethod)
						)(hexToBytes(signInput.privateKeyHex))(signBytes)) as string
					),
				};
			})
		);

		return signInfos;
	}

	/**
	 * Signs an UpdateDidDoc transaction payload using the provided signing inputs.
	 * Handles complex verification method resolution including external controllers
	 * and previous DID document verification methods.
	 *
	 * @param signInputs - Array of signing inputs containing verification method IDs and private keys
	 * @param payload - UpdateDidDoc payload to sign
	 * @param externalControllers - Optional external controller DID documents
	 * @param previousDidDocument - Optional previous version of the DID document
	 * @returns Promise resolving to array of SignInfo objects with signatures
	 */
	async signUpdateDidDocTx(
		signInputs: ISignInputs[],
		payload: MsgUpdateDidDocPayload,
		externalControllers?: DIDDocument[],
		previousDidDocument?: DIDDocument
	): Promise<SignInfo[]> {
		await this.checkDidSigners(payload?.verificationMethod);

		const signBytes = MsgUpdateDidDocPayload.encode(payload).finish();
		const signInfos: SignInfo[] = await Promise.all(
			signInputs.map(async (signInput) => {
				return {
					verificationMethodId: signInput.verificationMethodId,
					signature: base64ToBytes(
						(await (
							await this.getDidSigner(
								signInput.verificationMethodId,
								payload.verificationMethod
									.concat(
										externalControllers
											?.flatMap((controller) => controller.verificationMethod)
											.map((vm) => {
												return {
													id: vm!.id,
													verificationMethodType: vm!.type,
													controller: vm!.controller,
													verificationMaterial: '<ignored>',
												} satisfies VerificationMethod;
											}) ?? []
									)
									.concat(
										previousDidDocument?.verificationMethod?.map((vm) => {
											return {
												id: vm.id,
												verificationMethodType: vm.type,
												controller: vm.controller,
												verificationMaterial: '<ignored>',
											} satisfies VerificationMethod;
										}) ?? []
									)
							)
						)(hexToBytes(signInput.privateKeyHex))(signBytes)) as string
					),
				};
			})
		);

		return signInfos;
	}

	/**
	 * Signs a DeactivateDidDoc transaction payload using the provided signing inputs.
	 * Validates verification methods and creates signatures for DID deactivation.
	 *
	 * @param signInputs - Array of signing inputs containing verification method IDs and private keys
	 * @param payload - DeactivateDidDoc payload to sign
	 * @param verificationMethod - Array of verification methods for signature validation
	 * @returns Promise resolving to array of SignInfo objects with signatures
	 */
	async signDeactivateDidDocTx(
		signInputs: ISignInputs[],
		payload: MsgDeactivateDidDocPayload,
		verificationMethod: VerificationMethod[]
	): Promise<SignInfo[]> {
		await this.checkDidSigners(verificationMethod);

		const signBytes = MsgDeactivateDidDocPayload.encode(payload).finish();
		const signInfos: SignInfo[] = await Promise.all(
			signInputs.map(async (signInput) => {
				return {
					verificationMethodId: signInput.verificationMethodId,
					signature: base64ToBytes(
						(await (
							await this.getDidSigner(signInput.verificationMethodId, verificationMethod)
						)(hexToBytes(signInput.privateKeyHex))(signBytes)) as string
					),
				};
			})
		);

		return signInfos;
	}

	/**
	 * Static method for signing identity transactions with multiple key types.
	 * Supports Ed25519, Secp256k1, and P256 signature algorithms.
	 *
	 * @param signBytes - Raw bytes to sign
	 * @param signInputs - Array of signing inputs with key types and private keys
	 * @returns Promise resolving to array of SignInfo objects with signatures
	 * @throws Error if key type is undefined or unsupported
	 */
	static async signIdentityTx(signBytes: Uint8Array, signInputs: ISignInputs[]): Promise<SignInfo[]> {
		let signInfos: SignInfo[] = [];

		for (let signInput of signInputs) {
			if (typeof signInput.keyType === undefined) {
				throw new Error('Key type is not defined');
			}

			let signature: string;

			switch (signInput.keyType) {
				case 'Ed25519':
					signature = (await EdDSASigner(hexToBytes(signInput.privateKeyHex))(signBytes)) as string;
					break;
				case 'Secp256k1':
					signature = (await ES256KSigner(hexToBytes(signInput.privateKeyHex))(signBytes)) as string;
					break;
				case 'P256':
					signature = (await ES256Signer(hexToBytes(signInput.privateKeyHex))(signBytes)) as string;
					break;
				default:
					throw new Error(`Unsupported signature type: ${signInput.keyType}`);
			}

			signInfos.push({
				verificationMethodId: signInput.verificationMethodId,
				signature: base64ToBytes(signature),
			});
		}

		return signInfos;
	}
}
