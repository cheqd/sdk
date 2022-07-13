import { QueryClient } from "@cosmjs/stargate";
import { CheqdSigningStargateClient } from '../signer'
import { setupDidExtension } from './did'

export abstract class AbstractCheqdSDKModule {
    _signer: CheqdSigningStargateClient

    constructor(signer: CheqdSigningStargateClient) {
        if (!signer) {
            throw new Error("signer is required");
        }
        this._signer = signer
    }
}

export function applyMixins(derivedCtor: any, constructors: any[]): string[] {
    let methods: string[] = []

    constructors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            const property = Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
            if (typeof property !== 'function' || name in derivedCtor.prototype || derivedCtor?.protectedMethods.includes(name)) return

            Object.defineProperty(
                derivedCtor.prototype,
                name,
                property ||
                Object.create(null)
            );

            methods.push(name)
        });
    });

    return methods
}

export type CheqdExtension<K extends string, V = any> = {
    [P in K]: (Record<P, V> & Partial<Record<Exclude<K, P>, never>>) extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never
}[K]

export type CheqdExtensions = CheqdExtension<'did' | 'resources', any>

export const setupCheqdExtensions = (base: QueryClient): CheqdExtensions => {
    return {
        ...setupDidExtension(base),
        /** setupResourcesExtension(base) */
    }
}