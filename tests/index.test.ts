import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { createCheqdSDK, DIDModule, ICheqdSDKOptions } from '../src/index'
import { exampleCheqdNetwork, faucet } from './testutils.test'
import { AbstractCheqdSDKModule } from '../src/modules/_'
import { CheqdSigningStargateClient } from '../src/signer'

describe(
    'CheqdSDK', () => {
        describe('constructor', () => {
            it('can be instantiated with modules', async () => {
                const options = {
                    modules: [DIDModule as unknown as AbstractCheqdSDKModule],
                    rpcUrl: exampleCheqdNetwork.rpcUrl,
                    wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
                } as ICheqdSDKOptions
                const cheqdSDK = await createCheqdSDK(options)

                const sdkMethods = Object.keys(cheqdSDK.methods)
                const testSigner = await CheqdSigningStargateClient.connectWithSigner(options.rpcUrl, options.wallet)
                const moduleMethods = Object.keys(new DIDModule(testSigner).methods)

                moduleMethods.forEach((method) => {
                    expect(sdkMethods).toContain(method)
                })
            })

            it('should use module methods', async () => {
                const rpcUrl = exampleCheqdNetwork.rpcUrl
                const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
                const testSigner = await CheqdSigningStargateClient.connectWithSigner(rpcUrl, wallet)

                class TestModule extends AbstractCheqdSDKModule {
                    methods = {
                        doSomething: this.doSomething.bind(this)
                    }
                    constructor(signer: CheqdSigningStargateClient) {
                        super(signer)
                    }
                    async doSomething(): Promise<string> {
                        return 'did something'
                    }
                }
                const options = {
                    modules: [TestModule as unknown as AbstractCheqdSDKModule],
                    rpcUrl,
                    wallet 
                } as ICheqdSDKOptions

                const cheqdSDK = await createCheqdSDK(options)

                //@ts-ignore
                const doSomething = await cheqdSDK.doSomething()
                expect(doSomething).toBe('did something')

                //@ts-ignore
                const spy = jest.spyOn(cheqdSDK.methods, 'doSomething')
                //@ts-ignore
                await cheqdSDK.doSomething()
                expect(spy).toHaveBeenCalled()
            })
        })
    }
)