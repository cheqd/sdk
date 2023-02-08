import { DirectSecp256k1HdWallet, GeneratedType } from '@cosmjs/proto-signing'
import { createCheqdSDK, DIDModule, ICheqdSDKOptions, ResourceModule } from '../src/index'
import { localnet, faucet } from './testutils.test'
import { AbstractCheqdSDKModule } from '../src/modules/_'
import { CheqdSigningStargateClient } from '../src/signer'
import { createDefaultCheqdRegistry } from '../src/registry'
import { CheqdQuerier } from '../src/querier'
import { setupDidExtension, DidExtension, defaultDidExtensionKey } from '../src/modules/did';
import { QueryExtensionSetup } from '../src/types'
import { setupResourceExtension, ResourceExtension, defaultResourceExtensionKey } from '../src/modules/resource';

describe(
    'CheqdSDK', () => {
        describe('constructor', () => {
            it('can be instantiated with modules', async () => {
                const options = {
                    modules: [DIDModule as unknown as AbstractCheqdSDKModule],
                    rpcUrl: localnet.rpcUrl,
                    wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
                } as ICheqdSDKOptions
                const cheqdSDK = await createCheqdSDK(options)

                const sdkMethods = Object.keys(cheqdSDK.methods)
                const testSigner = await CheqdSigningStargateClient.connectWithSigner(options.rpcUrl, options.wallet)
                const testQuerier = await CheqdQuerier.connectWithExtension(options.rpcUrl, setupDidExtension) as CheqdQuerier & DidExtension
                const moduleMethods = Object.keys(new DIDModule(testSigner, testQuerier).methods)

                moduleMethods.forEach((method) => {
                    expect(sdkMethods).toContain(method)
                })
            })

            it('should use module methods', async () => {
                const rpcUrl = localnet.rpcUrl
                const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)

                class TestModule extends AbstractCheqdSDKModule {
                    registryTypes: Iterable<[string, GeneratedType]> = []
                    methods = {
                        doSomething: this.doSomething.bind(this)
                    }
                    constructor(signer: CheqdSigningStargateClient, querier: CheqdQuerier) {
                        super(signer, querier)
                    }
                    public getRegistryTypes(): Iterable<[string, GeneratedType]> {
                        return TestModule.registryTypes
                    }
                    public getQuerierExtensionSetup(): QueryExtensionSetup<{}> {
                        return () => ({})
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

                const spy = jest.spyOn(cheqdSDK.methods, 'doSomething')
                //@ts-ignore
                await cheqdSDK.doSomething()
                expect(spy).toHaveBeenCalled()
            })

            it('should instantiate registry from passed modules', async () => {
                const options = {
                    modules: [DIDModule as unknown as AbstractCheqdSDKModule],
                    rpcUrl: localnet.rpcUrl,
                    wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
                } as ICheqdSDKOptions
                const cheqdSDK = await createCheqdSDK(options)

                const didRegistryTypes = DIDModule.registryTypes
                const cheqdRegistry = createDefaultCheqdRegistry(didRegistryTypes)

                expect(cheqdSDK.signer.registry).toStrictEqual(cheqdRegistry)
            })

            it('should instantiate registry from multiple passed modules', async () => {
                const options = {
                    modules: [DIDModule as unknown as AbstractCheqdSDKModule, ResourceModule as unknown as AbstractCheqdSDKModule],
                    rpcUrl: localnet.rpcUrl,
                    wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
                } as ICheqdSDKOptions
                const cheqdSDK = await createCheqdSDK(options)

                const didRegistryTypes = DIDModule.registryTypes
                const resourceRegistryTypes = ResourceModule.registryTypes
                const cheqdRegistry = createDefaultCheqdRegistry([...didRegistryTypes, ...resourceRegistryTypes])

                expect(cheqdSDK.signer.registry).toStrictEqual(cheqdRegistry)
            })

            it('should instantiate querier extension from passed modules', async () => {
                const options = {
                    modules: [DIDModule as unknown as AbstractCheqdSDKModule],
                    rpcUrl: localnet.rpcUrl,
                    wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
                } as ICheqdSDKOptions
                const cheqdSDK = await createCheqdSDK(options)

                const querier = await CheqdQuerier.connectWithExtension(options.rpcUrl, setupDidExtension) as CheqdQuerier & DidExtension

                // we need to stringify the querier extension because it's a proxy object
                // and the equality check will fail
                expect(JSON.stringify(cheqdSDK.querier[defaultDidExtensionKey])).toStrictEqual(JSON.stringify(querier[defaultDidExtensionKey]))
            })

            it('should instantiate querier extension from multiple passed modules', async () => {
                const options = {
                    modules: [DIDModule as unknown as AbstractCheqdSDKModule, ResourceModule as unknown as AbstractCheqdSDKModule],
                    rpcUrl: localnet.rpcUrl,
                    wallet: await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic)
                } as ICheqdSDKOptions
                const cheqdSDK = await createCheqdSDK(options)

                const didQuerier = await CheqdQuerier.connectWithExtension(options.rpcUrl, setupDidExtension) as CheqdQuerier & DidExtension
                const resourceQuerier = await CheqdQuerier.connectWithExtension(options.rpcUrl, setupResourceExtension) as CheqdQuerier & ResourceExtension

                // we need to stringify the querier extension because it's a proxy object
                // and the equality check will fail
                expect(JSON.stringify(cheqdSDK.querier[defaultDidExtensionKey])).toStrictEqual(JSON.stringify(didQuerier[defaultDidExtensionKey]))
                expect(JSON.stringify(cheqdSDK.querier[defaultResourceExtensionKey])).toStrictEqual(JSON.stringify(resourceQuerier[defaultResourceExtensionKey]))
            })
        })
    }
)