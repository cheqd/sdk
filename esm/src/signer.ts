import {
	EncodeObject,
	isOfflineDirectSigner,
	OfflineSigner,
	encodePubkey,
	TxBodyEncodeObject,
	makeSignDoc,
} from '@cosmjs/proto-signing';
import {
	DeliverTxResponse,
	GasPrice,
	HttpEndpoint,
	SigningStargateClient,
	SigningStargateClientOptions,
	calculateFee,
	SignerData,
	createProtobufRpcClient,
} from '@cosmjs/stargate';
import { CometClient, connectComet } from '@cosmjs/tendermint-rpc';
import { createDefaultCheqdRegistry } from './registry.js';
import {
	MsgCreateDidDocPayload,
	SignInfo,
	MsgUpdateDidDocPayload,
	MsgDeactivateDidDocPayload,
	VerificationMethod,
} from '@cheqd/ts-proto/cheqd/did/v2/index.js';
import { DIDDocument, DidStdFee, ISignInputs, MessageBatch, TSignerAlgo, VerificationMethods } from './types.js';
import { base64ToBytes, EdDSASigner, hexToBytes, Signer, ES256Signer, ES256KSigner } from 'did-jwt';
import { assert, assertDefined } from '@cosmjs/utils';
import { encodeSecp256k1Pubkey, Pubkey } from '@cosmjs/amino';
import { Int53, Uint53 } from '@cosmjs/math';
import { fromBase64 } from '@cosmjs/encoding';
import { AuthInfo, Fee, SignerInfo, Tx, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js';
import { Any } from 'cosmjs-types/google/protobuf/any.js';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin.js';
import {
	GetTxResponse,
	ServiceClientImpl,
	SimulateRequest,
	SimulateResponse,
} from 'cosmjs-types/cosmos/tx/v1beta1/service.js';
import { CheqdQuerier } from './querier.js';
import { TxExtension } from './types';

export function calculateDidFee(gasLimit: number, gasPrice: string | GasPrice): DidStdFee {
	return calculateFee(gasLimit, gasPrice);
}

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
			sequence: BigInt(sequence),
		})
	);
}

export function makeDidAuthInfoBytes(
	signers: ReadonlyArray<{ readonly pubkey: Any; readonly sequence: number }>,
	feeAmount: readonly Coin[],
	gasLimit: bigint,
	feePayer: string,
	signMode = SignMode.SIGN_MODE_DIRECT
): Uint8Array {
	const authInfo = {
		signerInfos: makeSignerInfos(signers, signMode),
		fee: {
			amount: [...feeAmount],
			gasLimit: gasLimit,
			payer: feePayer,
		},
	};
	return AuthInfo.encode(AuthInfo.fromPartial(authInfo)).finish();
}

export class CheqdSigningStargateClient extends SigningStargateClient {
	private didSigners: TSignerAlgo = {};
	private readonly _gasPrice: GasPrice | undefined;
	private readonly _signer: OfflineSigner;
	private readonly endpoint?: string;

	public static async connectWithSigner(
		endpoint: string | HttpEndpoint,
		signer: OfflineSigner,
		options?: (SigningStargateClientOptions & { endpoint?: string }) | undefined
	): Promise<CheqdSigningStargateClient> {
		const cometClient = await connectComet(endpoint);
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

	constructor(
		cometClient: CometClient | undefined,
		signer: OfflineSigner,
		options: SigningStargateClientOptions & { endpoint?: string } = {}
	) {
		super(cometClient, signer, options);
		this._signer = signer;
		this._gasPrice = options.gasPrice;
		this.endpoint = options.endpoint;
	}

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
		const authInfoBytes = makeDidAuthInfoBytes([{ pubkey, sequence }], fee.amount, BigInt(gasLimit), fee.payer!);
		const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
		const { signature, signed } = await this._signer.signDirect(signerAddress, signDoc);
		return TxRaw.fromPartial({
			bodyBytes: signed.bodyBytes,
			authInfoBytes: signed.authInfoBytes,
			signatures: [fromBase64(signature.signature)],
		});
	}

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
		const gasLimit = (await CheqdQuerier.getConsensusParameters(this.endpoint))!.block.maxGas;
		const { gasInfo } = await (
			await this.constructSimulateExtension(querier)
		).tx.simulate(anyMsgs, memo, pubkey, signerAddress, sequence, gasLimit);
		assertDefined(gasInfo);
		return Uint53.fromString(gasInfo.gasUsed.toString()).toNumber();
	}

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
								gasLimit: BigInt(maxGasLimit),
								payer: signerAddress,
							}),
							signerInfos: [
								{
									publicKey,
									modeInfo: {
										single: { mode: SignMode.SIGN_MODE_DIRECT },
									},
									sequence: BigInt(sequence),
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
